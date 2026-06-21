import { useEffect, useState } from 'react';
import { profileApi } from '../api/profile';
import { roadmapsApi } from '../api/roadmaps';
import { rolesApi } from '../api/roles';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import type { ItemStatus, Roadmap, TargetRole } from '../types';

const statusOptions: ItemStatus[] = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'];

const statusStyles: Record<ItemStatus, string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-emerald-100 text-emerald-800',
};

const itemTypeIcons: Record<string, string> = {
  LEARN: '📚',
  PROJECT: '🛠️',
  INTERVIEW: '🎤',
  VERIFY: '✅',
};

export default function LearningRoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [history, setHistory] = useState<Roadmap[]>([]);
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [active, hist, r, profile] = await Promise.all([
        roadmapsApi.getActive().catch(() => null),
        roadmapsApi.getHistory().catch(() => []),
        rolesApi.list(),
        profileApi.get().catch(() => null),
      ]);
      setRoadmap(active);
      setHistory(hist);
      setRoles(r);
      if (profile?.targetRoleId) setTargetRoleId(profile.targetRoleId);
      else if (r.length > 0) setTargetRoleId(r[0].id);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleGenerate = async () => {
    if (!targetRoleId) {
      setError('Please select a target role');
      return;
    }
    setGenerating(true);
    setError('');
    try {
      const generated = await roadmapsApi.generate(targetRoleId);
      setRoadmap(generated);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const handleStatusChange = async (itemId: string, status: ItemStatus) => {
    try {
      const updated = await roadmapsApi.updateItemStatus(itemId, status);
      setRoadmap((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.map((item) => (item.id === itemId ? { ...item, ...updated } : item)),
            }
          : prev,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const parseResources = (resources?: string | unknown[]) => {
    if (!resources) return [];
    if (Array.isArray(resources)) return resources;
    try {
      return JSON.parse(resources as string);
    } catch {
      return [];
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const completedCount = roadmap?.items.filter((i) => i.status === 'COMPLETED').length ?? 0;
  const totalCount = roadmap?.items.length ?? 0;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div>
      <PageHeader
        title="Learning Roadmap"
        description="Personalized learning path based on your skill gaps"
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Generate Roadmap</h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700">Target role</label>
            <select
              value={targetRoleId}
              onChange={(e) => setTargetRoleId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {generating && <LoadingSpinner size="sm" />}
            {roadmap ? 'Regenerate' : 'Generate'} Roadmap
          </button>
        </div>
      </div>

      {roadmap ? (
        <div>
          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{roadmap.title}</h2>
                <p className="text-sm text-slate-500">
                  Generated {new Date(roadmap.generatedAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-brand-600">{progress}%</p>
                <p className="text-xs text-slate-500">
                  {completedCount} of {totalCount} completed
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-blue-500 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            {[...roadmap.items]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((item, index) => {
                const resources = parseResources(item.resources);
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-3">
                        <span className="text-2xl">{itemTypeIcons[item.itemType] || '📌'}</span>
                        <div>
                          <p className="text-xs font-medium uppercase text-slate-500">
                            Step {index + 1} · {item.itemType}
                          </p>
                          <h3 className="font-semibold text-slate-900">{item.title}</h3>
                          {item.description && (
                            <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                          )}
                          {item.skillName && (
                            <p className="mt-1 text-xs text-brand-600">Skill: {item.skillName}</p>
                          )}
                          {resources.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {resources.map((res: { title?: string; url?: string }, i: number) => (
                                <li key={i}>
                                  {res.url ? (
                                    <a
                                      href={res.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-brand-600 hover:underline"
                                    >
                                      {res.title || res.url}
                                    </a>
                                  ) : (
                                    <span className="text-sm text-slate-600">
                                      {res.title || JSON.stringify(res)}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                      <select
                        value={item.status}
                        onChange={(e) => handleStatusChange(item.id, e.target.value as ItemStatus)}
                        className={`rounded-lg px-2 py-1 text-xs font-medium ${statusStyles[item.status]}`}
                      >
                        {statusOptions.map((s) => (
                          <option key={s} value={s}>
                            {s.replace(/_/g, ' ')}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      ) : (
        <EmptyState
          title="No active roadmap"
          description="Generate a personalized learning roadmap based on your skill gaps"
        />
      )}

      {history.length > 1 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold text-slate-900">Past Roadmaps</h2>
          <ul className="space-y-2">
            {history
              .filter((h) => h.id !== roadmap?.id)
              .map((h) => (
                <li key={h.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm">
                  {h.title} · {new Date(h.generatedAt).toLocaleDateString()} · {h.status}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
