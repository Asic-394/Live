import { WarehouseLayout, WarehouseLayoutElement } from '../types';

/**
 * Builds hierarchical relationships between warehouse layout elements
 * Zone -> Aisle -> Rack
 */
export class HierarchyBuilder {
  /**
   * Assigns hierarchy information to all layout elements
   * - Racks are assigned to closest aisle
   * - Aisles are assigned to containing zone
   * - Returns updated layout with hierarchy metadata
   */
  static buildHierarchy(layout: WarehouseLayout): WarehouseLayout {
    const updatedRacks = this.assignRacksToAisles(layout.racks, layout.aisles);
    const updatedAisles = this.assignAislesToZones(layout.aisles, layout.zones);

    return {
      ...layout,
      racks: updatedRacks,
      aisles: updatedAisles,
    };
  }

  /**
   * Assigns each rack to its parent aisle based on spatial proximity
   */
  private static assignRacksToAisles(
    racks: WarehouseLayoutElement[],
    aisles: WarehouseLayoutElement[]
  ): WarehouseLayoutElement[] {
    return racks.map((rack) => {
      const closestAisle = this.findClosestAisle(rack, aisles);
      
      if (closestAisle) {
        const parentZoneId = closestAisle.hierarchy?.parent_id;
        const path = parentZoneId 
          ? [parentZoneId, closestAisle.element_id]
          : [closestAisle.element_id];

        return {
          ...rack,
          hierarchy: {
            parent_id: closestAisle.element_id,
            parent_type: 'aisle',
            path,
          },
        };
      }

      return rack;
    });
  }

  /**
   * Assigns each aisle to its parent zone based on spatial overlap
   */
  private static assignAislesToZones(
    aisles: WarehouseLayoutElement[],
    zones: WarehouseLayoutElement[]
  ): WarehouseLayoutElement[] {
    return aisles.map((aisle) => {
      const containingZone = this.findContainingZone(aisle, zones);
      
      if (containingZone) {
        return {
          ...aisle,
          hierarchy: {
            parent_id: containingZone.element_id,
            parent_type: 'zone',
            path: [containingZone.element_id],
          },
        };
      }

      return aisle;
    });
  }

  /**
   * Finds the closest aisle to a rack based on distance to aisle centerline
   */
  private static findClosestAisle(
    rack: WarehouseLayoutElement,
    aisles: WarehouseLayoutElement[]
  ): WarehouseLayoutElement | null {
    if (aisles.length === 0) return null;

    let closestAisle = aisles[0];
    let minDistance = this.distanceToAisleCenterline(rack, aisles[0]);

    for (let i = 1; i < aisles.length; i++) {
      const distance = this.distanceToAisleCenterline(rack, aisles[i]);
      if (distance < minDistance) {
        minDistance = distance;
        closestAisle = aisles[i];
      }
    }

    return closestAisle;
  }

  /**
   * Calculates distance from rack center to aisle centerline
   */
  private static distanceToAisleCenterline(
    rack: WarehouseLayoutElement,
    aisle: WarehouseLayoutElement
  ): number {
    const rackCenterX = rack.x;
    const rackCenterY = rack.y;
    const aisleCenterX = aisle.x;
    const aisleCenterY = aisle.y;

    // Calculate perpendicular distance to aisle centerline
    const dx = rackCenterX - aisleCenterX;
    const dy = rackCenterY - aisleCenterY;

    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Finds the zone that contains the given aisle based on spatial overlap
   */
  private static findContainingZone(
    aisle: WarehouseLayoutElement,
    zones: WarehouseLayoutElement[]
  ): WarehouseLayoutElement | null {
    for (const zone of zones) {
      if (this.isInsideZone(aisle, zone)) {
        return zone;
      }
    }

    return null;
  }

  /**
   * Checks if an aisle's bounds overlap with a zone's bounds
   */
  private static isInsideZone(
    aisle: WarehouseLayoutElement,
    zone: WarehouseLayoutElement
  ): boolean {
    // Calculate aisle bounds
    const aisleMinX = aisle.x - aisle.width / 2;
    const aisleMaxX = aisle.x + aisle.width / 2;
    const aisleMinY = aisle.y - aisle.depth / 2;
    const aisleMaxY = aisle.y + aisle.depth / 2;

    // Calculate zone bounds
    const zoneMinX = zone.x - zone.width / 2;
    const zoneMaxX = zone.x + zone.width / 2;
    const zoneMinY = zone.y - zone.depth / 2;
    const zoneMaxY = zone.y + zone.depth / 2;

    // Check if aisle center is inside zone or if they overlap significantly
    const aisleCenterInZone =
      aisle.x >= zoneMinX &&
      aisle.x <= zoneMaxX &&
      aisle.y >= zoneMinY &&
      aisle.y <= zoneMaxY;

    if (aisleCenterInZone) return true;

    // Check for significant overlap (at least 50% of aisle)
    const overlapX = Math.min(aisleMaxX, zoneMaxX) - Math.max(aisleMinX, zoneMinX);
    const overlapY = Math.min(aisleMaxY, zoneMaxY) - Math.max(aisleMinY, zoneMinY);

    if (overlapX > 0 && overlapY > 0) {
      const aisleArea = aisle.width * aisle.depth;
      const overlapArea = overlapX * overlapY;
      return overlapArea / aisleArea > 0.5;
    }

    return false;
  }

  /**
   * Gets the full hierarchy path for an element (Zone -> Aisle -> Rack)
   */
  static getFullPath(element: WarehouseLayoutElement): string[] {
    if (!element.hierarchy) {
      return [element.element_id];
    }
    return [...element.hierarchy.path, element.element_id];
  }

  /**
   * Gets the parent element ID for a given element
   */
  static getParentId(element: WarehouseLayoutElement): string | null {
    return element.hierarchy?.parent_id || null;
  }

  /**
   * Finds all children of a given element
   */
  static getChildren(
    parentId: string,
    allElements: WarehouseLayoutElement[]
  ): WarehouseLayoutElement[] {
    return allElements.filter(
      (element) => element.hierarchy?.parent_id === parentId
    );
  }
}
