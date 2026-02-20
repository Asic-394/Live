import type { CameraAction } from '../types/agent';
import type { WarehouseLayoutElement, Entity } from '../types';
import { CameraController } from '../utils/CameraController';
import { Camera } from 'three';

export class CameraCommandService {
    /**
     * Execute an array of agent actions
     */
    static executeActions(
        actions: CameraAction[],
        storeActions: any,
        controlsRef: React.RefObject<any>,
        camera: Camera | null,
        warehouseLayout: WarehouseLayoutElement[] | null,
        entities: Entity[]
    ): void {
        if (!actions || actions.length === 0) {
            return;
        }

        console.log('[CameraCommandService] Executing actions:', actions);

        actions.forEach((action, index) => {
            // Delay each action slightly to avoid conflicts
            setTimeout(() => {
                if (action.type === 'camera') {
                    this.handleCameraAction(action, storeActions, controlsRef, camera, warehouseLayout, entities);
                } else if (action.type === 'ui') {
                    this.handleUIAction(action, storeActions);
                }
            }, index * 100);
        });
    }

    /**
     * Handle camera-related actions
     */
    private static handleCameraAction(
        action: CameraAction,
        storeActions: any,
        controlsRef: React.RefObject<any>,
        camera: Camera | null,
        warehouseLayout: WarehouseLayoutElement[] | null,
        entities: Entity[]
    ): void {
        const controls = controlsRef.current;

        if (!camera || !controls) {
            console.warn('[CameraCommandService] Camera or controls not available');
            return;
        }

        switch (action.action) {
            case 'flyTo': {
                const target = action.target;
                if (!target || !warehouseLayout) {
                    console.warn('[CameraCommandService] No target or layout for flyTo');
                    return;
                }

                // Find zone in warehouse layout
                const zone = this.findZone(target, warehouseLayout);
                if (zone) {
                    console.log('[CameraCommandService] Flying to zone:', zone.element_id);
                    CameraController.focusOnZone(camera, controls, zone, (action.duration || 1500) / 1000);
                    storeActions.focusOnZone?.(zone.element_id);
                } else {
                    console.warn('[CameraCommandService] Zone not found:', target);
                }
                break;
            }

            case 'focus': {
                const entityId = action.target;
                if (!entityId) {
                    console.warn('[CameraCommandService] No entity ID for focus');
                    return;
                }

                this.handleFocusEntity(entityId, entities, camera, controls, action.duration);
                break;
            }

            case 'overview': {
                console.log('[CameraCommandService] Returning to overview');
                if (warehouseLayout && warehouseLayout.length > 0) {
                    // Calculate bounds from warehouse layout
                    const bounds = this.calculateBounds(warehouseLayout);
                    CameraController.resetCamera(camera, controls, bounds, (action.duration || 2000) / 1000);
                    storeActions.focusOnZone?.(null);
                }
                break;
            }

            default:
                console.warn('[CameraCommandService] Unknown camera action:', action.action);
        }
    }

    /**
     * Handle UI-related actions
     */
    private static handleUIAction(action: CameraAction, storeActions: any): void {
        switch (action.action) {
            case 'heatmap':
                console.log('[CameraCommandService] Showing heatmap for metric:', action.metric);
                // Future: Trigger heatmap visualization
                break;

            case 'alert':
                console.log('[CameraCommandService] Showing alert:', action.alertId);
                // Future: Highlight alert in UI
                break;

            default:
                console.warn('[CameraCommandService] Unknown UI action:', action.action);
        }
    }

    /**
     * Focus camera on a specific entity
     */
    private static handleFocusEntity(
        entityId: string,
        entities: Entity[],
        camera: Camera,
        controls: any,
        duration?: number
    ): void {
        const entity = entities.find(e => e.entity_id === entityId);
        if (!entity) {
            console.warn('[CameraCommandService] Entity not found:', entityId);
            return;
        }

        console.log('[CameraCommandService] Focusing on entity:', entity.entity_id);

        // Create a temporary zone-like object for the entity
        const entityZone: WarehouseLayoutElement = {
            element_type: 'zone',
            element_id: entity.entity_id,
            x: entity.x,
            y: entity.z || 0,
            width: 5,
            depth: 5
        };

        CameraController.focusOnZone(camera, controls, entityZone, (duration || 1500) / 1000);
    }

    /**
     * Find a zone by ID or name (case-insensitive)
     */
    private static findZone(target: string, layout: WarehouseLayoutElement[]): WarehouseLayoutElement | null {
        const lowerTarget = target.toLowerCase();

        return layout.find(element => {
            const id = element.element_id?.toLowerCase() || '';
            const name = element.name?.toLowerCase() || '';

            return id === lowerTarget ||
                name === lowerTarget ||
                id.includes(lowerTarget) ||
                name.includes(lowerTarget);
        }) || null;
    }

    /**
     * Calculate bounds from warehouse layout
     */
    private static calculateBounds(layout: WarehouseLayoutElement[]): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } {
        let minX = Infinity;
        let maxX = -Infinity;
        let minY = Infinity;
        let maxY = -Infinity;

        layout.forEach(element => {
            const halfWidth = element.width / 2;
            const halfDepth = element.depth / 2;

            minX = Math.min(minX, element.x - halfWidth);
            maxX = Math.max(maxX, element.x + halfWidth);
            minY = Math.min(minY, element.y - halfDepth);
            maxY = Math.max(maxY, element.y + halfDepth);
        });

        return { minX, maxX, minY, maxY };
    }
}
