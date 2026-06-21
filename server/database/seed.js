const mongoose = require('mongoose');
const Module = require('../models/Module');
const seedData = require('./seed-modules.json');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('DB Connected');
  await Module.deleteMany({}); // Purana saaf kar de
  await Module.insertMany(seedData);
  console.log('12 Modules seeded successfully');
  process.exit();
}).catch(err => console.log(err));