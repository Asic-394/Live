import React from 'react';
import WarehouseIcon from '../UI/WarehouseIcon';
import LocationSelector from '../UI/LocationSelector';
import LensSwitcher from '../UI/LensSwitcher';
import ScenarioSwitcher from '../UI/ScenarioSwitcher';

export default function TopNavBar() {
  return (
    <div className="fixed top-12 left-0 right-0 z-20 h-14 glass-panel border-b border-gray-200 dark:border-white/5">
      <div className="flex items-center justify-between h-full px-4 gap-4">
        {/* Left: App Branding + Location */}
        <div className="flex items-center gap-4">
          {/* App Branding */}
          <div className="flex items-center gap-2">
            <WarehouseIcon className="text-blue-500 dark:text-blue-400 w-5 h-5" />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 hidden md:inline">
              Warehouse Live
            </span>
          </div>
          
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300 dark:bg-white/10 hidden md:block" />
          
          {/* Location Selector */}
          <LocationSelector />
        </div>
        
        {/* Center: Lens Switcher */}
        <div className="flex-1 flex items-center justify-center max-w-3xl">
          <LensSwitcher />
        </div>
        
        {/* Right: Scenario Switcher */}
        <div className="flex items-center gap-3">
          <ScenarioSwitcher />
        </div>
      </div>
    </div>
  );
}
