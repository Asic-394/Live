/**
 * Rack slot positioning system
 * Defines exact positions for inventory boxes within racks
 * Matches the positioning logic from RackInventory decorative boxes
 */

export interface SlotPosition {
  x: number;
  y: number;
  z: number;
}

export interface RackDimensions {
  width: number;
  height: number;
  depth: number;
}

/**
 * Calculate exact slot positions for a rack
 * Matches RackInventory positioning: 3 shelves, 3 columns, 1 row
 */
export class RackSlots {
  private static readonly PALLET_HEIGHT = 0.3;
  private static readonly SHELVES_PER_RACK = 3;  // 3 physical shelves
  private static readonly POSITIONS_PER_SHELF = 3;  // 3 positions per shelf
  private static readonly LEVELS_PER_RACK = 3;  // 3 levels (now matches physical shelves 1:1)

  /**
   * Get the exact position for a box at a given level and position
   * Structure: 3 shelves × 3 positions = 9 total slots per rack
   * - Level (1-3) directly maps to shelf (bottom, middle, top)
   * - Position (1-3) determines horizontal slot (left, center, right)
   */
  static getSlotPosition(
    level: number,
    position: number,
    rackDimensions: RackDimensions
  ): SlotPosition {
    const { width, height } = rackDimensions;

    // Y position: Box sits ON TOP of pallet
    // Beam heights match RackFrame: 10%, 35%, 65%
    const beamHeights = [
      height * 0.1,   // Level 1: Bottom beam
      height * 0.35,  // Level 2: Low-mid beam
      height * 0.65,  // Level 3: High-mid beam
    ];
    
    const palletHeight = 0.3;
    const boxHeight = 2.5;
    
    // Pallet center is at: beam + palletHeight/2
    // Box should sit on top of pallet: pallet center + palletHeight/2 + boxHeight/2
    const beamY = beamHeights[level - 1];
    const palletCenterY = beamY + palletHeight / 2;
    const y = palletCenterY + palletHeight / 2 + boxHeight / 2;

    // X position: 3 positions (left, center, right) across rack width
    const gapBetweenBoxes = 0.5;
    const totalGapSpace = gapBetweenBoxes * (this.POSITIONS_PER_SHELF - 1);
    const slotWidth = (width - totalGapSpace) / this.POSITIONS_PER_SHELF;
    
    const col = (position - 1) % this.POSITIONS_PER_SHELF;
    const startX = -width / 2;
    const x = startX + slotWidth / 2 + col * (slotWidth + gapBetweenBoxes);

    // Z position: center (no depth offset needed - each level has unique shelf)
    const z = 0;

    return { x, y, z };
  }

  /**
   * Get the box scale for a given rack width
   * Boxes scale to fit 3 slots evenly
   */
  static getBoxScale(rackWidth: number): number {
    const gapBetweenBoxes = 0.3;
    const totalGapSpace = gapBetweenBoxes * (this.COLUMNS_PER_SHELF - 1);
    const boxWidth = (rackWidth - totalGapSpace) / this.COLUMNS_PER_SHELF;
    
    // Standard box is 2.5 units, scale proportionally
    return boxWidth / 2.5;
  }

  /**
   * Get all available slot positions for a rack
   */
  static getAllSlots(rackDimensions: RackDimensions): Map<string, SlotPosition> {
    const slots = new Map<string, SlotPosition>();

    for (let level = 1; level <= this.LEVELS_PER_RACK; level++) {
      for (let position = 1; position <= this.POSITIONS_PER_LEVEL; position++) {
        const slotKey = `L${level}-P${position}`;
        const slotPos = this.getSlotPosition(level, position, rackDimensions);
        slots.set(slotKey, slotPos);
      }
    }

    return slots;
  }

  /**
   * Get slot key for a box
   */
  static getSlotKey(level: number, position: number): string {
    return `L${level}-P${position}`;
  }

  /**
   * Validate if a level and position are within valid ranges
   */
  static isValidSlot(level: number, position: number): boolean {
    return (
      level >= 1 &&
      level <= this.LEVELS_PER_RACK &&
      position >= 1 &&
      position <= this.POSITIONS_PER_LEVEL
    );
  }
}
