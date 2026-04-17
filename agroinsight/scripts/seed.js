// scripts/seed.js  — Run once: node scripts/seed.js
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose   = require('mongoose');
const connectDB  = require('../config/db');
const Submission = require('../models/Submission');

const SAMPLE_DATA = [
  { state:'Punjab',        district:'Ludhiana',      land_size:4.2,  land_category:'semi_medium', irrigation_src:'canal',    well_depth:28,  kharif_crop:'Paddy',     rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Punjab',        district:'Amritsar',      land_size:2.8,  land_category:'small',       irrigation_src:'tube_well',well_depth:32,  kharif_crop:'Paddy',     rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Haryana',       district:'Karnal',        land_size:3.5,  land_category:'semi_medium', irrigation_src:'canal',    well_depth:25,  kharif_crop:'Paddy',     rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Uttar Pradesh', district:'Varanasi',      land_size:1.2,  land_category:'marginal',    irrigation_src:'tube_well',well_depth:18,  kharif_crop:'Paddy',     rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Uttar Pradesh', district:'Agra',          land_size:2.1,  land_category:'small',       irrigation_src:'canal',    well_depth:22,  kharif_crop:'Bajra',     rabi_crop:'Mustard',  crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Maharashtra',   district:'Pune',          land_size:5.6,  land_category:'medium',      irrigation_src:'drip',     well_depth:45,  kharif_crop:'Sugarcane', rabi_crop:'Jowar',    crop_intensity:'single',  soil_type:'black' },
  { state:'Maharashtra',   district:'Nashik',        land_size:3.0,  land_category:'semi_medium', irrigation_src:'drip',     well_depth:50,  kharif_crop:'Grapes',    rabi_crop:'Onion',    crop_intensity:'double',  soil_type:'black' },
  { state:'Karnataka',     district:'Mysuru',        land_size:2.5,  land_category:'small',       irrigation_src:'tank',     well_depth:38,  kharif_crop:'Ragi',      rabi_crop:'Jowar',    crop_intensity:'double',  soil_type:'red' },
  { state:'Tamil Nadu',    district:'Thanjavur',     land_size:1.8,  land_category:'marginal',    irrigation_src:'canal',    well_depth:15,  kharif_crop:'Paddy',     rabi_crop:'Paddy',    crop_intensity:'triple',  soil_type:'alluvial' },
  { state:'Gujarat',       district:'Anand',         land_size:4.8,  land_category:'medium',      irrigation_src:'tube_well',well_depth:55,  kharif_crop:'Cotton',    rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Rajasthan',     district:'Jaipur',        land_size:6.2,  land_category:'medium',      irrigation_src:'rainfed',  well_depth:60,  kharif_crop:'Bajra',     rabi_crop:'Mustard',  crop_intensity:'single',  soil_type:'desert' },
  { state:'West Bengal',   district:'Bardhaman',     land_size:0.8,  land_category:'marginal',    irrigation_src:'river',    well_depth:12,  kharif_crop:'Paddy',     rabi_crop:'Potato',   crop_intensity:'triple',  soil_type:'alluvial' },
  { state:'Andhra Pradesh',district:'Guntur',        land_size:3.2,  land_category:'semi_medium', irrigation_src:'canal',    well_depth:30,  kharif_crop:'Cotton',    rabi_crop:'Chilli',   crop_intensity:'double',  soil_type:'black' },
  { state:'Madhya Pradesh',district:'Indore',        land_size:5.0,  land_category:'medium',      irrigation_src:'rainfed',  well_depth:35,  kharif_crop:'Soybean',   rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'black' },
  { state:'Kerala',        district:'Thrissur',      land_size:0.4,  land_category:'marginal',    irrigation_src:'river',    well_depth:12,  kharif_crop:'Rice',      rabi_crop:'Coconut',  crop_intensity:'double',  soil_type:'laterite' },
  { state:'Bihar',         district:'Patna',         land_size:1.1,  land_category:'marginal',    irrigation_src:'tube_well',well_depth:20,  kharif_crop:'Paddy',     rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Odisha',        district:'Cuttack',       land_size:1.5,  land_category:'marginal',    irrigation_src:'canal',    well_depth:18,  kharif_crop:'Paddy',     rabi_crop:'Pulses',   crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Telangana',     district:'Warangal',      land_size:2.8,  land_category:'small',       irrigation_src:'tank',     well_depth:40,  kharif_crop:'Cotton',    rabi_crop:'Jowar',    crop_intensity:'single',  soil_type:'black' },
  { state:'Assam',         district:'Jorhat',        land_size:0.9,  land_category:'marginal',    irrigation_src:'rainfed',  well_depth:10,  kharif_crop:'Rice',      rabi_crop:'Mustard',  crop_intensity:'double',  soil_type:'alluvial' },
  { state:'Himachal Pradesh',district:'Shimla',      land_size:0.6,  land_category:'marginal',    irrigation_src:'river',    well_depth:20,  kharif_crop:'Maize',     rabi_crop:'Wheat',    crop_intensity:'double',  soil_type:'mountainous' },
];

async function seed() {
  await connectDB();
  try {
    await Submission.deleteMany({});
    console.log('🗑️  Cleared existing submissions');
    const inserted = await Submission.insertMany(SAMPLE_DATA);
    console.log(`🌱 Seeded ${inserted.length} sample records`);
  } catch (err) {
    console.error('Seed error:', err.message);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Done. MongoDB connection closed.');
  }
}

seed();
