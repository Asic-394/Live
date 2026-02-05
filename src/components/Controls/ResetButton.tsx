import { useStore } from '../../state/store';

export default function ResetButton() {
  const resetScene = useStore((state) => state.resetScene);
  const loadingState = useStore((state) => state.loadingState);

  return (
    <button
      onClick={resetScene}
      disabled={loadingState === 'loading'}
      className="glass-panel text-gray-100 px-4 py-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
      title="Reset camera and reload current dataset"
    >
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      Reset
    </button>
  );
}
