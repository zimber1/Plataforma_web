const axios = require('axios');
const fs = require('fs');

const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const RESULTS = [];

async function tryRequest(path, timeoutMs = 5000) {
  const url = `${API_BASE}${path}`;
  const start = Date.now();
  try {
    const res = await axios.get(url, { timeout: timeoutMs });
    const duration = Date.now() - start;
    RESULTS.push({ path, status: res.status, ok: true, duration });
    console.log(`OK ${path} (${res.status}) ${duration}ms`);
  } catch (err) {
    const duration = Date.now() - start;
    const status = err.response ? err.response.status : 'NO_RESPONSE';
    const msg = err.message;
    RESULTS.push({ path, status, ok: false, duration, msg });
    console.log(`ERR ${path} (${status}) ${duration}ms - ${msg}`);
  }
}

async function run() {
  console.log('Simtests running against', API_BASE);

  // 1. quick health checks
  await tryRequest('/api/auth/me', 3000);
  await tryRequest('/api/games/1', 8000);

  // 2. simulate many requests to observe failures
  for (let i = 0; i < 5; i++) {
    await tryRequest('/api/games/1', 8000);
  }

  // write evidence
  const out = {
    timestamp: new Date().toISOString(),
    base: API_BASE,
    results: RESULTS
  };
  fs.writeFileSync('simtests-report.json', JSON.stringify(out, null, 2));
  console.log('Report written to simtests-report.json');
}

run().catch(e => { console.error(e); process.exit(1); });
