import { test } from '@playwright/test';
import fs from 'fs';
import { parse } from 'csv-parse/sync';

test('Read CSV and print to console', async () => {
  // Read file
  const file = fs.readFileSync('tests/fixtures/data.csv');

  // Parse CSV
  const records = parse(file, {
    columns: true,
    skip_empty_lines: true
  });

  // Print to terminal
  console.log('CSV Data:');
  console.log(records);
});
