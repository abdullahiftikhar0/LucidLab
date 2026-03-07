import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useExperiment from '../core/hooks/useExperiment';

export default function SceneManager() {
  const { expName } = useParams();
  const navigate = useNavigate();
  const { experiment, scenes, createScene } = useExperiment(expName!);

  const defaultSceneName = 'Main Scene';

  async function handleContinue() {
    if (!expName) return;

    // Only ever use a single scene. If one exists, reuse it; otherwise create it.
    let targetSceneName = defaultSceneName;
    if (scenes && scenes.length > 0) {
      targetSceneName = (scenes as any[])[0].name;
    } else {
      await createScene(defaultSceneName);
    }

    navigate(`scene/${encodeURIComponent(targetSceneName)}`);
  }

  const exp = experiment as any;
  const title = exp?.title || expName;
  const category = exp?.category || 'General Science';
  const status = (exp?.status || 'draft') as string;
  const updatedAt = exp?.updatedAt;

  let updatedLabel = 'Not edited yet';
  if (updatedAt?.toDate) {
    const d = updatedAt.toDate() as Date;
    updatedLabel = `Last edited ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-background-dark font-display text-slate-100">
      {/* Background mesh + AR icons */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[100px]" />
        <div className="absolute top-20 right-20 opacity-20 rotate-12">
          <span className="material-symbols-outlined text-[120px] text-primary">deployed_code</span>
        </div>
        <div className="absolute bottom-20 left-20 opacity-10 -rotate-12">
          <span className="material-symbols-outlined text-[180px] text-primary">view_in_ar</span>
        </div>
        <div className="absolute top-1/2 left-10 opacity-10">
          <span className="material-symbols-outlined text-[60px] text-primary">blur_on</span>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Center Setup Card */}
        <div className="w-full max-w-[640px] rounded-2xl p-10 flex flex-col items-center text-center shadow-2xl border border-white/10 bg-slate-900/80 backdrop-blur-2xl">
          <p className="text-[11px] font-bold tracking-[0.2em] text-primary uppercase mb-6">
            Experiment Overview
          </p>

          <h1 className="text-4xl font-bold text-white tracking-tight mb-4">
            {title || 'Untitled Experiment'}
          </h1>

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
              <span className="material-symbols-outlined text-sm">science</span>
              {category}
            </div>
            <div
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                status === 'published'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
              } border`}
            >
              <span className="material-symbols-outlined text-sm">
                {status === 'published' ? 'verified' : 'edit_note'}
              </span>
              {status === 'published' ? 'Published' : 'Draft'}
            </div>
          </div>

          <p className="text-slate-300 text-lg leading-relaxed mb-8 max-w-[480px]">
            This experiment uses a single scene. When you continue, we&apos;ll automatically prepare the 3D
            environment for you—no manual scene management required.
          </p>

          <div className="w-full h-px bg-white/10 mb-8" />

          <div className="flex flex-col items-center gap-6 w-full">
            <button
              onClick={handleContinue}
              className="group w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-8 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
            >
              Continue to Editor
              <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>

            <div className="flex items-center justify-between w-full">
              <button
                type="button"
                onClick={() => navigate('/experiments')}
                className="text-slate-400 hover:text-slate-200 text-sm font-medium transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Back to Experiments
              </button>
              <p className="text-slate-500 text-sm italic">
                {updatedLabel}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Simple footer accent bar */}
      <div className="relative z-10 h-1 w-full flex">
        <div className="h-full flex-1 bg-primary/20" />
        <div className="h-full flex-1 bg-primary/40" />
        <div className="h-full flex-1 bg-primary/60" />
        <div className="h-full flex-1 bg-primary/40" />
        <div className="h-full flex-1 bg-primary/20" />
      </div>
    </div>
  );
}
