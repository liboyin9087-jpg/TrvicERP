#!/usr/bin/env node

/**
 * Script to import attractions data to Supabase
 * Usage: node scripts/importAttractions.js
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load attractions data
const attractionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../tmp/attractions_data.json'), 'utf-8')
);

// Get Supabase credentials from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Missing Supabase credentials in environment variables');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importAttractions() {
  console.log(`Starting import of ${attractionsData.length} attractions...`);

  try {
    // Delete existing data (optional - uncomment if you want to clear before import)
    // const { error: deleteError } = await supabase.from('attractions').delete().neq('id', 0);
    // if (deleteError) {
    //   console.error('Error deleting existing data:', deleteError);
    // }

    // Insert in batches of 100
    const batchSize = 100;
    let imported = 0;

    for (let i = 0; i < attractionsData.length; i += batchSize) {
      const batch = attractionsData.slice(i, i + batchSize);
      
      // Remove id field to let database auto-generate
      const batchWithoutIds = batch.map(({ id, ...rest }) => rest);

      const { data, error } = await supabase
        .from('attractions')
        .insert(batchWithoutIds)
        .select();

      if (error) {
        console.error(`Error importing batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      imported += data.length;
      console.log(`Imported ${imported} / ${attractionsData.length} attractions`);
    }

    console.log(`✓ Successfully imported ${imported} attractions!`);
    
    // Verify import
    const { count, error: countError } = await supabase
      .from('attractions')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting attractions:', countError);
    } else {
      console.log(`Total attractions in database: ${count}`);
    }

  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importAttractions();
