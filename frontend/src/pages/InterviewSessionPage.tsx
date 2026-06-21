import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { interviewsApi } from '../api/interviews';
import { getErrorMessage } from '../api/client';
import ErrorAlert from '../components/ErrorAlert';
import LoadingSpinner from '../components/LoadingSpinner';
import ScoreGauge from '../components/ScoreGauge';
import type { InterviewSession } from '../types';

export default function InterviewSessionPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<InterviewSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const s = await interviewsApi.getSession(id);
        setSession(s);
        const firstUnanswered = s.questions.findIndex((q) => !q.answer);
        setCurrentIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <ErrorAlert message={error || 'Session not found'} />
        <Link to="/interviews" className="mt-4 inline-block text-brand-600 hover:underline">
          Back to interviews
        </Link>
      </div>
    );
  }

  const isCompleted = session.status === 'COMPLETED';
  const currentQuestion = session.questions[currentIndex];
  const allAnswered = session.questions.every((q) => q.answer);

  const handleSubmitAnswer = async () => {
    if (!id || !currentQuestion || !answer.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      const updated = await interviewsApi.submitAnswer(id, {
        questionId: currentQuestion.id,
        answerText: answer,
      });
      setSession(updated);
      setAnswer('');
      if (currentIndex < updated.questions.length - 1) {
        setCurrentIndex(currentIndex + 1);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    if (!id) return;
    setCompleting(true);
    setError('');
    try {
      const updated = await interviewsApi.completeSession(id);
      setSession(updated);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setCompleting(false);
    }
  };

  if (isCompleted) {
    return (
      <div>
        <Link to="/interviews" className="text-sm text-brand-600 hover:underline">
          ← Back to interviews
        </Link>
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Interview Summary</h1>
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
            {session.overallScore != null && (
              <ScoreGauge score={Number(session.overallScore)} label="Overall Score" />
            )}
            <div className="flex-1">
              {session.summaryFeedback && (
                <p className="text-slate-700">{session.summaryFeedback}</p>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {session.questions.map((q, i) => (
              <div key={q.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-sm font-medium text-slate-900">
                  Q{i + 1}: {q.questionText}
                </p>
                {q.answer && (
                  <>
                    <p className="mt-2 text-sm text-slate-600">{q.answer.answerText}</p>
                    {q.answer.score != null && (
                      <p className="mt-1 text-sm font-medium text-brand-600">
                        Score: {Math.round(Number(q.answer.score))}/100
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/interviews')}
            className="mt-6 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link to="/interviews" className="text-sm text-brand-600 hover:underline">
        ← Back to interviews
      </Link>

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">
            Question {currentIndex + 1} of {session.questions.length}
          </span>
          <span className="rounded-full bg-brand-100 px-2.5 py-0.5 text-xs font-medium text-brand-700">
            {session.interviewType} · {session.difficulty}
          </span>
        </div>

        {currentQuestion && (
          <>
            <h2 className="text-lg font-semibold text-slate-900">{currentQuestion.questionText}</h2>
            {currentQuestion.answer ? (
              <div className="mt-4 rounded-lg bg-slate-50 p-4">
                <p className="text-sm text-slate-700">{currentQuestion.answer.answerText}</p>
                {currentQuestion.answer.score != null && (
                  <p className="mt-2 text-sm font-medium text-brand-600">
                    Score: {Math.round(Number(currentQuestion.answer.score))}/100
                  </p>
                )}
              </div>
            ) : (
              <textarea
                rows={6}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200"
              />
            )}

            <div className="mt-4 flex gap-3">
              {currentIndex > 0 && (
                <button
                  type="button"
                  onClick={() => setCurrentIndex(currentIndex - 1)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Previous
                </button>
              )}
              {!currentQuestion.answer && (
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={submitting || !answer.trim()}
                  className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
                >
                  {submitting && <LoadingSpinner size="sm" />}
                  Submit Answer
                </button>
              )}
              {currentQuestion.answer && currentIndex < session.questions.length - 1 && (
                <button
                  type="button"
                  onClick={() => setCurrentIndex(currentIndex + 1)}
                  className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  Next
                </button>
              )}
              {allAnswered && (
                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completing}
                  className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {completing && <LoadingSpinner size="sm" />}
                  Complete Interview
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
