const mongoose = require('mongoose');
const Ground = require('../models/Ground');
const User = require('../models/User');

async function inspect() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sportverse');
  const grounds = await Ground.find().select('title ground_id owner_id status');
  console.log('--- Current Grounds in MongoDB ---');
  console.log(JSON.stringify(grounds, null, 2));

  const users = await User.find({ role: { $in: ['GroundOwner', 'ShopOwner', 'Admin'] } }).select('fullName email role _id id');
  console.log('--- Current Station Owners & Admins in MongoDB ---');
  console.log(JSON.stringify(users, null, 2));
  await mongoose.disconnect();
}
inspect();
