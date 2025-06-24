// Simple script to run the comprehensive validation test
// This script compiles and runs the TypeScript test file

import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the test file
const testFile = join(__dirname, 'ComprehensiveTest.ts');

try {
  // Compile and run the TypeScript file using ts-node
  console.log('Running comprehensive validation test...');
  
  // Use npx to run ts-node without requiring global installation
  const output = execSync(`npx ts-node --esm ${testFile}`, { encoding: 'utf8' });
  
  console.log(output);
  console.log('Test completed successfully!');
} catch (error) {
  console.error('Error running test:');
  console.error(error.stdout || error.message);
  process.exit(1);
}