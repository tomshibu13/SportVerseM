const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const app = require('../src/app');

const PORT = 5006;
const BASE_URL = `http://localhost:${PORT}/api`;
let server;

async function fetchAPI(method, endpoint, body, headers = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw { response: { status: response.status, data } };
  return { status: response.status, data };
}

async function testFitnessAPI() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse');
    console.log('Starting Test Server on port', PORT);
    server = app.listen(PORT);
    console.log('--- STARTING COMPREHENSIVE FITNESS API TESTS ---\n');
    
    // 1. SETUP USERS
    const user1Res = await fetchAPI('POST', '/auth/register', {
      fullName: 'User One', email: `u1_${Date.now()}@test.com`, password: 'password123'
    });
    const user1Token = user1Res.data.token;
    const h1 = { Authorization: `Bearer ${user1Token}` };

    const user2Res = await fetchAPI('POST', '/auth/register', {
      fullName: 'User Two', email: `u2_${Date.now()}@test.com`, password: 'password123'
    });
    const user2Token = user2Res.data.token;
    const h2 = { Authorization: `Bearer ${user2Token}` };
    
    console.log('✅ Users registered.');

    // 2. UNAUTHENTICATED REQUEST
    try {
      await fetchAPI('GET', '/fitness/today');
      throw new Error('Unauthenticated request succeeded');
    } catch (e) {
      if (e.response && e.response.status === 401) console.log('✅ Unauthenticated request correctly rejected (401)');
      else throw e;
    }

    // 3. EMPTY DATABASE
    const getEmptyRes = await fetchAPI('GET', '/fitness/today', null, h1);
    if (getEmptyRes.data.data.length === 0) console.log('✅ Empty database correctly returns 0 records');
    else throw new Error('Database not empty for new user');

    // 4. INVALID DATES
    try {
      await fetchAPI('POST', '/fitness/records', { recorded_at: 'invalid-date' }, h1);
      throw new Error('Invalid date succeeded');
    } catch (e) {
      if (e.response && e.response.status === 400) console.log('✅ Invalid date correctly rejected (400)');
      else throw e;
    }

    // 5. NEGATIVE VALUES
    try {
      await fetchAPI('POST', '/fitness/records', { steps: -100 }, h1);
      throw new Error('Negative value succeeded');
    } catch (e) {
      if (e.response && e.response.status === 400) console.log('✅ Negative value correctly rejected (400)');
      else throw e;
    }

    // 6. MISSING REQUIRED FIELDS
    try {
      await fetchAPI('POST', '/fitness/goals', { goal_type: 'Steps' }, h1); // missing target_value
      throw new Error('Missing required fields succeeded');
    } catch (e) {
      if (e.response && e.response.status === 400) console.log('✅ Missing required fields correctly rejected (400)');
      else throw e;
    }

    // 7. INVALID IDs
    try {
      await fetchAPI('PUT', '/fitness/records/12345invalid', { steps: 500 }, h1);
      throw new Error('Invalid ID succeeded');
    } catch (e) {
      if (e.response && e.response.status === 400) console.log('✅ Invalid ID correctly rejected (400)');
      else throw e;
    }

    // 8. CREATE FITNESS RECORD
    const createRecRes = await fetchAPI('POST', '/fitness/records', {
      steps: 5000, calories: 300, distance: 4, recorded_at: new Date().toISOString()
    }, h1);
    const recordId = createRecRes.data.data._id;
    console.log('✅ Fitness record created:', recordId);

    // 9. GET TODAY'S FITNESS
    const getTodayRes = await fetchAPI('GET', '/fitness/today', null, h1);
    if (getTodayRes.data.data.length === 1) console.log('✅ Get today\'s fitness works');

    // 10. GET HISTORY, WEEKLY, MONTHLY
    await fetchAPI('GET', '/fitness/history', null, h1);
    await fetchAPI('GET', '/fitness/weekly', null, h1);
    await fetchAPI('GET', '/fitness/monthly', null, h1);
    console.log('✅ History, Weekly, and Monthly queries work');

    // 11. INVALID USER OWNERSHIP
    try {
      await fetchAPI('DELETE', `/fitness/records/${recordId}`, null, h2);
      throw new Error('User 2 deleted User 1 record');
    } catch (e) {
      if (e.response && e.response.status === 404) console.log('✅ Invalid user ownership correctly rejected (404)');
      else throw e;
    }

    // 12. UPDATE FITNESS RECORD
    const updateRecRes = await fetchAPI('PUT', `/fitness/records/${recordId}`, { steps: 6000 }, h1);
    if (updateRecRes.data.data.steps === 6000) console.log('✅ Update fitness record works');

    // 13. DELETE FITNESS RECORD
    await fetchAPI('DELETE', `/fitness/records/${recordId}`, null, h1);
    console.log('✅ Delete fitness record works');

    // 14. CREATE SPORTS ACTIVITY
    const createActRes = await fetchAPI('POST', '/fitness/activities', {
      sport_id: '1', duration: 45, intensity: 'High', activity_date: new Date().toISOString()
    }, h1);
    const activityId = createActRes.data.data._id;
    console.log('✅ Create sports activity works');

    // 15. GET ACTIVITIES
    await fetchAPI('GET', '/fitness/activities', null, h1);
    console.log('✅ Get activities works');

    // 16. UPDATE ACTIVITY
    const updateActRes = await fetchAPI('PUT', `/fitness/activities/${activityId}`, { duration: 50 }, h1);
    if (updateActRes.data.data.duration === 50) console.log('✅ Update activity works');

    // 17. DELETE ACTIVITY
    await fetchAPI('DELETE', `/fitness/activities/${activityId}`, null, h1);
    console.log('✅ Delete activity works');

    // 18. CREATE FITNESS GOAL
    const createGoalRes = await fetchAPI('POST', '/fitness/goals', {
      goal_type: 'Calories', target_value: 2000, period: 'Daily'
    }, h1);
    const goalId = createGoalRes.data.data._id;
    console.log('✅ Create fitness goal works');

    // 19. GET GOALS
    await fetchAPI('GET', '/fitness/goals', null, h1);
    console.log('✅ Get goals works');

    // 20. UPDATE GOAL
    const updateGoalRes = await fetchAPI('PUT', `/fitness/goals/${goalId}`, { target_value: 2500 }, h1);
    if (updateGoalRes.data.data.target_value === 2500) console.log('✅ Update goal works');

    // 21. DELETE GOAL
    await fetchAPI('DELETE', `/fitness/goals/${goalId}`, null, h1);
    console.log('✅ Delete goal works');

    console.log('\n✅ ALL COMPREHENSIVE TESTS PASSED!');
  } catch (error) {
    console.error('\n❌ Test failed:');
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(error);
    }
    process.exitCode = 1;
  } finally {
    if (server) server.close();
    await mongoose.disconnect();
  }
}

testFitnessAPI();
