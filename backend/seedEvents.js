/**
 * seedEvents.js
 * Run: node seedEvents.js
 * Seeds all Sahithyolsav events into the database.
 * - Looks up existing categories by code.
 * - Determines group vs single from "(N Participants)" hint.
 * - Strips trailing " - Male" / " - Female" from names.
 * - Skips events that already exist (by code) so it's safe to re-run.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');
const Event = require('./models/Event');

// ─── RAW EVENT LIST ───────────────────────────────────────────────────────────
const RAW = `
CAT-A - Group Song A (4 Participants) - Male
CAT-B - Group Song B (4 Participants) - Male
GEN - Arabana (10 Participants) - Male
GEN - Collage (3 Participants) - Male
GEN - Duff (10 Participants) - Male
GEN - Family Magazine  - Male
GEN - Malappattu (3 Participants) - Male
GEN - Mappila Song Writing - Male
GEN - Moulid Recitation (4 Participants) - Male
GEN - Nasheed (4 Participants) - Male
GEN - Project ( 5 Participants) - Male
GEN - Qaseeda Burda (4 Participants) - Male
GEN - Qawwali (5 Participants) - Male
GEN - Revolutionary song (3 Participants) - Male
GEN - Revolutionary Song Writing - Male
GEN - Risala Quiz (2 Participants) - Male
GEN - Spot Magazine (5 Participants) - Male
GEN - Wall Painting (2 Participants) - Male
HS - Arabic Poem Recitation - Male
HS - Book Test - Male
HS - Book Test (Girls Only) - Female
HS - Caption Writing - Male
HS - Embroidery (Girls Only) - Female
HS - English Elocution - Male
HS - Language Game English - Male
HS - Madh Song - Male
HS - Malayalam Elocution - Male
HS - Malayalam Essay Writing  - Male
HS - Malayalam Poetry Recitation - Male
HS - Mappila Song - Male
HS - News Reading - Male
HS - Pencil Drawing - Male
HS - Pencil Drawing (Girls Only) - Female
HS - Poetry Writing - Male
HS - Poetry Writing (Girls Only) - Female
HS - Quiz - Male
HS - Story Writing - Male
HS - Story Writing (Girls Only) - Female
HS - Urdu Poetry Recitation - Male
HS - Watercolor Painting - Male
HS - Watercolor Painting (Girls Only) - Female
HSS - Arabic Calligraphy - Male
HSS - Arabic Calligraphy (Girls Only) - Female
HSS - Book Test - Male
HSS - Book Test (Girls Only) - Female
HSS - Devotional Song - Male
HSS - Digital Painting - Male
HSS - Elocution - Male
HSS - English Essay - Male
HSS - Malayalam Essay  - Male
HSS - Mappila Pattu - Male
HSS - News Writing - Male
HSS - Pencil Drawing - Male
HSS - Poetry Writing - Male
HSS - Poetry Writing (Girls Only) - Female
HSS - Quiz - Male
HSS - Reel Making  - Male
HSS - Story Writing - Male
HSS - Story Writing (Girls Only) - Female
HSS - Urdu Poetry Recitation - Male
HSS - Watercolor Painting - Male
JR - AI Poetry Writing - Male
JR - Arabic Calligraphy - Male
JR - Arabic Elocution - Male
JR - Arabic Essay - Male
JR - Arabic Translation - Male
JR - Book Test - Male
JR - Elocution - Male
JR - Elocution English - Male
JR - Hadith Musabaqa - Male
JR - Literary Debate - Male
JR - Madh Song Writing - Male
JR - Malayalam Essay - Male
JR - Mappila Song - Male
JR - Podcast (2 Participants) - Male
JR - Poetry Writing - Male
JR - Quiz - Male
JR - Slogan Writing - Male
JR - Social Text - Male
JR - Socio Synapse - Male
JR - Story Writing - Male
LP - Book Test - Male
LP - Elocution - Male
LP - Journal Art (Girls Only) - Female
LP - Language Game - Male
LP - Madh Song - Male
LP - Malayalam Handwriting  (Girls Only) - Female
LP - Malayalam Reading - Male
LP - Pencil Drawing - Male
LP - Pencil Drawing (Girls Only) - Female
LP - Quiz - Male
LP - Reading Arabic-Malayalam - Male
LP - Storytelling - Male
LP - Watercolor Painting (Girls Only) - Female
LP - Watercolour Painting - Male
SR - Book Test - Male
SR - Digital Illustration - Male
SR - Digital Painting - Male
SR - Elocution English - Male
SR - English Essay - Male
SR - English Poem Recitation - Male
SR - English Poetry Writing - Male
SR - ePoster - Male
SR - Feature Writing - Male
SR - Madh Song Writing - Male
SR - Malayalam Elocution - Male
SR - Malayalam Essay Writing - Male
SR - Mappila Song - Male
SR - Mushaa'ra Alfiyya - Male
SR - Poetry Writing - Male
SR - Political Debate - Male
SR - Poster Designing - Male
SR - Quiz - Male
SR - Slogan Writing - Male
SR - Social Text - Male
SR - Story Writing - Male
SR - Translation English - Male
SR - Urdu Essay Writing - Male
SR - Urdu Hamd - Male
UP - Book Test - Male
UP - Book Test (Girls Only) - Female
UP - Elocution - Male
UP - Mappila Pattu - Male
UP - Math Games - Male
UP - Origami (Girls Only) - Female
UP - Pencil Drawing - Male
UP - Pencil Drawing (Girls Only) - Female
UP - Quiz - Male
UP - Spelling Bee - Male
UP - Story Writing - Male
UP - Story Writing (Girls Only) - Female
UP - Storytelling - Male
UP - Sudoku - Male
UP - Watercolor Painting (Girls Only) - Female
UP - Watercolor Painting Watercolors - Male
`.trim();

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function makeCode(catCode, name) {
  const slug = name
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 40);
  return `${catCode}-${slug}`;
}

function isGroup(rawLine) {
  const m = rawLine.match(/\(\s*(\d+)\s*Participants?\s*\)/i);
  return m ? parseInt(m[1]) >= 2 : false;
}

function cleanName(rawNamePart) {
  return rawNamePart
    .replace(/\s*-\s*(Male|Female)\s*$/i, '')
    .trim()
    .replace(/\s{2,}/g, ' ');
}

// ─── MAIN SEED ───────────────────────────────────────────────────────────────

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  const categories = await Category.find();
  const catByCode = {};
  categories.forEach((c) => { catByCode[c.code.toUpperCase()] = c; });
  console.log(`Loaded ${categories.length} categories: ${Object.keys(catByCode).join(', ')}`);

  const lines = RAW.split('\n').map((l) => l.trim()).filter(Boolean);

  let inserted = 0, skipped = 0, errors = 0;

  for (const line of lines) {
    const firstDash = line.indexOf(' - ');
    if (firstDash === -1) { console.warn(`Skipping malformed: "${line}"`); continue; }

    const catCode = line.substring(0, firstDash).toUpperCase();
    const rest = line.substring(firstDash + 3);
    const name = cleanName(rest);
    const type = isGroup(line) ? 'group' : 'single';
    const code = makeCode(catCode, name);

    const category = catByCode[catCode];
    if (!category) {
      console.warn(`Category "${catCode}" not found — skipping "${name}"`);
      errors++;
      continue;
    }

    const exists = await Event.findOne({ code });
    if (exists) {
      console.log(`Already exists: [${catCode}] ${name}`);
      skipped++;
      continue;
    }

    try {
      await Event.create({ name, code, category: category._id, type });
      console.log(`Inserted [${catCode}/${type}]: ${name}`);
      inserted++;
    } catch (err) {
      console.error(`Error inserting "${name}": ${err.message}`);
      errors++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}  |  Skipped: ${skipped}  |  Errors: ${errors}`);
  await mongoose.disconnect();
}

seed().catch((err) => { console.error('Fatal:', err); process.exit(1); });
