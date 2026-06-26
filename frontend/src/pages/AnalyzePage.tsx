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
    <div className="analytics-dash">
      <PageHeader
        theme="dark"
        badge="Career insights"
        title="Analyze"
        description="Upload your CV and connect GitHub to measure your career readiness"
      />

      <div className="analytics-analyze-layout">
        <section id="cv-analysis" className="analytics-card scroll-mt-24">
          <CvAnalysisSection />
        </section>

        <section id="github-analysis" className="analytics-card scroll-mt-24">
          <GitHubAnalysisSection />
        </section>
      </div>
    </div>
  );
}
