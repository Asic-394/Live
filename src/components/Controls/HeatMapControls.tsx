import { useStore } from '../../state/store';
import { Box, Layers, Wind, Activity } from 'lucide-react';

export default function HeatMapControls() {
    const {
        heatMapMode,
        heatMapIntensity,
        particleAnimationEnabled,
        setHeatMapMode,
        setHeatMapIntensity,
        toggleParticleAnimation
    } = useStore(state => ({
        heatMapMode: state.heatMapMode,
        heatMapIntensity: state.heatMapIntensity,
        particleAnimationEnabled: state.particleAnimationEnabled,
        setHeatMapMode: state.setHeatMapMode,
        setHeatMapIntensity: state.setHeatMapIntensity,
        toggleParticleAnimation: state.toggleParticleAnimation
    }));

    return (
        <div className="mt-4 pt-4 border-t border-white/10 space-y-4">
            {/* Mode Selector */}
            <div className="space-y-2">
                <label className="text-xs font-medium text-gray-400 block">Visualization Mode</label>
                <div className="grid grid-cols-3 gap-1 bg-black/20 p-1 rounded-lg border border-white/5">
                    <button
                        onClick={() => setHeatMapMode('gradient')}
                        className={`
              flex flex-col items-center justify-center p-1.5 rounded-md text-xs transition-all
              ${heatMapMode === 'gradient'
                                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
                        title="Standard 2D Gradient"
                    >
                        <Layers size={14} className="mb-0.5" />
                        <span>Map</span>
                    </button>

                    <button
                        onClick={() => setHeatMapMode('column')}
                        className={`
              flex flex-col items-center justify-center p-1.5 rounded-md text-xs transition-all
              ${heatMapMode === 'column'
                                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30 shadow-sm'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
                        title="3D Column Chart"
                    >
                        <Box size={14} className="mb-0.5" />
                        <span>3D Col</span>
                    </button>

                    <button
                        onClick={() => setHeatMapMode('particle')}
                        className={`
              flex flex-col items-center justify-center p-1.5 rounded-md text-xs transition-all
              ${heatMapMode === 'particle'
                                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}
            `}
                        title="Particle Density Cloud"
                    >
                        <Wind size={14} className="mb-0.5" />
                        <span>Cloud</span>
                    </button>
                </div>
            </div>

            {/* Intensity Slider */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                    <label>Intensity Scale</label>
                    <span className="font-mono text-gray-500">{(heatMapIntensity * 100).toFixed(0)}%</span>
                </div>
                <input
                    type="range"
                    min="0.3"
                    max="1.0"
                    step="0.1"
                    value={heatMapIntensity}
                    onChange={(e) => setHeatMapIntensity(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400"
                />
            </div>

            {/* Animation Toggle (for Particle mode) */}
            {heatMapMode === 'particle' && (
                <div className="flex items-center justify-between">
                    <label className="text-xs text-gray-400 flex items-center gap-1.5">
                        <Activity size={12} />
                        <span>Animate Particles</span>
                    </label>
                    <button
                        onClick={toggleParticleAnimation}
                        className={`
              w-8 h-4 rounded-full p-0.5 transition-colors relative
              ${particleAnimationEnabled ? 'bg-blue-500/50' : 'bg-gray-700'}
            `}
                    >
                        <div
                            className={`
                w-3 h-3 rounded-full bg-white shadow-sm transform transition-transform duration-200
                ${particleAnimationEnabled ? 'translate-x-4' : 'translate-x-0'}
              `}
                        />
                    </button>
                </div>
            )}
        </div>
    );
}
