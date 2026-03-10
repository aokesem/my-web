import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let val = match[2] || '';
            val = val.replace(/^['"](.*)['"]$/, '$1'); // trim quotes
            process.env[key] = val;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Fisher-Yates Shuffle array in-place
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

async function uploadVocabulary() {
    console.log('--- Starting Vocabulary Upload ---');

    const csvPath = path.resolve(__dirname, '../combined.csv');
    const jsonPath = path.resolve(__dirname, '../words.json');

    // 1. Read CSV words
    console.log('1. Reading combined.csv...');
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const csvWords = csvContent
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // Use a Set to ensure exact uniqueness from CSV
    const uniqueWordSet = new Set(csvWords);
    const allWords = Array.from(uniqueWordSet);
    console.log(`   Found ${allWords.length} unique words in CSV.`);

    // 2. Read JSON existing translations & statuses
    console.log('2. Reading words.json for existing translations and statuses...');
    let existingDataMap = new Map();
    try {
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
        const jsonData = JSON.parse(jsonContent);
        jsonData.forEach(item => {
            if (item.word) {
                existingDataMap.set(item.word, {
                    translation: item.translation || '',
                    status: item.status || 'unknown'
                });
            }
        });
        console.log(`   Found ${existingDataMap.size} translation mapping entries.`);
    } catch (err) {
        console.log('   Note: Could not parse words.json or it does not exist. Ignoring translation mappings.');
    }

    // 3. Shuffle
    console.log('3. Shuffling the entire vocabulary pool...');
    shuffleArray(allWords);

    // 4. Construct payload
    console.log('4. Constructing payload and assigning batch_id (250 per batch)...');
    const payloads = allWords.map((word, index) => {
        const batch_id = Math.floor(index / 250) + 1;
        const existingInfo = existingDataMap.get(word) || { translation: '', status: 'unknown' };

        return {
            word: word,
            batch_id: batch_id,
            translation: existingInfo.translation,
            status: existingInfo.status
        };
    });

    console.log(`   Total payloads to upload: ${payloads.length}`);
    console.log(`   Total batches: ${Math.ceil(payloads.length / 250)}`);

    // 5. Upload in batches of 1000 to avoid request size limits
    const CHUNK_SIZE = 1000;
    console.log(`5. Uploading to Supabase in chunks of ${CHUNK_SIZE}...`);

    for (let i = 0; i < payloads.length; i += CHUNK_SIZE) {
        const chunk = payloads.slice(i, i + CHUNK_SIZE);
        console.log(`   Uploading chunk ${Math.floor(i / CHUNK_SIZE) + 1} (${chunk.length} words)...`);

        const { error } = await supabase
            .from('vocabulary')
            .upsert(chunk, { onConflict: 'word' });

        if (error) {
            console.error(`   ! Error in chunk ${Math.floor(i / CHUNK_SIZE) + 1}:`, error.message);
        }
    }

    console.log('--- Upload Complete! ---');
}

uploadVocabulary()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Unhandled error:', err);
        process.exit(1);
    });
