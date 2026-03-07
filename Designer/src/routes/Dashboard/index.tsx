import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getFirestore, collection, query, where, getDocs, addDoc, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseApp } from 'reactfire';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/TopBar';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import { uploadCoverImage } from '../../utils/storageHelpers';

interface Classroom {
  id: string;
  name: string;
  subject: string;
  description: string;
  joinCode: string;
  studentCount: number;
  experimentIds: string[];
  coverImageURL?: string;
}

interface Experiment {
  id: string;
  title: string;
  category: string;
  status: string;
  experimentCode: string;
  updatedAt: any;
}

const SUBJECT_COLORS: Record<string, { bg: string; text: string }> = {
  Biology: { bg: 'bg-blue-100', text: 'text-blue-700' },
  Physics: { bg: 'bg-purple-100', text: 'text-purple-700' },
  Chemistry: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Environmental Science': { bg: 'bg-teal-100', text: 'text-teal-700' },
  'General Science': { bg: 'bg-indigo-100', text: 'text-indigo-700' },
  Other: { bg: 'bg-slate-100', text: 'text-slate-700' },
};

const SUBJECTS = ['Chemistry', 'Physics', 'Biology', 'Environmental Science', 'General Science', 'Other'];

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function DashboardHome() {
  const app = useFirebaseApp();
  const db = getFirestore(app);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loadingClassrooms, setLoadingClassrooms] = useState(true);
  const [loadingExperiments, setLoadingExperiments] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: '', subject: 'Chemistry', description: '' });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadClassrooms();
    loadExperiments();
  }, [currentUser]);

  async function loadClassrooms() {
    setLoadingClassrooms(true);
    try {
      // Single where clause to avoid requiring a composite index
      const q = query(
        collection(db, 'classrooms'),
        where('instructorId', '==', currentUser!.uid)
      );
      const snap = await getDocs(q);
      // Filter archived client-side
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Classroom));
      setClassrooms(all.filter(c => !(c as any).archived));
    } catch (e) { console.error(e); }
    setLoadingClassrooms(false);
  }

  async function loadExperiments() {
    setLoadingExperiments(true);
    try {
      // Single where clause only — sort client-side to avoid composite index
      const q = query(
        collection(db, 'experiments'),
        where('instructorId', '==', currentUser!.uid)
      );
      const snap = await getDocs(q);
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Experiment));
      // Sort by updatedAt descending, take latest 10
      all.sort((a, b) => {
        const aTime = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : 0;
        const bTime = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : 0;
        return bTime - aTime;
      });
      setExperiments(all.slice(0, 10));
    } catch (e) { console.error(e); }
    setLoadingExperiments(false);
  }

  async function handleCreateClassroom() {
    if (!newClassroom.name.trim()) return;
    setCreating(true);
    try {
      let joinCode = generateJoinCode();
      // Check uniqueness (simple approach)
      const codeCheck = await getDocs(query(collection(db, 'classrooms'), where('joinCode', '==', joinCode)));
      if (!codeCheck.empty) joinCode = generateJoinCode();

      const docRef = await addDoc(collection(db, 'classrooms'), {
        name: newClassroom.name.trim(),
        subject: newClassroom.subject,
        description: newClassroom.description.trim(),
        instructorId: currentUser!.uid,
        joinCode,
        joinCodeActive: true,
        studentCount: 0,
        experimentIds: [],
        coverImageURL: '',
        archived: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      // Upload cover image if selected
      if (coverFile) {
        try {
          const url = await uploadCoverImage(docRef.id, coverFile);
          await setDoc(doc(db, 'classrooms', docRef.id), { coverImageURL: url }, { merge: true });
        } catch (e) { console.warn('Cover upload failed:', e); }
      }
      // Use setDoc with merge:true so it creates the user doc if it doesn't exist yet
      await setDoc(doc(db, 'users', currentUser!.uid), {
        classroomIds: [docRef.id],
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setShowCreateModal(false);
      setNewClassroom({ name: '', subject: 'Chemistry', description: '' });
      setCoverFile(null); setCoverPreview(null);
      loadClassrooms();
    } catch (e) { console.error(e); }
    setCreating(false);
  }

  function copyCode(code: string) {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  function formatDate(ts: any) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const subjectColor = (s: string) => SUBJECT_COLORS[s] || SUBJECT_COLORS.Other;

  return (
    <div className="bg-background-light min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TopBar />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col p-6 lg:p-10">
        <div className="mb-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Instructor Dashboard</h1>
          <p className="mt-2 text-slate-500">Manage your AR classrooms and active science experiments in real-time.</p>
        </div>

        {/* My Classrooms Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">My Classrooms</h2>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              New Classroom
            </button>
          </div>

          {loadingClassrooms ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse rounded-xl border border-slate-200 bg-white p-5 h-48" />
              ))}
            </div>
          ) : classrooms.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <EmptyState
                icon="school"
                title="No classrooms yet"
                description="Create your first classroom to start organizing students and assigning experiments."
                actionLabel="Create Classroom"
                onAction={() => setShowCreateModal(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {classrooms.map(c => (
                <Link
                  to={`/classrooms/${c.id}`}
                  key={c.id}
                  className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all hover:shadow-md"
                >
                  {/* Cover Image Banner */}
                  <div className={`h-28 relative overflow-hidden ${c.coverImageURL ? '' : 'bg-gradient-to-br from-primary/20 to-primary/5'}`}>
                    {c.coverImageURL ? (
                      <img src={c.coverImageURL} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>science</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3">
                      <span className={`inline-flex rounded-full ${subjectColor(c.subject).bg} px-2.5 py-0.5 text-xs font-semibold ${subjectColor(c.subject).text} shadow-sm`}>
                        {c.subject}
                      </span>
                    </div>
                    <span className="absolute top-3 right-3 material-symbols-outlined text-white/60 group-hover:text-white/90 drop-shadow">chevron_right</span>
                  </div>
                  <div className="flex flex-col p-5">
                    <h3 className="text-lg font-bold">{c.name}</h3>
                    <div className="mt-3 flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base text-slate-400">groups</span>
                        <span>{c.studentCount} Students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-base text-slate-400">science</span>
                        <span>{c.experimentIds?.length || 0} Experiments</span>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 p-3">
                      <code className="font-mono text-sm font-bold text-slate-700 tracking-wider">{c.joinCode}</code>
                      <button
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyCode(c.joinCode); }}
                        className="flex items-center gap-1 text-xs font-bold text-primary hover:opacity-80"
                      >
                        <span className="material-symbols-outlined text-sm">{copiedCode === c.joinCode ? 'check' : 'content_copy'}</span>
                        {copiedCode === c.joinCode ? 'COPIED!' : 'COPY CODE'}
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Recent Experiments Section */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">Recent Experiments</h2>
            <Link to="/experiments" className="text-sm font-semibold text-primary hover:underline">View All</Link>
          </div>

          {loadingExperiments ? (
            <div className="animate-pulse rounded-xl border border-slate-200 bg-white h-64" />
          ) : experiments.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <EmptyState
                icon="science"
                title="No experiments yet"
                description="Create your first experiment to get started with AR science content."
                actionLabel="Create Experiment"
                onAction={() => navigate('/experiments')}
              />
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Experiment Title</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Code</th>
                    <th className="px-6 py-4">Updated</th>
                    <th className="px-6 py-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {experiments.map(exp => (
                    <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{exp.title || 'Untitled'}</td>
                      <td className="px-6 py-4">{exp.category || '—'}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={exp.status || 'draft'} />
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{exp.experimentCode || '—'}</td>
                      <td className="px-6 py-4 text-slate-500">{formatDate(exp.updatedAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Link to={`/experiment/${exp.id}`} className="text-primary font-bold hover:underline">
                          {exp.status === 'published' ? 'Manage' : 'Edit'}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="material-symbols-outlined text-xl">science</span>
            <span className="text-sm font-medium">© 2026 LucidLab. All rights reserved.</span>
          </div>
          <div className="flex gap-8 text-sm font-medium text-slate-500">
            <a className="hover:text-primary" href="#">Support</a>
            <a className="hover:text-primary" href="#">Privacy Policy</a>
          </div>
        </div>
      </footer>

      {/* Create Classroom Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)} />
          <div className="relative bg-white rounded-xl shadow-2xl border border-slate-200 p-6 max-w-lg w-full mx-4 z-10">
            <h3 className="text-xl font-bold text-slate-900 mb-6">Create Classroom</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Classroom Name *</label>
                <input
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="e.g., Chemistry Grade 10-A"
                  value={newClassroom.name}
                  onChange={e => setNewClassroom({ ...newClassroom, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject *</label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  value={newClassroom.subject}
                  onChange={e => setNewClassroom({ ...newClassroom, subject: e.target.value })}
                >
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                  placeholder="Brief description of this classroom..."
                  rows={3}
                  value={newClassroom.description}
                  onChange={e => setNewClassroom({ ...newClassroom, description: e.target.value })}
                />
              </div>
              {/* Cover Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Cover Image <span className="text-slate-400 font-normal">(Optional)</span></label>
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-32 rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 hover:border-primary/50 hover:bg-primary/5 transition-all flex flex-col items-center justify-center gap-2 overflow-hidden relative"
                >
                  {coverPreview ? (
                    <>
                      <img src={coverPreview} alt="Cover" className="w-full h-full object-cover absolute inset-0" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-slate-400 text-2xl">add_photo_alternate</span>
                      <span className="text-xs text-slate-400">Click to upload cover image</span>
                    </>
                  )}
                </button>
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (f) { setCoverFile(f); setCoverPreview(URL.createObjectURL(f)); }
                  }}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateClassroom}
                disabled={creating || !newClassroom.name.trim()}
                className="px-6 py-2.5 rounded-lg bg-primary text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {creating && <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
