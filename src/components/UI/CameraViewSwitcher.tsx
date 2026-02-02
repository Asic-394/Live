import { useStore } from '../../state/store';
import type { CameraMode } from '../../types';

export default function CameraViewSwitcher() {
  const cameraMode = useStore((state) => state.cameraMode);
  const setCameraMode = useStore((state) => state.setCameraMode);

  const handleToggle = (mode: CameraMode) => {
    setCameraMode(mode);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 bg-gray-900/90 backdrop-blur-sm rounded-lg p-2 border border-gray-700 shadow-lg">
      <button
        onClick={() => handleToggle('orthographic')}
        className={`
          relative group flex items-center justify-center w-12 h-12 rounded-md transition-all
          ${cameraMode === 'orthographic' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }
        `}
        title="Orthographic View"
      >
        {/* Orthographic Icon - Top-down grid */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="4" width="16" height="16" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="12" y1="4" x2="12" y2="20" />
          <line x1="8" y1="4" x2="8" y2="20" />
          <line x1="16" y1="4" x2="16" y2="20" />
          <line x1="4" y1="8" x2="20" y2="8" />
          <line x1="4" y1="16" x2="20" y2="16" />
        </svg>
        {/* Tooltip */}
        <span className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Orthographic
        </span>
      </button>

      <button
        onClick={() => handleToggle('perspective')}
        className={`
          relative group flex items-center justify-center w-12 h-12 rounded-md transition-all
          ${cameraMode === 'perspective' 
            ? 'bg-blue-600 text-white shadow-md' 
            : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
          }
        `}
        title="Perspective View"
      >
        {/* Perspective Icon - 3D cube */}
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2 L21 7 L21 17 L12 22 L3 17 L3 7 Z" />
          <line x1="12" y1="2" x2="12" y2="12" />
          <line x1="12" y1="12" x2="21" y2="17" />
          <line x1="12" y1="12" x2="3" y2="17" />
          <line x1="12" y1="12" x2="21" y2="7" />
          <line x1="12" y1="12" x2="3" y2="7" />
        </svg>
        {/* Tooltip */}
        <span className="absolute right-full mr-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Perspective
        </span>
      </button>
    </div>
  );
}
