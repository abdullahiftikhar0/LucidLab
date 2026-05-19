import { useToast } from '@chakra-ui/react';
import { debounce } from 'debounce';
import { motion } from 'framer-motion';
import React from 'react';
import {
  importSketchfabModel,
  sanitizeAssetName,
  searchSketchfabModels,
  sketchfabEmbedUrl,
  SketchfabSearchResult,
} from '../../api/sketchfab';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  existingAssetNames: string[];
  onImported: () => void;
};

export default function SketchfabSearchModal({
  isOpen,
  onClose,
  existingAssetNames,
  onImported,
}: Props) {
  const toast = useToast();
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SketchfabSearchResult[]>([]);
  const [selectedUid, setSelectedUid] = React.useState<string | null>(null);
  const [assetNames, setAssetNames] = React.useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = React.useState(false);
  const [searchError, setSearchError] = React.useState<string | null>(null);
  const [importingUid, setImportingUid] = React.useState<string | null>(null);
  const [nextCursor, setNextCursor] = React.useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = React.useState(false);

  const existingLower = React.useMemo(
    () => new Set(existingAssetNames.map(n => n.toLowerCase())),
    [existingAssetNames],
  );

  const selected = results.find(r => r.uid === selectedUid) ?? null;

  const runSearch = React.useMemo(
    () =>
      debounce(async (q: string) => {
        const trimmed = q.trim();
        if (!trimmed) {
          setResults([]);
          setSelectedUid(null);
          setNextCursor(null);
          setSearchError(null);
          return;
        }
        setIsSearching(true);
        setSearchError(null);
        try {
          const data = await searchSketchfabModels(trimmed);
          setResults(data.results);
          setNextCursor(data.nextCursor);
          const names: Record<string, string> = {};
          for (const item of data.results) {
            names[item.uid] = sanitizeAssetName(item.name) || `asset_${item.uid.slice(0, 8)}`;
          }
          setAssetNames(names);
          setSelectedUid(data.results[0]?.uid ?? null);
          if (data.results.length === 0) {
            setSearchError('No downloadable models found. Try a different search.');
          }
        } catch (err) {
          setResults([]);
          setSelectedUid(null);
          setNextCursor(null);
          setSearchError(err instanceof Error ? err.message : 'Search failed');
        } finally {
          setIsSearching(false);
        }
      }, 400),
    [],
  );

  React.useEffect(() => {
    if (!isOpen) return;
    runSearch(query);
  }, [query, isOpen, runSearch]);

  React.useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      setSelectedUid(null);
      setAssetNames({});
      setSearchError(null);
      setNextCursor(null);
    }
  }, [isOpen]);

  async function loadMore() {
    if (!nextCursor || !query.trim() || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await searchSketchfabModels(query.trim(), nextCursor);
      setResults(prev => [...prev, ...data.results]);
      setNextCursor(data.nextCursor);
      setAssetNames(prev => {
        const next = { ...prev };
        for (const item of data.results) {
          if (!next[item.uid]) {
            next[item.uid] = sanitizeAssetName(item.name) || `asset_${item.uid.slice(0, 8)}`;
          }
        }
        return next;
      });
    } catch (err) {
      toast({
        title: 'Could not load more',
        description: err instanceof Error ? err.message : 'Try again',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleImport(model: SketchfabSearchResult) {
    const name = sanitizeAssetName(assetNames[model.uid] || model.name);
    if (!name) {
      toast({
        title: 'Invalid name',
        description: 'Enter a valid asset name using letters, numbers, _ or -',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (existingLower.has(name.toLowerCase())) {
      toast({
        title: 'Name already exists',
        description: 'Rename this asset or pick another model.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    setImportingUid(model.uid);
    try {
      await importSketchfabModel(model.uid, name);
      toast({
        title: 'Asset added',
        description: `"${name}" was imported to your library.`,
        status: 'success',
        duration: 2500,
        isClosable: true,
      });
      existingLower.add(name.toLowerCase());
      onImported();
    } catch (err) {
      toast({
        title: 'Import failed',
        description: err instanceof Error ? err.message : 'Could not import model',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setImportingUid(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto py-4 px-4">
      <div className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[calc(100dvh-1rem)] bg-white border border-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col my-2">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="h-24 sm:h-28 px-6 sm:px-8 flex items-center justify-between shrink-0 bg-[#E6F9F5]"
        >
          <motion.div className="flex items-center gap-3">
            <motion.div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border border-[#bfe9e2] text-[#169A92] shadow-sm">
              <span className="material-symbols-outlined text-xl">travel_explore</span>
            </motion.div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Search Sketchfab Assets</h2>
          </motion.div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm hover:bg-slate-50 text-slate-600"
            aria-label="Close"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </motion.div>

        <div className="p-5 sm:p-6 flex flex-col gap-4 min-h-0 flex-1 overflow-hidden">
          <div className="relative shrink-0">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[#169A92] text-xl">
              search
            </span>
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search downloadable 3D models (e.g. microscope, beaker)..."
              className="w-full bg-white border-2 border-[#bfe9e2] rounded-full pl-12 pr-12 py-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#169A92]"
              autoFocus
            />
            {isSearching && (
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#169A92] animate-spin text-xl">
                progress_activity
              </span>
            )}
          </div>

          {searchError && !isSearching && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 shrink-0">
              {searchError}
            </p>
          )}

          <motion.div className="flex flex-col lg:flex-row gap-4 min-h-0 flex-1 overflow-hidden">
            <div className="lg:w-[42%] flex flex-col min-h-0 border border-[#bfe9e2] rounded-3xl bg-[#f7fcfb] overflow-hidden">
              <div className="px-4 py-3 border-b border-[#bfe9e2] shrink-0">
                <p className="text-xs font-semibold text-[#169A92] uppercase tracking-wider">Results</p>
              </div>
              <div className="flex-1 overflow-y-auto min-h-[200px] lg:min-h-0 p-2 space-y-2">
                {results.length === 0 && !isSearching && !searchError && (
                  <p className="text-sm text-slate-500 text-center py-8 px-4">
                    Search for downloadable Sketchfab models to import as GLB assets.
                  </p>
                )}
                {results.map(model => {
                  const isSelected = model.uid === selectedUid;
                  const isImporting = importingUid === model.uid;
                  const name = assetNames[model.uid] ?? '';
                  const nameTaken = existingLower.has(name.toLowerCase());

                  return (
                    <div
                      key={model.uid}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedUid(model.uid)}
                      onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ' ') setSelectedUid(model.uid);
                      }}
                      className={`w-full text-left rounded-2xl border p-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#169A92] bg-white shadow-sm'
                          : 'border-transparent bg-white/70 hover:border-[#9ddfd5]'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-16 h-16 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                          {model.thumbnailUrl ? (
                            <img
                              src={model.thumbnailUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <span className="material-symbols-outlined">view_in_ar</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{model.name}</p>
                          {model.authorName && (
                            <p className="text-xs text-slate-500 truncate">by {model.authorName}</p>
                          )}
                          <label className="block mt-2">
                            <span className="text-[10px] font-bold tracking-wider text-[#169A92]">
                              ASSET NAME
                            </span>
                            <input
                              type="text"
                              value={name}
                              onClick={e => e.stopPropagation()}
                              onChange={e =>
                                setAssetNames(prev => ({
                                  ...prev,
                                  [model.uid]: e.target.value,
                                }))
                              }
                              className="mt-1 w-full text-xs bg-white border border-[#bfe9e2] rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#169A92]"
                            />
                          </label>
                          {nameTaken && (
                            <p className="text-[10px] text-red-500 mt-1">Name already in library</p>
                          )}
                          <button
                            type="button"
                            disabled={isImporting || !!importingUid || nameTaken || !name.trim()}
                            onClick={e => {
                              e.stopPropagation();
                              handleImport(model);
                            }}
                            className="mt-2 w-full bg-[#1FB6AB] hover:bg-[#169A92] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold py-2 rounded-full flex items-center justify-center gap-1"
                          >
                            {isImporting ? (
                              <span className="material-symbols-outlined animate-spin text-sm">
                                progress_activity
                              </span>
                            ) : (
                              <span className="material-symbols-outlined text-sm">add</span>
                            )}
                            {isImporting ? 'Importing...' : 'Add Asset'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              {nextCursor && (
                <div className="p-3 border-t border-[#bfe9e2] shrink-0">
                  <button
                    type="button"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                    className="w-full text-sm font-semibold text-[#169A92] py-2 rounded-full border border-[#bfe9e2] hover:bg-white disabled:opacity-50"
                  >
                    {isLoadingMore ? 'Loading...' : 'Load more'}
                  </button>
                </div>
              )}
            </div>

            <div className="lg:flex-1 flex flex-col min-h-[280px] lg:min-h-0 border border-[#bfe9e2] rounded-3xl overflow-hidden bg-slate-50">
              <motion.div className="px-4 py-3 border-b border-[#bfe9e2] bg-[#f7fcfb] shrink-0">
                <p className="text-xs font-semibold text-[#169A92] uppercase tracking-wider">Preview</p>
              </motion.div>
              <div className="flex-1 min-h-0 relative bg-slate-900">
                {selected ? (
                  <>
                    <iframe
                      title={`Preview ${selected.name}`}
                      src={sketchfabEmbedUrl(selected.uid)}
                      className="absolute inset-0 w-full h-full border-0"
                      allow="autoplay; fullscreen; xr-spatial-tracking"
                      allowFullScreen
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 pointer-events-none">
                      <p className="text-white font-semibold text-sm truncate">{selected.name}</p>
                      {selected.authorName && (
                        <p className="text-slate-300 text-xs truncate">by {selected.authorName}</p>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                    <span className="material-symbols-outlined text-5xl mb-3">view_in_ar</span>
                    <p className="text-sm">Select a model to preview</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          <p className="text-[11px] text-slate-500 text-center shrink-0">
            Only downloadable Sketchfab models are shown. Each model is licensed under its author&apos;s terms on
            Sketchfab.
          </p>
        </div>
      </div>
    </div>
  );
}
