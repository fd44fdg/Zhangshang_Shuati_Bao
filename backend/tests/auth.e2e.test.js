const request = require('supertest');
// Build full server app (uses server.js). Ensure DB is real via USE_REAL_DB_FOR_TEST=true
const app = require('../server');

// Run with USE_REAL_DB_FOR_TEST=true to hit real DB (MySQL/sqlite); otherwise db is stubbed
const useRealDb = process.env.USE_REAL_DB_FOR_TEST === 'true';

describe('Auth E2E flow (register -> login -> verify)', () => {
  const u = {
    username: 'e2e_user_' + Math.random().toString(36).slice(2, 8),
    email: `e2e_${Date.now()}@example.com`,
    password: 'Test1234!',
    nickname: 'E2E'
  };

  (useRealDb ? test : test.skip)('register/login/verify should work with real DB', async () => {
    // register
    const r1 = await request(app)
      .post('/api/v1/auth/register')
      .send(u)
      .set('Content-Type', 'application/json');
    expect([200, 201]).toContain(r1.status);
    expect(r1.body.success).toBe(true);

    // login
    const r2 = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: u.username, password: u.password })
      .set('Content-Type', 'application/json');
    expect(r2.status).toBe(200);
    expect(r2.body.success).toBe(true);
    expect(r2.body.data.token).toBeTruthy();

    const token = r2.body.data.token;

    // verify
    const r3 = await request(app)
      .get('/api/v1/auth/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(r3.status).toBe(200);
    expect(r3.body.success).toBe(true);
    expect(r3.body.data.user).toBeTruthy();
  });
});
