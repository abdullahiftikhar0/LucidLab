import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, addDoc, serverTimestamp, arrayUnion, arrayRemove, increment } from 'firebase/firestore';
import { useFirebaseApp } from 'reactfire';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/TopBar';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import ConfirmDialog from '../../components/ConfirmDialog';

interface ClassroomData {
  name: string; subject: string; description: string; instructorId: string;
  joinCode: string; joinCodeActive: boolean; studentCount: number;
  experimentIds: string[]; archived: boolean;
}
interface Member { id: string; displayName: string; email: string; joinedAt: any; status: string; }
interface ExperimentData { id: string; title: string; category: string; status: string; }

const SUBJECTS = ['Chemistry', 'Physics', 'Biology', 'Environmental Science', 'General Science', 'Other'];

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function ClassroomDetail() {
  const { classroomId } = useParams<{ classroomId: string }>();
  const app = useFirebaseApp();
  const db = getFirestore(app);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [classroom, setClassroom] = useState<ClassroomData | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [experiments, setExperiments] = useState<ExperimentData[]>([]);
  const [submissionCounts, setSubmissionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'students' | 'experiments'>('students');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; title: string; message: string; onConfirm: () => void }>({ open: false, title: '', message: '', onConfirm: () => {} });
  const [editForm, setEditForm] = useState({ name: '', subject: '', description: '' });

  // Assign modal state
  const [availableExperiments, setAvailableExperiments] = useState<ExperimentData[]>([]);
  const [selectedExpIds, setSelectedExpIds] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => { if (classroomId) loadAll(); }, [classroomId]);

  async function loadAll() {
    setLoading(true);
    await Promise.all([loadClassroom(), loadMembers()]);
    setLoading(false);
  }

  async function loadClassroom() {
    const snap = await getDoc(doc(db, 'classrooms', classroomId!));
    if (snap.exists()) {
      const data = snap.data() as ClassroomData;
      setClassroom(data);
      setEditForm({ name: data.name, subject: data.subject, description: data.description });
      if (data.experimentIds?.length) loadExperiments(data.experimentIds);
    }
  }

  async function loadMembers() {
    const snap = await getDocs(collection(db, 'classrooms', classroomId!, 'members'));
    setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Member)));
  }

  async function loadExperiments(ids: string[]) {
    const exps: ExperimentData[] = [];
    const counts: Record<string, number> = {};
    for (const eid of ids) {
      const eSnap = await getDoc(doc(db, 'experiments', eid));
      if (eSnap.exists()) exps.push({ id: eSnap.id, ...eSnap.data() } as ExperimentData);
      const subSnap = await getDocs(query(collection(db, 'submissions'), where('classroomId', '==', classroomId), where('experimentId', '==', eid)));
      counts[eid] = subSnap.size;
    }
    setExperiments(exps);
    setSubmissionCounts(counts);
  }

  function copyCode() {
    if (classroom) { navigator.clipboard.writeText(classroom.joinCode); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 2000); }
  }

  async function regenerateCode() {
    const newCode = generateJoinCode();
    await updateDoc(doc(db, 'classrooms', classroomId!), { joinCode: newCode, updatedAt: serverTimestamp() });
    loadClassroom();
  }

  async function toggleCodeActive() {
    if (!classroom) return;
    await updateDoc(doc(db, 'classrooms', classroomId!), { joinCodeActive: !classroom.joinCodeActive, updatedAt: serverTimestamp() });
    loadClassroom();
  }

  async function archiveClassroom() {
    await updateDoc(doc(db, 'classrooms', classroomId!), { archived: true, updatedAt: serverTimestamp() });
    navigate('/dashboard');
  }

  async function removeMember(member: Member) {
    await deleteDoc(doc(db, 'classrooms', classroomId!, 'members', member.id));
    await updateDoc(doc(db, 'classrooms', classroomId!), { studentCount: increment(-1), updatedAt: serverTimestamp() });
    loadMembers(); loadClassroom();
  }

  async function saveEdit() {
    await updateDoc(doc(db, 'classrooms', classroomId!), { name: editForm.name, subject: editForm.subject, description: editForm.description, updatedAt: serverTimestamp() });
    setShowEditModal(false); loadClassroom();
  }

  async function openAssignModal() {
    const q = query(collection(db, 'experiments'), where('instructorId', '==', currentUser!.uid), where('status', '==', 'published'));
    const snap = await getDocs(q);
    const currentIds = classroom?.experimentIds || [];
    setAvailableExperiments(snap.docs.map(d => ({ id: d.id, ...d.data() } as ExperimentData)).filter(e => !currentIds.includes(e.id)));
    setSelectedExpIds([]);
    setSearchFilter('');
    setShowAssignModal(true);
  }

  async function assignExperiments() {
    for (const eid of selectedExpIds) {
      await updateDoc(doc(db, 'classrooms', classroomId!), { experimentIds: arrayUnion(eid), updatedAt: serverTimestamp() });
      await updateDoc(doc(db, 'experiments', eid), { classroomIds: arrayUnion(classroomId!) });
    }
    setShowAssignModal(false); loadClassroom();
  }

  async function unassignExperiment(eid: string) {
    await updateDoc(doc(db, 'classrooms', classroomId!), { experimentIds: arrayRemove(eid), updatedAt: serverTimestamp() });
    await updateDoc(doc(db, 'experiments', eid), { classroomIds: arrayRemove(classroomId!) });
    loadClassroom();
  }

  function formatDate(ts: any) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  if (loading || !classroom) return (
    <div className="bg-background-light min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TopBar />
      <main className="max-w-[1280px] mx-auto p-6 lg:p-10">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-64" />
          <div className="h-48 bg-slate-200 rounded-xl" />
          <div className="h-64 bg-slate-200 rounded-xl" />
        </div>
      </main>
    </div>
  );

  const SUBJECT_COLORS: Record<string, string> = {
    Biology: 'bg-blue-100 text-blue-700', Physics: 'bg-purple-100 text-purple-700',
    Chemistry: 'bg-emerald-100 text-emerald-700', Other: 'bg-slate-100 text-slate-700',
  };
  const subjectBadge = SUBJECT_COLORS[classroom.subject] || SUBJECT_COLORS.Other;

  return (
    <div className="bg-background-light min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TopBar />
      <main className="max-w-[1280px] w-full mx-auto px-6 py-6 lg:px-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
          <span className="material-symbols-outlined text-sm">chevron_right</span>
          <span className="text-slate-900 font-medium">{classroom.name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="size-16 rounded-xl bg-primary flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight">{classroom.name}</h1>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${subjectBadge}`}>{classroom.subject}</span>
              </div>
              <p className="text-slate-500">{classroom.description || 'No description'} • {classroom.studentCount} Students Enrolled</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowEditModal(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors">
              <span className="material-symbols-outlined text-lg">edit</span> Edit
            </button>
            <button onClick={() => setConfirmDialog({ open: true, title: 'Archive Classroom', message: 'Are you sure you want to archive this classroom? Students will no longer be able to access it.', onConfirm: archiveClassroom })} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-lg">archive</span> Archive
            </button>
          </div>
        </div>

        {/* Join Code Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
          <div className="lg:col-span-2 flex flex-col justify-center p-6 rounded-xl bg-primary shadow-lg shadow-primary/10 relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80 mb-2">
                <span className="material-symbols-outlined text-lg">key</span>
                <span className="text-sm font-medium uppercase tracking-widest">Classroom Access Code</span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-lg px-6 py-4 border border-white/20">
                  <span className="text-3xl lg:text-4xl font-mono font-bold text-white tracking-widest">{classroom.joinCode}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={copyCode} className="p-3 rounded-lg bg-white text-primary hover:bg-slate-100 transition-colors shadow-sm" title="Copy Code">
                    <span className="material-symbols-outlined">{copiedCode ? 'check' : 'content_copy'}</span>
                  </button>
                  <button onClick={regenerateCode} className="p-3 rounded-lg text-white border border-white/20 hover:bg-white/20 transition-colors" title="Regenerate Code">
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <button onClick={toggleCodeActive} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${classroom.joinCodeActive ? 'bg-white' : 'bg-white/30'}`}>
                  <span className={`inline-block h-4 w-4 rounded-full transition-transform ${classroom.joinCodeActive ? 'translate-x-6 bg-primary' : 'translate-x-1 bg-white'}`} />
                </button>
                <span className="text-white/80 text-sm">{classroom.joinCodeActive ? 'Code Active' : 'Code Deactivated'}</span>
              </div>
            </div>
            <div className="absolute -right-12 -bottom-12 opacity-10">
              <span className="material-symbols-outlined text-[200px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_2</span>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Quick Stats</h3>
              <p className="text-sm text-slate-500 mb-4">Class overview</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Students</span>
                <span className="text-lg font-bold text-primary">{classroom.studentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Experiments</span>
                <span className="text-lg font-bold text-emerald-500">{classroom.experimentIds?.length || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 border-b border-slate-200">
          <div className="flex gap-8">
            <button onClick={() => setActiveTab('students')} className={`pb-4 border-b-2 font-bold text-sm flex items-center gap-2 transition-colors ${activeTab === 'students' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <span className="material-symbols-outlined text-lg">group</span> Students ({members.length})
            </button>
            <button onClick={() => setActiveTab('experiments')} className={`pb-4 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${activeTab === 'experiments' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
              <span className="material-symbols-outlined text-lg">biotech</span> Experiments ({experiments.length})
            </button>
          </div>
        </div>

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {members.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200"><EmptyState icon="groups" title="No students yet" description="Share the join code with your students so they can join this classroom." /></div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Student Name</th>
                      <th className="px-6 py-4">Email</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {members.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold">
                              {(m.displayName || 'U').slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-slate-900 text-sm">{m.displayName || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{m.email || '—'}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{formatDate(m.joinedAt)}</td>
                        <td className="px-6 py-4"><StatusBadge status={m.status || 'active'} /></td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => setConfirmDialog({ open: true, title: 'Remove Student', message: `Remove ${m.displayName || 'this student'} from the classroom?`, onConfirm: () => { removeMember(m); setConfirmDialog(p => ({ ...p, open: false })); } })} className="text-red-500 hover:text-red-700 transition-colors">
                            <span className="material-symbols-outlined text-lg">person_remove</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Experiments Tab */}
        {activeTab === 'experiments' && (
          <div className="space-y-6">
            <div className="flex justify-end">
              <button onClick={openAssignModal} className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-primary/90 transition-colors">
                <span className="material-symbols-outlined text-lg">add</span> Assign Experiment
              </button>
            </div>
            {experiments.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200"><EmptyState icon="science" title="No experiments assigned" description="Assign published experiments from your library to this classroom." actionLabel="Assign Experiment" onAction={openAssignModal} /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {experiments.map(exp => (
                  <div key={exp.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 mb-1">{exp.title || 'Untitled'}</h4>
                        <p className="text-xs text-slate-500">{exp.category || 'Science'}</p>
                      </div>
                      <StatusBadge status={exp.status || 'draft'} />
                    </div>
                    <div className="text-xs text-slate-500 mb-4">
                      {submissionCounts[exp.id] || 0} / {classroom.studentCount} submitted
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mb-4">
                      <div className="bg-primary h-full rounded-full" style={{ width: `${classroom.studentCount > 0 ? ((submissionCounts[exp.id] || 0) / classroom.studentCount) * 100 : 0}%` }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Link to={`/evaluation/${classroomId}/${exp.id}`} className="flex-1 py-2 text-xs font-bold text-white bg-primary rounded-lg hover:bg-primary/90 text-center transition-colors">View Submissions</Link>
                      <Link to={`/experiment/${exp.id}`} className="flex-1 py-2 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 text-center transition-colors">Open Editor</Link>
                      <button onClick={() => unassignExperiment(exp.id)} className="p-2 text-red-400 hover:text-red-600 transition-colors" title="Unassign">
                        <span className="material-symbols-outlined text-lg">link_off</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Edit Classroom Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 z-10">
            <h3 className="text-xl font-bold mb-6">Edit Classroom</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Classroom Name</label>
                <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" value={editForm.subject} onChange={e => setEditForm({ ...editForm, subject: e.target.value })}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
                <textarea className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" rows={3} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={saveEdit} className="px-6 py-2.5 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary/90">Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Experiment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4 z-10 max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-bold mb-4">Assign Experiments</h3>
            <input className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm mb-4 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" placeholder="Search experiments..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)} />
            <div className="flex-1 overflow-y-auto space-y-2 mb-4">
              {availableExperiments.filter(e => e.title?.toLowerCase().includes(searchFilter.toLowerCase())).map(exp => (
                <label key={exp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input type="checkbox" className="rounded text-primary focus:ring-primary h-4 w-4" checked={selectedExpIds.includes(exp.id)} onChange={e => setSelectedExpIds(e.target.checked ? [...selectedExpIds, exp.id] : selectedExpIds.filter(id => id !== exp.id))} />
                  <div>
                    <p className="text-sm font-semibold">{exp.title}</p>
                    <p className="text-xs text-slate-500">{exp.category}</p>
                  </div>
                </label>
              ))}
              {availableExperiments.length === 0 && <p className="text-sm text-slate-500 text-center py-8">No published experiments available to assign.</p>}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={assignExperiments} disabled={selectedExpIds.length === 0} className="px-6 py-2.5 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">Assign Selected ({selectedExpIds.length})</button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={confirmDialog.open} title={confirmDialog.title} message={confirmDialog.message} danger onConfirm={() => { confirmDialog.onConfirm(); setConfirmDialog(p => ({ ...p, open: false })); }} onCancel={() => setConfirmDialog(p => ({ ...p, open: false }))} />
    </div>
  );
}
