import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../../state/store';
import { DataService } from '../../services/DataService';

export default function ScenarioSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const currentDataset = useStore((state) => state.currentDataset);
  const loadDataset = useStore((state) => state.loadDataset);
  const resetScene = useStore((state) => state.resetScene);
  const loadingState = useStore((state) => state.loadingState);

  const scenarios = DataService.getDatasets();
  const currentScenario = scenarios.find((s) => s.id === currentDataset);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleScenarioChange = (scenarioId: string) => {
    if (scenarioId !== currentDataset && loadingState !== 'loading') {
      loadDataset(scenarioId);
      setIsOpen(false);
    }
  };

  // Scenario status indicator color
  const getScenarioColor = (scenarioId: string) => {
    switch (scenarioId) {
      case 'scenario_normal':
        return 'text-green-400';
      case 'scenario_congestion':
        return 'text-yellow-400';
      case 'scenario_dock_delay':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loadingState === 'loading'}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
        title="Switch scenario"
      >
        {/* Scenario indicator dot */}
        <span
          className={`w-2 h-2 rounded-full ${
            currentScenario ? getScenarioColor(currentScenario.id) : 'bg-gray-400'
          }`}
        />
        
        <span className="text-sm font-medium text-gray-300 group-hover:text-gray-100 hidden lg:inline">
          {currentScenario?.name || 'Select Scenario'}
        </span>
        
        {/* Dropdown chevron */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-72 glass-panel rounded-lg shadow-xl border border-white/10 z-50 animate-fade-in">
          <div className="p-2">
            <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Select Scenario
            </div>
            
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => handleScenarioChange(scenario.id)}
                disabled={loadingState === 'loading'}
                className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentDataset === scenario.id
                    ? 'bg-blue-500/20 text-blue-300'
                    : 'hover:bg-white/5 text-gray-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Status dot */}
                  <span
                    className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getScenarioColor(
                      scenario.id
                    )}`}
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{scenario.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{scenario.description}</div>
                  </div>
                  
                  {currentDataset === scenario.id && (
                    <svg
                      className="w-4 h-4 text-blue-400 flex-shrink-0 mt-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </button>
            ))}
            
            {/* Reset Button */}
            <div className="border-t border-white/5 mt-2 pt-2">
              <button
                onClick={() => {
                  resetScene();
                  setIsOpen(false);
                }}
                disabled={loadingState === 'loading'}
                className="w-full text-left px-3 py-2.5 rounded-lg transition-colors hover:bg-white/5 text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                title="Reset camera and reload current scenario"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <div className="flex-1">
                  <div className="text-sm font-medium">Reset Scene</div>
                  <div className="text-xs text-gray-400 mt-0.5">Reload and reset camera</div>
                </div>
              </button>
            </div>
          </div>
          
          {loadingState === 'loading' && (
            <div className="border-t border-white/5 p-3">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Loading scenario...
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
