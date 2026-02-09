import React from 'react';
import { useStore } from '../../state/store';
import BlueYonderLogo from '../UI/BlueYonderLogo';
import NotificationIcon from '../UI/NotificationIcon';
import ProfileIcon from '../UI/ProfileIcon';
import KPITicker from './KPITicker';
import { MonitoringService } from '../../services/MonitoringService';
import type { KPI } from '../../types';

export default function ObjectiveBar() {
  const selectKPI = useStore((state) => state.selectKPI);
  const setActiveOverlay = useStore((state) => state.setActiveOverlay);
  const setDrillDownData = useStore((state) => state.setDrillDownData);
  const currentDataset = useStore((state) => state.currentDataset);

  const handleKPIClick = async (kpi: KPI) => {
    console.log('KPI clicked in ticker:', kpi);
    
    // Activate overlay if available
    if (kpi.overlayType) {
      setActiveOverlay(kpi.overlayType);
    }
    
    // Load and set drill-down data
    if (currentDataset) {
      try {
        const snapshot = await MonitoringService.loadKPISnapshot(currentDataset);
        const drillDown = MonitoringService.getDrillDownData(snapshot, kpi.id);
        
        if (drillDown) {
          setDrillDownData({
            kpiId: kpi.id,
            drivers: drillDown
          });
        }
      } catch (error) {
        console.error('Failed to load drill-down data:', error);
      }
    }
    
    // Select the KPI to highlight it in the sidebar
    selectKPI(kpi.id);
  };

  const handleNotificationClick = () => {
    console.log('Notifications clicked');
    // TODO: Open notification panel
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
    // TODO: Open profile menu
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-20 h-12 glass-panel border-b border-white/5">
      <div className="flex items-center justify-between h-full px-4 gap-4">
        {/* Left: Blue Yonder Logo */}
        <div className="flex-shrink-0 flex items-center">
          <BlueYonderLogo className="h-6 text-gray-300" />
        </div>
        
        {/* Center: KPI Ticker */}
        <div className="flex-1 mx-6 overflow-hidden">
          <KPITicker onKPIClick={handleKPIClick} />
        </div>
        
        {/* Right: Notification and Profile Icons */}
        <div className="flex-shrink-0 flex items-center gap-1">
          <NotificationIcon 
            className="text-gray-400 hover:text-gray-200"
            count={0}
            onClick={handleNotificationClick}
          />
          <ProfileIcon 
            className="text-gray-400 hover:text-gray-200"
            onClick={handleProfileClick}
          />
        </div>
      </div>
    </div>
  );
}
