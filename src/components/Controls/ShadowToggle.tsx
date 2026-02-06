import { useStore } from '../../state/store';

export default function ShadowToggle() {
  const useRealShadows = useStore((state) => state.useRealShadows);
  const setUseRealShadows = useStore((state) => state.setUseRealShadows);

  const toggleShadows = () => {
    setUseRealShadows(!useRealShadows);
  };

  return (
    <button
      onClick={toggleShadows}
      className="glass-panel px-3 py-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200 flex items-center gap-2"
      title={`${useRealShadows ? 'Disable' : 'Enable'} real-time shadows`}
      aria-label={`${useRealShadows ? 'Disable' : 'Enable'} real-time shadows`}
    >
      {useRealShadows ? (
        <svg
          className="w-5 h-5 text-cyan-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
          />
        </svg>
      ) : (
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
      <span className="text-xs font-medium text-gray-200">
        {useRealShadows ? 'Real Shadows' : 'Fast Shadows'}
      </span>
    </button>
  );
}
