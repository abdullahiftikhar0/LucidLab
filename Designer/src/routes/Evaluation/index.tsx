import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getFirestore, collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { useFirebaseApp } from 'reactfire';
import { useAuth } from '../../contexts/AuthContext';
import TopBar from '../../components/TopBar';
import { generateInitials } from '../../utils/storageHelpers';

interface Submission {
  id: string; studentId: string; studentName: string; studentEmail: string;
  submittedAt: any; status: string; quizScore: number; quizTotal: number;
  quizAnswers: { question: string; answer: string; correct: boolean; correctAnswer?: string }[];
  completedSteps: number; totalSteps: number; completionPercentage: number;
  variables: Record<string, string>; recordingUrl: string;
  instructorFeedback: string; grade: string;
}

interface ClassroomData { name: string; subject: string; studentCount: number; }
interface ExperimentData { title: string; category: string; }

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Pending' },
  graded: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Graded' },
  correct: { bg: 'bg-green-50', text: 'text-green-600', label: 'Correct' },
  incorrect: { bg: 'bg-red-50', text: 'text-red-600', label: 'Incorrect' },
  needs_revision: { bg: 'bg-rose-50', text: 'text-rose-600', label: 'Needs Revision' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'In Progress' },
};

export default function EvaluationPage() {
  const { classroomId, experimentId } = useParams<{ classroomId: string; experimentId: string }>();
  const app = useFirebaseApp();
  const db = getFirestore(app);
  const { currentUser } = useAuth();

  const [classroom, setClassroom] = useState<ClassroomData | null>(null);
  const [experiment, setExperiment] = useState<ExperimentData | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'graded'>('all');
  const [saving, setSaving] = useState(false);

  // Grade form
  const [gradeStatus, setGradeStatus] = useState('pending');
  const [feedback, setFeedback] = useState('');

  useEffect(() => { loadAll(); }, [classroomId, experimentId]);

  async function loadAll() {
    setLoading(true);
    try {
      // Load classroom
      if (classroomId) {
        const cSnap = await getDoc(doc(db, 'classrooms', classroomId));
        if (cSnap.exists()) setClassroom(cSnap.data() as ClassroomData);
        const membersSnap = await getDocs(collection(db, 'classrooms', classroomId, 'members'));
        setTotalStudents(membersSnap.size || (cSnap.data() as ClassroomData)?.studentCount || 0);
      }
      // Load experiment
      if (experimentId) {
        const eSnap = await getDoc(doc(db, 'experiments', experimentId));
        if (eSnap.exists()) setExperiment(eSnap.data() as ExperimentData);
      }
      // Load submissions
      if (classroomId && experimentId) {
        const q = query(
          collection(db, 'submissions'),
          where('classroomId', '==', classroomId),
          where('experimentId', '==', experimentId),
          orderBy('submittedAt', 'desc')
        );
        const snap = await getDocs(q);
        const subs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Submission));
        setSubmissions(subs);
        if (subs.length > 0) {
          setSelectedId(subs[0].id);
          setGradeStatus(subs[0].status || 'pending');
          setFeedback(subs[0].instructorFeedback || '');
        }
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  function selectSubmission(sub: Submission) {
    setSelectedId(sub.id);
    setGradeStatus(sub.status || 'pending');
    setFeedback(sub.instructorFeedback || '');
  }

  async function saveGrade() {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'submissions', selectedId), {
        status: gradeStatus,
        grade: gradeStatus,
        instructorFeedback: feedback,
        updatedAt: serverTimestamp(),
      });
      setSubmissions(prev => prev.map(s => s.id === selectedId ? { ...s, status: gradeStatus, instructorFeedback: feedback } : s));
    } catch (e) { console.error(e); }
    setSaving(false);
  }

  function formatDate(ts: any) {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  }

  const filteredSubmissions = submissions.filter(s => {
    if (filterTab === 'pending') return s.status === 'pending' || !s.status;
    if (filterTab === 'graded') return s.status === 'graded' || s.status === 'correct' || s.status === 'incorrect';
    return true;
  });

  const selected = submissions.find(s => s.id === selectedId) || null;
  const statusStyle = (s: string) => STATUS_STYLES[s?.toLowerCase()?.replace(/\s+/g, '_')] || STATUS_STYLES.pending;

  if (loading) return (
    <div className="bg-background-light min-h-screen" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TopBar />
      <div className="flex items-center justify-center h-96"><div className="animate-pulse text-slate-400">Loading submissions...</div></div>
    </div>
  );

  return (
    <div className="bg-background-light font-display min-h-screen flex flex-col" style={{ fontFamily: "'Inter', sans-serif" }}>
      <TopBar />

      <main className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
        {/* Left Panel — Submission List */}
        <aside className="w-80 md:w-96 border-r border-slate-200 bg-white flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-slate-900">Submissions</h3>
              <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-1 rounded-full">{submissions.length}/{totalStudents}</span>
            </div>
            <div className="flex gap-2">
              {(['all', 'pending', 'graded'] as const).map(tab => (
                <button key={tab} onClick={() => setFilterTab(tab)} className={`flex-1 text-xs font-semibold py-1.5 px-3 rounded-md capitalize ${filterTab === tab ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredSubmissions.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No submissions found.</div>
            ) : (
              filteredSubmissions.map(sub => {
                const ss = statusStyle(sub.status);
                return (
                  <div key={sub.id} onClick={() => selectSubmission(sub)} className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${selectedId === sub.id ? 'bg-primary/5 border-l-4 border-l-primary' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold text-slate-900 text-sm">{sub.studentName || 'Unknown Student'}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${ss.text} ${ss.bg} px-1.5 py-0.5 rounded`}>{ss.label}</span>
                    </div>
                    <p className="text-xs text-slate-500 mb-2">{classroom?.name || 'Classroom'}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="material-symbols-outlined text-sm">quiz</span>
                        <span className="text-xs font-medium">{sub.quizScore ?? '—'}/{sub.quizTotal ?? '—'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{formatDate(sub.submittedAt)}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Right Panel — Detail Workspace */}
        <section className="flex-1 flex flex-col overflow-y-auto bg-background-light p-6">
          {!selected ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <span className="material-symbols-outlined text-5xl mb-4">assignment</span>
              <p className="font-medium">{submissions.length === 0 ? 'No submissions yet for this experiment' : 'Select a submission to view details'}</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1 text-sm text-slate-500">
                    <Link to="/dashboard" className="hover:text-primary">Dashboard</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <Link to={`/classrooms/${classroomId}`} className="hover:text-primary">{classroom?.name || 'Classroom'}</Link>
                    <span className="material-symbols-outlined text-xs">chevron_right</span>
                    <span className="text-primary font-medium">{selected.studentName}</span>
                  </div>
                  <h1 className="text-2xl font-bold text-slate-900">Submission Review: {experiment?.title || 'Experiment'}</h1>
                </div>
                <div className="flex items-center gap-3">
                  {(() => {
                    const idx = filteredSubmissions.findIndex(s => s.id === selectedId);
                    return <>
                      <button onClick={() => idx > 0 && selectSubmission(filteredSubmissions[idx - 1])} disabled={idx <= 0} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors">Previous</button>
                      <button onClick={() => idx < filteredSubmissions.length - 1 && selectSubmission(filteredSubmissions[idx + 1])} disabled={idx >= filteredSubmissions.length - 1} className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold bg-white hover:bg-slate-50 disabled:opacity-50 transition-colors">Next</button>
                    </>;
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  {/* Recording Player */}
                  {selected.recordingUrl && (
                    <div className="bg-slate-900 rounded-xl overflow-hidden aspect-video relative">
                      <video className="w-full h-full object-cover" src={selected.recordingUrl} controls />
                      <div className="absolute top-4 left-4">
                        <span className="bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-medium border border-white/10 flex items-center gap-2">
                          <span className="size-2 bg-red-500 rounded-full" /> AR Recording
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Experiment State */}
                  {(selected.completedSteps || selected.totalSteps) && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">analytics</span> Experiment Progress
                      </h3>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-slate-600">Steps: {selected.completedSteps || 0} / {selected.totalSteps || 0} completed</span>
                        <span className="text-sm font-bold text-primary">{selected.completionPercentage || Math.round(((selected.completedSteps || 0) / (selected.totalSteps || 1)) * 100)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mb-4">
                        <div className="bg-primary h-full transition-all" style={{ width: `${selected.completionPercentage || Math.round(((selected.completedSteps || 0) / (selected.totalSteps || 1)) * 100)}%` }} />
                      </div>
                      {selected.variables && Object.keys(selected.variables).length > 0 && (
                        <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-100">
                          {Object.entries(selected.variables).map(([key, val]) => (
                            <div key={key} className="bg-slate-50 rounded-lg px-3 py-2">
                              <span className="text-xs text-slate-400 font-medium uppercase">{key}</span>
                              <p className="text-sm font-semibold text-slate-900">{val}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Quiz Results */}
                  {selected.quizAnswers && selected.quizAnswers.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 p-6">
                      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary">quiz</span> Quiz Performance
                        <span className="ml-auto text-sm font-medium text-slate-500">Score: {selected.quizScore}/{selected.quizTotal}</span>
                      </h3>
                      <div className="space-y-4">
                        {selected.quizAnswers.map((qa, i) => (
                          <div key={i} className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                            <div className="flex justify-between mb-2">
                              <p className="text-sm font-semibold">Q{i + 1}: {qa.question}</p>
                              <span className={`material-symbols-outlined ${qa.correct ? 'text-emerald-500' : 'text-rose-500'}`}>
                                {qa.correct ? 'check_circle' : 'cancel'}
                              </span>
                            </div>
                            <p className="text-sm text-slate-600 italic">&ldquo;{qa.answer}&rdquo;</p>
                            {!qa.correct && qa.correctAnswer && (
                              <p className="text-xs text-rose-500 mt-2 font-medium">Correct answer: {qa.correctAnswer}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Right Side — Student Info + Grading */}
                <div className="space-y-6">
                  <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Student Info</h3>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="size-12 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold">
                        {generateInitials(selected.studentName || '', selected.studentEmail)}
                      </div>
                      <div>
                        <p className="font-bold">{selected.studentName || 'Unknown'}</p>
                        <p className="text-xs text-slate-500">{selected.studentEmail || classroom?.name || '—'}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Progress</p>
                        <p className="text-sm font-bold">{selected.completionPercentage || 0}% Complete</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Quiz Score</p>
                        <p className="text-sm font-bold">{selected.quizScore ?? '—'}/{selected.quizTotal ?? '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Grading Card */}
                  <div className="bg-white rounded-xl border-2 border-primary/20 p-6 shadow-xl shadow-primary/5">
                    <h3 className="text-lg font-bold mb-4">Evaluation</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold mb-1.5">Status</label>
                        <select value={gradeStatus} onChange={e => setGradeStatus(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary">
                          <option value="pending">Pending Review</option>
                          <option value="correct">Correct</option>
                          <option value="incorrect">Incorrect</option>
                          <option value="needs_revision">Needs Revision</option>
                          <option value="graded">Graded - Approved</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-1.5">Instructor Feedback</label>
                        <textarea value={feedback} onChange={e => setFeedback(e.target.value)} className="w-full bg-slate-50 border-slate-200 rounded-lg text-sm focus:ring-primary focus:border-primary placeholder:text-slate-400" placeholder="Provide constructive feedback..." rows={5} />
                      </div>
                      <button onClick={saveGrade} disabled={saving} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60">
                        {saving ? (
                          <span className="material-symbols-outlined text-lg animate-spin">progress_activity</span>
                        ) : (
                          <>
                            <span className="material-symbols-outlined">save</span> Submit Grade
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
