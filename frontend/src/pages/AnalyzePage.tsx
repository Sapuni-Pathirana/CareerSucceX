import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import CvAnalysisSection from '../components/CvAnalysisSection';
import GitHubAnalysisSection from '../components/GitHubAnalysisSection';
import PageHeader from '../components/PageHeader';

export default function AnalyzePage() {
  const location = useLocation();

  useEffect(() => {
    if (!location.hash) return;
    const target = document.querySelector(location.hash);
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <div>
      <PageHeader
        title="Analyze"
        description="Upload your CV and connect GitHub to measure your career readiness"
      />

      <section id="cv-analysis" className="mb-10 scroll-mt-24">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">CV Analysis</h2>
        <CvAnalysisSection />
      </section>

      <section id="github-analysis" className="scroll-mt-24">
        <h2 className="mb-4 text-xl font-semibold text-slate-900">GitHub Analysis</h2>
        <GitHubAnalysisSection />
      </section>
    </div>
  );
}
