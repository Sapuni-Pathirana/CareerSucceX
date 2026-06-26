interface CvDocumentPreviewProps {
  fileName: string;
  url: string;
  isPdf: boolean;
  onClose: () => void;
}

export default function CvDocumentPreview({
  fileName,
  url,
  isPdf,
  onClose,
}: CvDocumentPreviewProps) {
  return (
    <div
      className="cv-preview-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Preview ${fileName}`}
      onClick={onClose}
    >
      <div className="cv-preview-panel" onClick={(e) => e.stopPropagation()}>
        <header className="cv-preview-panel__head">
          <p className="cv-preview-panel__title" title={fileName}>
            {fileName}
          </p>
          <div className="cv-preview-panel__actions">
            <a
              href={url}
              download={fileName}
              className="analytics-btn-ghost px-3 py-1.5 text-xs"
            >
              Download
            </a>
            <button
              type="button"
              onClick={onClose}
              className="analytics-btn-ghost px-3 py-1.5 text-xs"
            >
              Close
            </button>
          </div>
        </header>

        {isPdf ? (
          <iframe src={url} title={fileName} className="cv-preview-frame" />
        ) : (
          <div className="cv-preview-fallback">
            <p className="text-sm text-[#c7c8d9]">
              Word documents cannot be previewed in the browser.
            </p>
            <a
              href={url}
              download={fileName}
              className="btn-aurora mt-4 inline-block px-4 py-2 text-sm"
            >
              Download {fileName}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
