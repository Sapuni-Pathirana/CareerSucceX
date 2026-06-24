import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { skillsApi } from '../api/skills';
import { profileApi } from '../api/profile';
import { verificationsApi } from '../api/verifications';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import type { Skill, SkillGap, UserSkill, VerificationBadge, VerificationHistoryItem } from '../types';

const priorityColors: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800',
  RECOMMENDED: 'bg-amber-100 text-amber-800',
  NICE_TO_HAVE: 'bg-slate-100 text-slate-700',
};

const sourceLabels: Record<string, string> = {
  CV: 'CV Analysis',
  GITHUB: 'GitHub',
  SELF: 'Self-assessment',
  VERIFIED: 'Quiz verified',
  INTERVIEW: 'Interview',
};

const levelLabels = ['None', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'];

type Tab = 'assessment' | 'mine' | 'gaps' | 'verification';

function LevelPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (level: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {[0, 1, 2, 3, 4, 5].map((level) => (
        <button
          key={level}
          type="button"
          title={levelLabels[level]}
          onClick={() => onChange(level)}
          className={`h-8 min-w-[2rem] rounded-lg px-2 text-xs font-semibold transition ${
            value === level
              ? 'bg-brand-600 text-white shadow-sm'
              : 'border border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50'
          }`}
        >
          {level}
        </button>
      ))}
    </div>
  );
}

