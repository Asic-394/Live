import type {
  WarehouseLayoutElement,
  ValidationError,
  ValidationResult,
  ElementType,
  EntityType,
} from '../../types';

export class SchemaValidator {
  // Validate warehouse layout CSV
  static validateLayout(rows: any[]): ValidationResult {
    const errors: ValidationError[] = [];
    const requiredFields = ['element_type', 'element_id', 'x', 'y', 'width', 'depth'];
    const validElementTypes: ElementType[] = ['zone', 'aisle', 'rack', 'dock', 'wall', 'yard', 'road', 'parking', 'gate'];

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header row and 0-indexing

      // Check required fields
      requiredFields.forEach((field) => {
        if (row[field] === undefined || row[field] === null || row[field] === '') {
          errors.push({
            row: rowNumber,
            field,
            message: `Missing required field: ${field}`,
            value: row[field],
          });
        }
      });

      // Validate element_type
      if (row.element_type && !validElementTypes.includes(row.element_type)) {
        errors.push({
          row: rowNumber,
          field: 'element_type',
          message: `Invalid element_type. Must be one of: ${validElementTypes.join(', ')}`,
          value: row.element_type,
        });
      }

      // Validate numeric fields
      const numericFields = ['x', 'y', 'z', 'width', 'depth', 'height', 'rotation', 'capacity'];
      numericFields.forEach((field) => {
        if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
          if (typeof row[field] !== 'number' || isNaN(row[field])) {
            errors.push({
              row: rowNumber,
              field,
              message: `Field ${field} must be a valid number`,
              value: row[field],
            });
          }
        }
      });

      // Validate coordinate bounds (reasonable warehouse size with buffer for perimeter walls and yard)
      // Walls, yard, road, parking, and gate elements can extend beyond main warehouse floor
      const isExteriorElement = ['wall', 'yard', 'road', 'parking', 'gate'].includes(row.element_type);
      const minXCoord = isExteriorElement ? -50 : 0;
      const maxXCoord = isExteriorElement ? 1500 : 1200;
      const minYCoord = isExteriorElement ? -150 : 0; // Allow negative Y for yard area
      const maxYCoord = isExteriorElement ? 1500 : 1200;
      
      if (typeof row.x === 'number' && (row.x < minXCoord || row.x > maxXCoord)) {
        errors.push({
          row: rowNumber,
          field: 'x',
          message: `X coordinate must be between ${minXCoord} and ${maxXCoord}`,
          value: row.x,
        });
      }

      if (typeof row.y === 'number' && (row.y < minYCoord || row.y > maxYCoord)) {
        errors.push({
          row: rowNumber,
          field: 'y',
          message: `Y coordinate must be between ${minYCoord} and ${maxYCoord}`,
          value: row.y,
        });
      }

      // Validate dimensions are positive
      if (typeof row.width === 'number' && row.width <= 0) {
        errors.push({
          row: rowNumber,
          field: 'width',
          message: 'Width must be greater than 0',
          value: row.width,
        });
      }

      if (typeof row.depth === 'number' && row.depth <= 0) {
        errors.push({
          row: rowNumber,
          field: 'depth',
          message: 'Depth must be greater than 0',
          value: row.depth,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Validate warehouse state CSV
  static validateState(rows: any[], layout: WarehouseLayoutElement[] | null = null): ValidationResult {
    const errors: ValidationError[] = [];
    const requiredFields = ['entity_type', 'entity_id', 'zone', 'x', 'y', 'status'];
    const validEntityTypes: EntityType[] = ['worker', 'forklift', 'pallet', 'inventory', 'truck'];

    // Collect valid zone IDs from layout
    const validZoneIds = layout ? new Set(layout.map((el) => el.element_id)) : null;

    rows.forEach((row, index) => {
      const rowNumber = index + 2; // +2 for header row and 0-indexing

      // Check required fields
      requiredFields.forEach((field) => {
        if (row[field] === undefined || row[field] === null || row[field] === '') {
          errors.push({
            row: rowNumber,
            field,
            message: `Missing required field: ${field}`,
            value: row[field],
          });
        }
      });

      // Validate entity_type
      if (row.entity_type && !validEntityTypes.includes(row.entity_type)) {
        errors.push({
          row: rowNumber,
          field: 'entity_type',
          message: `Invalid entity_type. Must be one of: ${validEntityTypes.join(', ')}`,
          value: row.entity_type,
        });
      }

      // Validate numeric fields
      const numericFields = ['x', 'y', 'z', 'battery_level', 'speed'];
      numericFields.forEach((field) => {
        if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
          if (typeof row[field] !== 'number' || isNaN(row[field])) {
            errors.push({
              row: rowNumber,
              field,
              message: `Field ${field} must be a valid number`,
              value: row[field],
            });
          }
        }
      });

      // Validate coordinate bounds (allow negative Y for trucks in yard)
      if (typeof row.x === 'number' && (row.x < 0 || row.x > 1000)) {
        errors.push({
          row: rowNumber,
          field: 'x',
          message: 'X coordinate must be between 0 and 1000',
          value: row.x,
        });
      }

      if (typeof row.y === 'number' && (row.y < -150 || row.y > 1000)) {
        errors.push({
          row: rowNumber,
          field: 'y',
          message: 'Y coordinate must be between -150 and 1000',
          value: row.y,
        });
      }

      // Validate zone reference if layout provided
      if (validZoneIds && row.zone && !validZoneIds.has(row.zone)) {
        errors.push({
          row: rowNumber,
          field: 'zone',
          message: `Zone '${row.zone}' not found in warehouse layout`,
          value: row.zone,
        });
      }

      // Validate battery level (0-100)
      if (typeof row.battery_level === 'number' && (row.battery_level < 0 || row.battery_level > 100)) {
        errors.push({
          row: rowNumber,
          field: 'battery_level',
          message: 'Battery level must be between 0 and 100',
          value: row.battery_level,
        });
      }

      // Validate speed (non-negative)
      if (typeof row.speed === 'number' && row.speed < 0) {
        errors.push({
          row: rowNumber,
          field: 'speed',
          message: 'Speed must be non-negative',
          value: row.speed,
        });
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Format validation errors for display
  static formatErrors(errors: ValidationError[]): string {
    if (errors.length === 0) return '';
    
    const errorMessages = errors.map(
      (err) => `Row ${err.row}, Field '${err.field}': ${err.message}`
    );
    
    return errorMessages.join('\n');
  }
}
