import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { verificationsApi } from '../api/verifications';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import ScoreGauge from '../components/ScoreGauge';
import type { QuizQuestion, StartVerificationResponse, VerificationSubmitResponse } from '../types';

export default function VerificationQuizPage() {
  const { skillId } = useParams<{ skillId: string }>();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<StartVerificationResponse | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<VerificationSubmitResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!skillId) return;
    const start = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await verificationsApi.start(skillId);
        setQuiz(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    start();
  }, [skillId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await verificationsApi.submit(quiz.verificationId, quiz.questions, answers);
      setResult(res);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (result) {
    return (
      <div>
        <Link to="/skills?tab=verification" className="text-sm text-brand-600 hover:underline">
          ← Back to skills
        </Link>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="flex justify-center">
            <ScoreGauge score={result.score} label="Your Score" />
          </div>
          <p
            className={`mt-4 text-xl font-bold ${result.passed ? 'text-emerald-600' : 'text-amber-600'}`}
          >
            {result.passed ? '🎉 Congratulations! You earned a badge!' : 'Keep practicing — you can retake the quiz'}
          </p>
          {result.feedback && (
            <p className="mt-2 text-sm text-slate-600">
              {(result.feedback as { summary?: string }).summary || JSON.stringify(result.feedback)}
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate('/skills?tab=verification')}
            className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div>
        <ErrorAlert message={error || 'Failed to start quiz'} />
        <Link to="/skills?tab=verification" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to skills
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link to="/skills?tab=verification" className="text-sm text-brand-600 hover:underline">
        ← Back to skills
      </Link>

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {quiz.questions.map((q: QuizQuestion, index) => (
          <div key={q.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="mb-4 font-medium text-slate-900">
              {index + 1}. {q.question}
            </p>

            {q.type === 'MCQ' && q.options ? (
              <div className="space-y-2">
                {q.options.map((opt) => (
                  <label
                    key={opt}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
                      answers[q.id] === opt
                        ? 'border-brand-400 bg-brand-50'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={opt}
                      checked={answers[q.id] === opt}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      className="accent-brand-600"
                    />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <textarea
                rows={3}
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                placeholder="Your answer..."
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
                required
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={submitting || quiz.questions.some((q) => !answers[q.id])}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting && <LoadingSpinner size="sm" />}
          Submit Quiz
        </button>
      </form>
    </div>
  );
}