export default function SkillsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [taxonomy, setTaxonomy] = useState<Skill[]>([]);
  const [mySkills, setMySkills] = useState<UserSkill[]>([]);
  const [gaps, setGaps] = useState<SkillGap[]>([]);
  const [badges, setBadges] = useState<VerificationBadge[]>([]);
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<Tab>(() => {
    const requested = searchParams.get('tab');
    if (requested === 'verification' || requested === 'mine' || requested === 'gaps' || requested === 'assessment') {
      return requested;
    }
    return 'assessment';
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recalculating, setRecalculating] = useState(false);
  const [targetRoleId, setTargetRoleId] = useState('');
  const [targetRoleTitle, setTargetRoleTitle] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [tax, mine, profile, badgeList, hist] = await Promise.all([
        skillsApi.getTaxonomy(),
        skillsApi.getMine().catch(() => []),
        profileApi.get().catch(() => null),
        verificationsApi.getBadges().catch(() => []),
        verificationsApi.getHistory().catch(() => []),
      ]);

      const roleId = profile?.targetRoleId ?? '';
      setTargetRoleId(roleId);
      setTargetRoleTitle(profile?.targetRoleTitle ?? '');
      const gapList = roleId
        ? await skillsApi.getGaps(roleId).catch(() => [])
        : [];

      const skills = Array.isArray(tax) ? tax : [];
      const userSkills = Array.isArray(mine) ? mine : [];

      setTaxonomy(skills);
      setMySkills(userSkills);
      setGaps(Array.isArray(gapList) ? gapList : []);
      setBadges(Array.isArray(badgeList) ? badgeList : []);
      setHistory(Array.isArray(hist) ? hist : []);

      const selfLevels: Record<string, number> = {};
      userSkills.filter((s) => s.source === 'SELF').forEach((s) => {
        selfLevels[s.skillId] = s.level;
      });
      skills.forEach((s) => {
        if (selfLevels[s.id] == null) selfLevels[s.id] = 0;
      });
      setLevels(selfLevels);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const requested = searchParams.get('tab');
    if (requested === 'verification' || requested === 'mine' || requested === 'gaps' || requested === 'assessment') {
      setTab(requested);
    }
  }, [searchParams]);

  const switchTab = (next: Tab) => {
    setTab(next);
    if (next === 'assessment') {
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', next);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const badgeSkillIds = useMemo(() => new Set(badges.map((b) => b.skillId)), [badges]);

  const filteredTaxonomy = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return taxonomy;
    return taxonomy.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q),
    );
  }, [taxonomy, search]);

  const categories = useMemo(
    () => [...new Set(filteredTaxonomy.map((s) => s.category))],
    [filteredTaxonomy],
  );

  const ratedCount = Object.values(levels).filter((l) => l > 0).length;

  const handleSaveAssessment = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const items = Object.entries(levels)
        .filter(([, level]) => level > 0)
        .map(([skillId, level]) => ({ skillId, level }));
      await skillsApi.updateSelfAssessment(items);
      setSuccess(`Saved self-assessment for ${items.length} skill${items.length === 1 ? '' : 's'}`);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleRecalculate = async () => {
    if (!targetRoleId) {
      setError('Set your target role in Profile before recalculating gaps');
      return;
    }
    setRecalculating(true);
    setError('');
    try {
      const gapList = await skillsApi.recalculateGaps(targetRoleId);
      setGaps(gapList);
      switchTab('gaps');
      setSuccess(`Found ${gapList.length} skill gap${gapList.length === 1 ? '' : 's'} for your target role`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setRecalculating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Skills"
        description="Rate your skills, verify with quizzes, and find gaps for your target role"
        action={
          <button
            type="button"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {recalculating ? 'Recalculating...' : 'Recalculate Gaps'}
          </button>
        }
      />

      <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50 p-4 text-sm text-brand-900">
        <p className="font-semibold">How to check your skills</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-brand-800">
          <li>
            <strong>Self-rate (0–5):</strong> click a number for each skill — 0 = not rated, 5 = expert
          </li>
          <li>
            <strong>Auto-detect:</strong> upload a CV or connect GitHub to detect skills automatically
          </li>
          <li>
            <strong>Quiz verify:</strong> take an AI quiz to earn a verified badge
          </li>
        </ul>
        {targetRoleTitle ? (
          <p className="mt-2 text-brand-700">Target role: {targetRoleTitle}</p>
        ) : (
          <p className="mt-2 text-brand-700">
            No target role set —{' '}
            <Link to="/profile" className="font-medium underline">
              set one in Profile
            </Link>{' '}
            to enable gap analysis
          </p>
        )}
      </div>

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => switchTab('assessment')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'assessment' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          Self-Rate Skills ({ratedCount})
        </button>
        <button
          type="button"
          onClick={() => switchTab('mine')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'mine' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          My Skills ({mySkills.length})
        </button>
        <button
          type="button"
          onClick={() => switchTab('gaps')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'gaps' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          Skill Gaps ({gaps.length})
        </button>
        <button
          type="button"
          onClick={() => switchTab('verification')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'verification' ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 border border-slate-200'
          }`}
        >
          Verification ({badges.length})
        </button>
      </div>

      {tab === 'assessment' && (
        <div className="space-y-6">
          {taxonomy.length === 0 ? (
            <EmptyState
              title="No skills loaded"
              description="Could not load the skill taxonomy. Check your connection and try again."
              action={
                <button
                  type="button"
                  onClick={load}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Retry
                </button>
              }
            />
          ) : (
            <>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search skills (e.g. Python, React)..."
                className="w-full rounded-lg border border-slate-300 px-4 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />

              {filteredTaxonomy.length === 0 ? (
                <EmptyState title="No matching skills" description={`No skills match "${search}"`} />
              ) : (
                categories.map((cat) => (
                  <div key={cat} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h2 className="mb-1 text-lg font-semibold text-slate-900">{cat.replace(/_/g, ' ')}</h2>
                    <p className="mb-4 text-xs text-slate-500">Click 0–5 to rate each skill</p>
                    <div className="space-y-4">
                      {filteredTaxonomy
                        .filter((s) => s.category === cat)
                        .map((skill) => {
                          const existing = mySkills.find((m) => m.skillId === skill.id);
                          const isVerified = badgeSkillIds.has(skill.id);
                          return (
                            <div
                              key={skill.id}
                              className="flex flex-col gap-3 border-b border-slate-100 pb-4 last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="font-medium text-slate-900">{skill.name}</p>
                                  {isVerified && (
                                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                      Verified
                                    </span>
                                  )}
                                </div>
                                {skill.description && (
                                  <p className="text-xs text-slate-500">{skill.description}</p>
                                )}
                                {existing && existing.source !== 'SELF' && (
                                  <p className="text-xs text-slate-500">
                                    Detected from {sourceLabels[existing.source] ?? existing.source} (level{' '}
                                    {existing.level})
                                  </p>
                                )}
                                {(levels[skill.id] ?? 0) > 0 && (
                                  <p className="text-xs font-medium text-brand-600">
                                    Your rating: {levelLabels[levels[skill.id] ?? 0]} ({levels[skill.id]})
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-start gap-2 sm:items-end">
                                <LevelPicker
                                  value={levels[skill.id] ?? 0}
                                  onChange={(level) => setLevels({ ...levels, [skill.id]: level })}
                                />
                                <Link
                                  to={`/verification/${skill.id}`}
                                  className="text-xs font-semibold text-brand-600 hover:underline"
                                >
                                  {isVerified ? 'Retake quiz' : 'Verify with quiz →'}
                                </Link>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))
              )}

              <button
                type="button"
                onClick={handleSaveAssessment}
                disabled={saving || ratedCount === 0}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {saving && <LoadingSpinner size="sm" />}
                Save Self-Assessment ({ratedCount} rated)
              </button>
            </>
          )}
        </div>
      )}

      {tab === 'mine' && (
        mySkills.length === 0 ? (
          <EmptyState
            title="No skills recorded yet"
            description="Rate skills in Self-Rate tab, upload a CV, connect GitHub, or pass a verification quiz"
            action={
              <button
                type="button"
                onClick={() => switchTab('assessment')}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
              >
                Start self-rating
              </button>
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white shadow-sm">
            {mySkills.map((skill) => (
              <li key={`${skill.skillId}-${skill.source}`} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="font-medium text-slate-900">{skill.skillName}</p>
                  <p className="text-xs text-slate-500">{skill.category.replace(/_/g, ' ')}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                    {sourceLabels[skill.source] ?? skill.source}
                  </span>
                  <span className="text-sm font-semibold text-brand-600">Level {skill.level}/5</span>
                  <Link
                    to={`/verification/${skill.skillId}`}
                    className="text-xs font-semibold text-brand-600 hover:underline"
                  >
                    Quiz
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )
      )}

      {tab === 'gaps' &&
        (gaps.length === 0 ? (
          <EmptyState
            title="No skill gaps detected"
            description={
              targetRoleId
                ? 'Complete self-assessment and click Recalculate Gaps, or you may already meet all requirements'
                : 'Set your target role in Profile, rate your skills, then click Recalculate Gaps'
            }
            action={
              targetRoleId ? (
                <button
                  type="button"
                  onClick={handleRecalculate}
                  disabled={recalculating}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  Recalculate Gaps
                </button>
              ) : (
                <Link
                  to="/profile"
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Set target role
                </Link>
              )
            }
          />
        ) : (
          <ul className="space-y-3">
            {gaps.map((gap) => (
              <li
                key={gap.skillId}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div>
                  <p className="font-medium text-slate-900">{gap.skillName}</p>
                  <p className="text-sm text-slate-500">
                    Current: {gap.currentLevel} → Required: {gap.requiredLevel}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/verification/${gap.skillId}`}
                    className="rounded-lg border border-brand-200 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-50"
                  >
                    Practice quiz
                  </Link>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      priorityColors[gap.priority] || priorityColors.NICE_TO_HAVE
                    }`}
                  >
                    {gap.priority.replace(/_/g, ' ')}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ))}

      {tab === 'verification' && (
        <div className="space-y-8">
          {badges.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Your Badges</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {badges.map((badge) => (
                  <div
                    key={badge.skillId}
                    className="flex items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-xl text-white">
                      ✓
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{badge.skillName}</p>
                      <p className="text-sm text-emerald-700">Score: {Math.round(badge.score)}%</p>
                      <p className="text-xs text-slate-500">
                        {new Date(badge.verifiedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div>
            <h2 className="mb-4 text-lg font-semibold text-slate-900">Available Skills</h2>
            {taxonomy.length === 0 ? (
              <EmptyState title="No skills available" description="Skill taxonomy is not loaded yet" />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {taxonomy.map((skill) => (
                  <div
                    key={skill.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{skill.name}</p>
                      <p className="text-xs text-slate-500">{skill.category.replace(/_/g, ' ')}</p>
                      {badgeSkillIds.has(skill.id) && (
                        <span className="mt-1 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                          Verified
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/verification/${skill.id}`}
                      className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      {badgeSkillIds.has(skill.id) ? 'Retake' : 'Start Quiz'}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {history.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Attempt History</h2>
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
                {history.map((item) => (
                  <li key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{item.skillName}</p>
                      <p className="text-xs text-slate-500">
                        Attempt #{item.attemptNumber} · {new Date(item.verifiedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${item.passed ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {Math.round(item.score)}%
                      </p>
                      <p className="text-xs text-slate-500">{item.passed ? 'Passed' : 'Failed'}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
