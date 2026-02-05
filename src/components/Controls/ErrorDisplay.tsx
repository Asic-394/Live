import { useStore } from '../../state/store';

export default function ErrorDisplay() {
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);

  if (!error) return null;

  return (
    <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 max-w-2xl w-full px-4 z-20">
      <div className="bg-red-500/10 backdrop-blur-xl border border-red-400/30 text-white px-5 py-4 rounded-xl shadow-2xl shadow-black/25">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2 text-red-300">Error Loading Data</h3>
            <pre className="text-sm whitespace-pre-wrap font-mono text-red-200/90">{error}</pre>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-300 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
