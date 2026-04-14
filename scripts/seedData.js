'use strict';

const path = require('path');

// Resolve server node_modules so this script can be run from the project root
const serverModules = path.resolve(__dirname, '../server/node_modules');
require('module').Module._nodeModulePaths(__dirname).unshift(serverModules);

// Load env from server/.env first, then fall back to root .env
const serverEnv = path.resolve(__dirname, '../server/.env');
const rootEnv   = path.resolve(__dirname, '../.env');

require(path.join(serverModules, 'dotenv')).config({ path: serverEnv });
require(path.join(serverModules, 'dotenv')).config({ path: rootEnv });

const mongoose = require(path.join(serverModules, 'mongoose'));

// Models are one level up in server/models/
const User    = require('../server/models/User');
const Log     = require('../server/models/Log');
const Attack  = require('../server/models/Attack');
const Defense = require('../server/models/Defense');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/zt-wss';

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB:', MONGODB_URI);

  // ── Users ────────────────────────────────────────────────────────────────
  const defaultUsers = [
    { username: 'admin',    email: 'admin@zt-wss.local',    password: 'Admin@123',    role: 'admin'    },
    { username: 'analyst',  email: 'analyst@zt-wss.local',  password: 'Analyst@123',  role: 'analyst'  },
    { username: 'attacker', email: 'attacker@zt-wss.local', password: 'Attacker@123', role: 'attacker' },
  ];

  for (const userData of defaultUsers) {
    const exists = await User.findOne({ username: userData.username });
    if (!exists) {
      await User.create(userData);
      console.log(`  ✔ Created user: ${userData.username} (${userData.role})`);
    } else {
      console.log(`  – User already exists: ${userData.username}`);
    }
  }

  // ── Defense config ───────────────────────────────────────────────────────
  const defenseEntries = [
    { key: 'rateLimiting',      value: true },
    { key: 'inputSanitization', value: true },
    { key: 'cspEnabled',        value: true },
    { key: 'wafEnabled',        value: true },
  ];

  for (const entry of defenseEntries) {
    await Defense.findOneAndUpdate(
      { key: entry.key },
      { key: entry.key, value: entry.value, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    console.log(`  ✔ Defense config set: ${entry.key} = ${entry.value}`);
  }

  // ── Sample Logs ──────────────────────────────────────────────────────────
  const sampleLogs = [
    {
      level: 'info',
      source: 'auth',
      method: 'POST',
      path: '/api/auth/login',
      payload: '{"username":"analyst"}',
      username: 'analyst',
      detectionFlags: [],
      blocked: false,
    },
    {
      level: 'warning',
      source: 'attack',
      method: 'POST',
      path: '/api/attacks/simulate',
      payload: "' OR '1'='1",
      username: 'attacker',
      detectionFlags: ['sql-injection-pattern'],
      blocked: false,
    },
    {
      level: 'critical',
      source: 'attack',
      method: 'POST',
      path: '/api/attacks/simulate',
      payload: '<script>alert(1)</script>',
      username: 'attacker',
      detectionFlags: ['xss-pattern'],
      blocked: true,
    },
    {
      level: 'warning',
      source: 'auth',
      method: 'POST',
      path: '/api/auth/login',
      payload: '{"username":"admin"}',
      username: 'unknown',
      detectionFlags: ['brute-force-detected'],
      blocked: true,
    },
    {
      level: 'info',
      source: 'defense',
      method: 'PUT',
      path: '/api/defense',
      payload: '{"wafEnabled":true}',
      username: 'admin',
      detectionFlags: [],
      blocked: false,
    },
  ];

  await Log.insertMany(sampleLogs);
  console.log(`  ✔ Inserted ${sampleLogs.length} sample log entries`);

  // ── Sample Attacks ───────────────────────────────────────────────────────
  const sampleAttacks = [
    {
      type: 'sqli',
      payload: "' OR '1'='1' --",
      options: { target: 'login' },
      result: { vulnerable: false, message: 'Input sanitization blocked the payload' },
      username: 'attacker',
    },
    {
      type: 'xss',
      payload: '<img src=x onerror=alert(document.cookie)>',
      options: { context: 'reflected' },
      result: { vulnerable: false, message: 'CSP and XSS filter prevented execution' },
      username: 'attacker',
    },
    {
      type: 'brute-force',
      payload: 'password123',
      options: { attempts: 10, target: 'admin' },
      result: { vulnerable: false, message: 'Rate limiter blocked after 5 attempts' },
      username: 'attacker',
    },
  ];

  await Attack.insertMany(sampleAttacks);
  console.log(`  ✔ Inserted ${sampleAttacks.length} sample attack entries`);

  console.log('\n✅ Seed completed successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
