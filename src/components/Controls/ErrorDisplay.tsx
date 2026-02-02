import { useStore } from '../../state/store';

export default function ErrorDisplay() {
  const error = useStore((state) => state.error);
  const setError = useStore((state) => state.setError);

  if (!error) return null;

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 max-w-2xl w-full px-4 z-20">
      <div className="bg-red-900/90 backdrop-blur-md border border-red-700/70 text-white px-4 py-3 rounded-xl shadow-2xl">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-bold text-lg mb-1">Error Loading Data</h3>
            <pre className="text-sm whitespace-pre-wrap font-mono">{error}</pre>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-300 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
