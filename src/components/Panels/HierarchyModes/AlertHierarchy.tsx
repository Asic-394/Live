import { useState } from 'react';
import { useStore } from '../../../state/store';
import type { KPI } from '../../../types';

interface AlertItemProps {
  title: string;
  severity: 'critical' | 'warning' | 'monitoring';
  description: string;
  location?: string;
  affectedCount?: number;
  recommendation?: string;
  onView: () => void;
}

function AlertItem({ title, severity, description, location, affectedCount, recommendation, onView }: AlertItemProps) {
  const severityStyles = {
    critical: {
      border: 'border-red-400/30',
      bg: 'bg-red-500/10',
      icon: '🔴',
      titleColor: 'text-red-300',
      badge: 'bg-red-500/20 text-red-400 border-red-400/30'
    },
    warning: {
      border: 'border-amber-400/30',
      bg: 'bg-amber-500/10',
      icon: '🟡',
      titleColor: 'text-amber-300',
      badge: 'bg-amber-500/20 text-amber-400 border-amber-400/30'
    },
    monitoring: {
      border: 'border-blue-400/30',
      bg: 'bg-blue-500/10',
      icon: '🟢',
      titleColor: 'text-blue-300',
      badge: 'bg-blue-500/20 text-blue-400 border-blue-400/30'
    }
  };

  const style = severityStyles[severity];

  return (
    <div className={`p-3 rounded-lg border ${style.border} ${style.bg} mb-2`}>
      <div className="flex items-start gap-2 mb-2">
        <span className="text-lg">{style.icon}</span>
        <div className="flex-1">
          <div className={`text-sm font-medium ${style.titleColor} mb-1`}>{title}</div>
          <div className="text-xs text-gray-400">{description}</div>
          {location && (
            <div className="text-xs text-gray-500 mt-1">📍 {location}</div>
          )}
          {affectedCount !== undefined && (
            <div className="text-xs text-gray-500 mt-1">👥 {affectedCount} entities affected</div>
          )}
        </div>
      </div>
      
          {recommendation && (
        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-white/10">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">💡 Recommendation:</div>
          <div className="text-xs text-gray-700 dark:text-gray-300">{recommendation}</div>
        </div>
      )}
      
      <button
        onClick={onView}
        className="mt-2 text-xs px-3 py-1.5 rounded bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 transition-colors border border-gray-200 dark:border-white/10"
      >
        View on Map
      </button>
    </div>
  );
}

