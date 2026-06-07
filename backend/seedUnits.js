require('dotenv').config();
const mongoose = require('mongoose');
const Unit = require('./models/Unit');
const connectDB = require('./config/db');

const defaultUnits = [
  { name: 'Mavoor Sector', code: 'MVR' },
  { name: 'Thathoor Sector', code: 'TTR' },
  { name: 'Chathamangalam Sector', code: 'CMG' },
  { name: 'Peruvayal Sector', code: 'PVL' },
  { name: 'Koolimadu Sector', code: 'KMD' },
];

const seedUnits = async () => {
  try {
    await connectDB();

    // Clear existing units just in case
    const existingCount = await Unit.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing units. Deleting...`);
      await Unit.deleteMany({});
      console.log('Existing units deleted.');
    }

    // Seed new units
    const seededUnits = await Unit.insertMany(defaultUnits);
    console.log(`Successfully seeded ${seededUnits.length} units:`);
    seededUnits.forEach(unit => {
      console.log(`- ${unit.name} (${unit.code})`);
    });

    mongoose.connection.close();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding units:', error);
    process.exit(1);
  }
};

seedUnits();
