import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { skillsApi } from '../api/skills';
import { verificationsApi } from '../api/verifications';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import type { Skill, VerificationBadge, VerificationHistoryItem } from '../types';

export default function SkillVerificationPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [badges, setBadges] = useState<VerificationBadge[]>([]);
  const [history, setHistory] = useState<VerificationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [tax, badgeList, hist] = await Promise.all([
          skillsApi.getTaxonomy(),
          verificationsApi.getBadges().catch(() => []),
          verificationsApi.getHistory().catch(() => []),
        ]);
        setSkills(tax);
        setBadges(badgeList);
        setHistory(hist);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const badgeSkillIds = new Set(badges.map((b) => b.skillId));

  return (
    <div>
      <PageHeader
        title="Skill Verification"
        description="Prove your skills with AI-graded quizzes and earn badges"
      />

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {badges.length > 0 && (
        <div className="mb-8">
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

      <h2 className="mb-4 text-lg font-semibold text-slate-900">Available Skills</h2>
      {skills.length === 0 ? (
        <EmptyState title="No skills available" description="Skill taxonomy is not loaded yet" />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-slate-900">{skill.name}</p>
                <p className="text-xs text-slate-500">{skill.category}</p>
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

      {history.length > 0 && (
        <div className="mt-8">
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
  );
}
