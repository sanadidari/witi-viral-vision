// Mock heavy dependencies BEFORE any require() calls
jest.mock('mongoose', () => ({
  connect: jest.fn().mockResolvedValue({}),
  connection: { readyState: 1 },
}));

jest.mock('../models', () => ({
  Store: { findOne: jest.fn(), find: jest.fn() },
  Video: jest.fn().mockImplementation(function (data) {
    Object.assign(this, data);
    this.save = jest.fn().mockResolvedValue(this);
  }),
}));

jest.mock('replicate', () =>
  jest.fn().mockImplementation(() => ({
    run: jest.fn().mockResolvedValue(['https://mock-replicate-output.com/video.mp4']),
  }))
);

jest.mock('@wix/sdk', () => ({ createClient: jest.fn(), OAuthStrategy: jest.fn() }));
jest.mock('@wix/stores', () => ({ products: {} }));

const request = require('supertest');
const app     = require('../index');
const { Store } = require('../models');

afterEach(() => jest.clearAllMocks());

// ─── /api/health ─────────────────────────────────────────────────────────────

describe('GET /api/health', () => {
  test('returns status ok with db and config flags', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('db');
    expect(res.body).toHaveProperty('replicateConfigured');
    expect(res.body).toHaveProperty('wixConfigured');
  });
});

// ─── /api/generate-video — credit guard ──────────────────────────────────────

describe('POST /api/generate-video — credit logic', () => {
  test('returns 400 when instanceId is missing', async () => {
    const res = await request(app)
      .post('/api/generate-video')
      .send({ prompt: 'test prompt' });
    expect(res.status).toBe(400);
  });

  test('returns 404 when store is not found', async () => {
    Store.findOne.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/generate-video')
      .send({ instanceId: 'unknown-instance', prompt: 'test' });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('returns 403 when store has zero credits', async () => {
    Store.findOne.mockResolvedValue({ instanceId: 'inst-broke', credits: 0 });

    const res = await request(app)
      .post('/api/generate-video')
      .send({ instanceId: 'inst-broke', prompt: 'test' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/crédit/i);
  });

  test('returns 403 when store has negative credits', async () => {
    Store.findOne.mockResolvedValue({ instanceId: 'inst-neg', credits: -5 });

    const res = await request(app)
      .post('/api/generate-video')
      .send({ instanceId: 'inst-neg', prompt: 'test' });

    expect(res.status).toBe(403);
  });

  test('calls Replicate and returns prediction when credits are available', async () => {
    const mockSave = jest.fn().mockResolvedValue({});
    Store.findOne.mockResolvedValue({
      instanceId: 'inst-ok',
      credits: 5,
      save: mockSave,
    });

    const res = await request(app)
      .post('/api/generate-video')
      .send({
        instanceId: 'inst-ok',
        imageUrl: 'https://example.com/product.jpg',
        prompt: 'Cinematic product ad',
        productName: 'Test Product',
      });

    // Should succeed (2xx) or be processing (202/200)
    expect([200, 202]).toContain(res.status);
  });
});

// ─── /api/stores ─────────────────────────────────────────────────────────────

describe('GET /api/stores', () => {
  test('returns list of stores', async () => {
    Store.find.mockReturnValue({
      select: jest.fn().mockResolvedValue([
        { instanceId: 'inst-1', credits: 10 },
        { instanceId: 'inst-2', credits: 3 },
      ]),
    });

    const res = await request(app).get('/api/stores');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stores).toHaveLength(2);
  });

  test('returns 500 on database error', async () => {
    Store.find.mockReturnValue({
      select: jest.fn().mockRejectedValue(new Error('DB failure')),
    });

    const res = await request(app).get('/api/stores');
    expect(res.status).toBe(500);
  });
});
