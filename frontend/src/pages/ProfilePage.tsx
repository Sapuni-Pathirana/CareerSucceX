import { useEffect, useState } from 'react';
import { profileApi } from '../api/profile';
import { rolesApi } from '../api/roles';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import PageHeader from '../components/PageHeader';
import type { Profile, TargetRole } from '../types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<TargetRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    fullName: '',
    university: '',
    degree: '',
    graduationYear: '',
    targetRoleId: '',
    bio: '',
    avatarUrl: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [p, r] = await Promise.all([profileApi.get(), rolesApi.list()]);
        setProfile(p);
        setRoles(r);
        setForm({
          fullName: p.fullName || '',
          university: p.university || '',
          degree: p.degree || '',
          graduationYear: p.graduationYear?.toString() || '',
          targetRoleId: p.targetRoleId || '',
          bio: p.bio || '',
          avatarUrl: p.avatarUrl || '',
        });
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const updated = await profileApi.update({
        fullName: form.fullName,
        university: form.university,
        degree: form.degree,
        graduationYear: form.graduationYear ? parseInt(form.graduationYear, 10) : undefined,
        targetRoleId: form.targetRoleId || undefined,
        bio: form.bio,
        avatarUrl: form.avatarUrl,
      });
      setProfile(updated);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
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
      <PageHeader title="Profile Settings" description="Manage your personal and career information" />

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

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Full name</label>
            <input
              type="text"
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">University</label>
            <input
              type="text"
              value={form.university}
              onChange={(e) => setForm({ ...form, university: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Degree</label>
            <input
              type="text"
              value={form.degree}
              onChange={(e) => setForm({ ...form, degree: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Graduation year</label>
            <input
              type="number"
              min={2020}
              max={2035}
              value={form.graduationYear}
              onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Target role</label>
            <select
              value={form.targetRoleId}
              onChange={(e) => setForm({ ...form, targetRoleId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            >
              <option value="">Select a role</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Bio</label>
            <textarea
              rows={4}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700">Avatar URL</label>
            <input
              type="url"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
            />
          </div>
        </div>

        {profile?.targetRoleTitle && (
          <p className="text-sm text-slate-500">Current target: {profile.targetRoleTitle}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {saving && <LoadingSpinner size="sm" />}
          Save changes
        </button>
      </form>
    </div>
  );
}