export default function AlertHierarchy() {
  const kpis = useStore((state) => state.kpis);
  const entities = useStore((state) => state.entities);
  const overlayData = useStore((state) => state.overlayData);
  const focusOnZone = useStore((state) => state.focusOnZone);
  const highlightZones = useStore((state) => state.highlightZones);
  const [searchQuery, setSearchQuery] = useState('');

  // Categorize KPIs by status
  const criticalKPIs = kpis.filter(kpi => kpi.status === 'Critical');
  const watchKPIs = kpis.filter(kpi => kpi.status === 'Watch');
  const normalKPIs = kpis.filter(kpi => kpi.status === 'Normal');

  // Generate alerts from KPIs
  const generateAlerts = () => {
    const alerts: Array<{
      title: string;
      severity: 'critical' | 'warning' | 'monitoring';
      description: string;
      location?: string;
      affectedCount?: number;
      recommendation?: string;
      zoneId?: string;
    }> = [];

    // Critical alerts
    criticalKPIs.forEach(kpi => {
      if (kpi.id === 'zone_congestion') {
        // Find zones with high congestion from overlay data
        const congestionData = overlayData.get('heat_congestion');
        if (congestionData) {
          const criticalZones = congestionData
            .filter(d => d.intensity > 0.8)
            .sort((a, b) => b.intensity - a.intensity);
          
          criticalZones.forEach(zoneData => {
            const zoneEntities = entities.filter(e => e.zone === zoneData.zoneId);
            alerts.push({
              title: `${zoneData.zoneId} Congestion`,
              severity: 'critical',
              description: `High worker density (${zoneData.value.toFixed(2)}) blocking aisles`,
              location: zoneData.zoneId,
              affectedCount: zoneEntities.length,
              recommendation: 'Redistribute 3 workers to less congested zones',
              zoneId: zoneData.zoneId
            });
          });
        }
      } else if (kpi.id === 'orders_at_risk') {
        alerts.push({
          title: 'Orders at Risk',
          severity: 'critical',
          description: `${kpi.value} orders likely to miss SLA`,
          recommendation: 'Review order priorities and reassign resources if needed'
        });
      } else if (kpi.id === 'equipment_uptime') {
        const lowBatteryEquipment = entities.filter(e => 
          e.entity_type === 'forklift' && 
          e.battery_level !== undefined && 
          e.battery_level < 50
        );
        if (lowBatteryEquipment.length > 0) {
          alerts.push({
            title: 'Equipment Low Battery',
            severity: 'critical',
            description: `${lowBatteryEquipment.length} forklift(s) below 50% battery`,
            affectedCount: lowBatteryEquipment.length,
            recommendation: 'Send to charging station or swap with fully charged equipment'
          });
        }
      }
    });

    // Warning alerts
    watchKPIs.forEach(kpi => {
      if (kpi.id === 'throughput') {
        alerts.push({
          title: 'Throughput Below Target',
          severity: 'warning',
          description: `Current: ${kpi.value} orders/hr • Target: 50`,
          recommendation: 'Identify bottlenecks and optimize workflow'
        });
      } else if (kpi.id === 'zone_congestion') {
        const congestionData = overlayData.get('heat_congestion');
        if (congestionData) {
          const warningZones = congestionData
            .filter(d => d.intensity > 0.65 && d.intensity <= 0.8)
            .slice(0, 3);
          
          warningZones.forEach(zoneData => {
            const zoneEntities = entities.filter(e => e.zone === zoneData.zoneId);
            alerts.push({
              title: `${zoneData.zoneId} Approaching Congestion`,
              severity: 'warning',
              description: `Worker density: ${zoneData.value.toFixed(2)}`,
              location: zoneData.zoneId,
              affectedCount: zoneEntities.length,
              zoneId: zoneData.zoneId
            });
          });
        }
      }
    });

    // Monitoring items
    normalKPIs.forEach(kpi => {
      if (kpi.id === 'space_utilization' && kpi.value > 80) {
        alerts.push({
          title: 'Space Utilization High',
          severity: 'monitoring',
          description: `${kpi.value}% capacity used • Approaching 85% threshold`,
          recommendation: 'No action needed yet, but monitor closely'
        });
      }
    });

    return alerts;
  };

  const alerts = generateAlerts();
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');
  const monitoringAlerts = alerts.filter(a => a.severity === 'monitoring');

  // Filter based on search
  const filteredCritical = criticalAlerts.filter(a => 
    !searchQuery || 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredWarnings = warningAlerts.filter(a => 
    !searchQuery || 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredMonitoring = monitoringAlerts.filter(a => 
    !searchQuery || 
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.location?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewOnMap = (alert: typeof alerts[0]) => {
    if (alert.zoneId) {
      focusOnZone(alert.zoneId, true);
      highlightZones([alert.zoneId]);
    }
  };

  return (
    <div className="w-full text-gray-900 dark:text-gray-100 flex flex-col">
      {/* Search */}
      <div className="mb-3 px-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search alerts..."
          className="w-full bg-black/5 dark:bg-white/5 border border-gray-300 dark:border-white/10 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-blue-400/50"
        />
      </div>

      {/* Alerts */}
      <div className="max-h-[400px] overflow-y-auto space-y-3 px-2">
        {/* Critical Issues */}
        {filteredCritical.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-red-400 mb-2 uppercase tracking-wider">
              Critical Issues ({filteredCritical.length})
            </div>
            {filteredCritical.map((alert, index) => (
              <AlertItem
                key={`critical-${index}`}
                title={alert.title}
                severity="critical"
                description={alert.description}
                location={alert.location}
                affectedCount={alert.affectedCount}
                recommendation={alert.recommendation}
                onView={() => handleViewOnMap(alert)}
              />
            ))}
          </div>
        )}

        {/* Warnings */}
        {filteredWarnings.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-amber-400 mb-2 uppercase tracking-wider">
              Warnings ({filteredWarnings.length})
            </div>
            {filteredWarnings.map((alert, index) => (
              <AlertItem
                key={`warning-${index}`}
                title={alert.title}
                severity="warning"
                description={alert.description}
                location={alert.location}
                affectedCount={alert.affectedCount}
                recommendation={alert.recommendation}
                onView={() => handleViewOnMap(alert)}
              />
            ))}
          </div>
        )}

        {/* Monitoring */}
        {filteredMonitoring.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-blue-400 mb-2 uppercase tracking-wider">
              Monitoring ({filteredMonitoring.length})
            </div>
            {filteredMonitoring.map((alert, index) => (
              <AlertItem
                key={`monitoring-${index}`}
                title={alert.title}
                severity="monitoring"
                description={alert.description}
                location={alert.location}
                recommendation={alert.recommendation}
                onView={() => handleViewOnMap(alert)}
              />
            ))}
          </div>
        )}

        {alerts.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-8">
            No active alerts
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/10 text-xs flex justify-between px-2">
        <span className="text-red-600 dark:text-red-400">{criticalAlerts.length} critical</span>
        <span className="text-amber-600 dark:text-amber-400">{warningAlerts.length} warnings</span>
        <span className="text-blue-600 dark:text-blue-400">{monitoringAlerts.length} monitoring</span>
      </div>
    </div>
  );
}
