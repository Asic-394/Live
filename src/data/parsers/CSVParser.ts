import Papa from 'papaparse';

export interface CSVParseResult<T> {
  data: T[];
  errors: Array<{ row: number; message: string }>;
}

export class CSVParser {
  static async parseFile<T>(filePath: string): Promise<CSVParseResult<T>> {
    try {
      const response = await fetch(filePath);
      if (!response.ok) {
        throw new Error(`Failed to fetch CSV: ${response.statusText}`);
      }
      
      const csvText = await response.text();
      return this.parseText<T>(csvText);
    } catch (error) {
      return {
        data: [],
        errors: [{ row: 0, message: `Failed to load CSV: ${error}` }],
      };
    }
  }

  static parseText<T>(csvText: string): CSVParseResult<T> {
    const errors: Array<{ row: number; message: string }> = [];
    
    const result = Papa.parse<T>(csvText, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header: string) => header.trim(),
      transform: (value: string) => {
        // Trim whitespace from all values
        return typeof value === 'string' ? value.trim() : value;
      },
    });

    // Collect parsing errors
    if (result.errors.length > 0) {
      result.errors.forEach((error) => {
        errors.push({
          row: error.row ?? 0,
          message: error.message,
        });
      });
    }

    return {
      data: result.data as T[],
      errors,
    };
  }

  static parseJSONField<T>(jsonString: string | undefined, defaultValue: T): T {
    if (!jsonString) return defaultValue;
    
    try {
      return JSON.parse(jsonString) as T;
    } catch {
      return defaultValue;
    }
  }
}
