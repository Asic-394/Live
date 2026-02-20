/**
 * Script to fix duplicate rack IDs in warehouse layout files
 * Finds duplicates and renames them with unique suffixes
 * 
 * Usage: npx tsx scripts/fixDuplicateRackIds.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixDuplicatesInFile(filePath: string) {
  console.log(`\n📄 Processing: ${filePath}`);
  
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  
  // Find element_id column index
  const idIndex = headers.findIndex(h => h.trim() === 'element_id');
  const typeIndex = headers.findIndex(h => h.trim() === 'element_type');
  
  if (idIndex === -1) {
    console.error('❌ element_id column not found!');
    return;
  }

  // Track element IDs and find duplicates
  const idCounts = new Map<string, number>();
  const idOccurrences = new Map<string, number[]>(); // ID -> line numbers
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const elementId = values[idIndex]?.trim();
    
    if (elementId) {
      const count = (idCounts.get(elementId) || 0) + 1;
      idCounts.set(elementId, count);
      
      if (!idOccurrences.has(elementId)) {
        idOccurrences.set(elementId, []);
      }
      idOccurrences.get(elementId)!.push(i);
    }
  }

  // Find duplicates
  const duplicates = Array.from(idCounts.entries())
    .filter(([_, count]) => count > 1)
    .map(([id, _]) => id);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    return;
  }

  console.log(`⚠️  Found ${duplicates.length} duplicate IDs:`, duplicates);

  // Fix duplicates by renaming
  let fixedCount = 0;
  
  for (const dupId of duplicates) {
    const lineNumbers = idOccurrences.get(dupId)!;
    console.log(`\n  Fixing "${dupId}" (appears ${lineNumbers.length} times)`);
    
    // Keep first occurrence, rename others
    for (let i = 1; i < lineNumbers.length; i++) {
      const lineNum = lineNumbers[i];
      const values = lines[lineNum].split(',');
      const elementType = values[typeIndex]?.trim();
      
      // Generate new unique ID
      const newId = `${dupId}-${String.fromCharCode(65 + i)}`; // A, B, C, etc.
      
      console.log(`    Line ${lineNum}: "${dupId}" -> "${newId}"`);
      
      // Replace the ID in the line
      values[idIndex] = newId;
      lines[lineNum] = values.join(',');
      fixedCount++;
    }
  }

  // Write back to file
  const newContent = lines.join('\n') + '\n';
  fs.writeFileSync(filePath, newContent);
  
  console.log(`\n✅ Fixed ${fixedCount} duplicate IDs in ${path.basename(filePath)}`);
}

function main() {
  console.log('🔧 Fixing duplicate rack IDs in warehouse layouts...\n');

  const scenarios = ['scenario_normal', 'scenario_congestion', 'scenario_dock_delay'];
  const publicDir = path.join(__dirname, '..', 'public', 'datasets');

  for (const scenario of scenarios) {
    const layoutPath = path.join(publicDir, scenario, 'warehouse_layout.csv');
    
    if (fs.existsSync(layoutPath)) {
      fixDuplicatesInFile(layoutPath);
    } else {
      console.log(`⚠️  File not found: ${layoutPath}`);
    }
  }

  console.log('\n🎉 Done! Please refresh your browser to see the changes.');
}

main();
