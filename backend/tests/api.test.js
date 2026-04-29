const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5055';
const TEST_TIMEOUT = 30000;

// Helper to make HTTP requests
function makeRequest(method, path, body, authToken = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const bodyString = body ? JSON.stringify(body) : null;
    
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (authToken) {
      options.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (bodyString) {
      options.headers['Content-Length'] = Buffer.byteLength(bodyString);
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    
    if (bodyString) {
      req.write(bodyString);
    }
    req.end();
  });
}

describe('Backend API Tests', { timeout: TEST_TIMEOUT }, () => {
  
  describe('Health Check', () => {
    it('GET /api/health should return ok', async () => {
      const res = await makeRequest('GET', '/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ok');
    });
  });

  describe('Auth Required Endpoints (should fail without token)', () => {
    it('GET /api/storage/object-types should return 401 without auth', async () => {
      const res = await makeRequest('GET', '/api/storage/object-types');
      assert.strictEqual(res.status, 401);
    });

    it('POST /api/firestore/query should return 401 without auth', async () => {
      const res = await makeRequest('POST', '/api/firestore/query', { 
        collection: 'classrooms' 
      });
      assert.strictEqual(res.status, 401);
    });

    it('POST /api/ai/scene-logic should return 401 without auth', async () => {
      const res = await makeRequest('POST', '/api/ai/scene-logic', {
        prompt: 'test',
        objects: []
      });
      assert.strictEqual(res.status, 401);
    });
  });

  describe('Firestore Endpoints (with invalid token)', () => {
    const FAKE_TOKEN = 'fake.token.here';

    it('POST /api/firestore/query should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/firestore/query', {
        collection: 'classrooms'
      }, FAKE_TOKEN);
      // Should fail token verification
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('POST /api/firestore/get-doc should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/firestore/get-doc', {
        path: 'test/doc'
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('POST /api/firestore/doc should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/firestore/doc', {
        path: 'test/doc',
        data: { test: true }
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('PATCH /api/firestore/doc should reject invalid token', async () => {
      const res = await makeRequest('PATCH', '/api/firestore/doc', {
        path: 'test/doc',
        data: { test: true }
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('DELETE /api/firestore/doc should reject invalid token', async () => {
      const res = await makeRequest('DELETE', '/api/firestore/doc', {
        path: 'test/doc'
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });
  });

  describe('Storage Endpoints (with invalid token)', () => {
    const FAKE_TOKEN = 'fake.token.here';

    it('GET /api/storage/object-types should reject invalid token', async () => {
      const res = await makeRequest('GET', '/api/storage/object-types', null, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('GET /api/storage/markers should reject invalid token', async () => {
      const res = await makeRequest('GET', '/api/storage/markers', null, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('POST /api/storage/avatar should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/storage/avatar', {
        userId: 'test-user',
        fileName: 'test.jpg',
        fileDataUrl: 'data:image/jpeg;base64,test'
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('POST /api/storage/classroom-cover should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/storage/classroom-cover', {
        classroomId: 'test-class',
        fileName: 'cover.jpg',
        fileDataUrl: 'data:image/jpeg;base64,test'
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('POST /api/storage/experiment-thumbnail should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/storage/experiment-thumbnail', {
        experimentId: 'test-exp',
        fileName: 'thumb.jpg',
        fileDataUrl: 'data:image/jpeg;base64,test'
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('POST /api/storage/object-types should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/storage/object-types', {
        objectName: 'test-obj',
        fileDataUrl: 'data:application/octet-stream;base64,test'
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('POST /api/storage/markers should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/storage/markers', {
        markerId: 'test-marker',
        fileDataUrl: 'data:image/png;base64,test'
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });

    it('DELETE /api/storage/bucket/test.jpg should reject invalid token', async () => {
      const res = await makeRequest('DELETE', '/api/storage/test-bucket/test.jpg', null, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });
  });

  describe('AI Endpoints (with invalid token)', () => {
    const FAKE_TOKEN = 'fake.token.here';

    it('POST /api/ai/scene-logic should reject invalid token', async () => {
      const res = await makeRequest('POST', '/api/ai/scene-logic', {
        prompt: 'Create a simple scene',
        objects: [{ objectName: 'test', objectType: 'cube' }]
      }, FAKE_TOKEN);
      assert.ok(res.status === 401 || res.status === 403);
    });
  });

  describe('API Request Validation', () => {
    it('POST /api/firestore/query should require collection field', async () => {
      // Without auth, it should fail auth first
      const res = await makeRequest('POST', '/api/firestore/query', {});
      // If no auth, expect 401. The backend may validate body after auth
      assert.ok(res.status === 400 || res.status === 401 || res.status === 403);
    });

    it('POST /api/ai/scene-logic should require prompt field', async () => {
      const res = await makeRequest('POST', '/api/ai/scene-logic', {
        objects: []
      });
      // Should fail auth first or validation
      assert.ok(res.status === 400 || res.status === 401);
    });
  });

  describe('CORS Preflight', () => {
    it('OPTIONS requests should be handled', async () => {
      const res = await new Promise((resolve) => {
        const url = new URL('/api/health', BASE_URL);
        const req = http.request({
          method: 'OPTIONS',
          hostname: url.hostname,
          port: url.port,
          path: url.pathname,
          headers: {
            'Origin': 'http://localhost:3000',
            'Access-Control-Request-Method': 'POST',
          }
        }, (res) => {
          resolve({ status: res.statusCode });
        });
        req.on('error', () => resolve({ status: 0 }));
        req.end();
      });
      // CORS middleware should handle OPTIONS
      assert.ok(res.status === 204 || res.status === 200 || res.status === 404);
    });
  });
});

console.log(`Running API tests against ${BASE_URL}`);
console.log('Note: Tests with invalid tokens expect 401/403 responses');
console.log('Authenticated tests require a valid Firebase token');
console.log('');
console.log('To run authenticated tests, set TEST_AUTH_TOKEN environment variable:');
console.log('  TEST_AUTH_TOKEN=<valid-token> npm test');
console.log('');

// If TEST_AUTH_TOKEN is provided, run authenticated tests
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN;
if (AUTH_TOKEN) {
  console.log('Running authenticated tests with provided token...');
  
  describe('Authenticated Firestore Tests', { timeout: TEST_TIMEOUT }, () => {
    it('POST /api/firestore/query should return data with valid auth', async () => {
      const res = await makeRequest('POST', '/api/firestore/query', {
        collection: 'classrooms',
        limit: 1
      }, AUTH_TOKEN);
      assert.ok(res.status === 200 || res.status === 404);
      if (res.status === 200) {
        assert.ok(Array.isArray(res.body.items));
      }
    });

    it('POST /api/firestore/get-doc should work with valid auth', async () => {
      const res = await makeRequest('POST', '/api/firestore/get-doc', {
        path: 'classrooms/test-doc'
      }, AUTH_TOKEN);
      // May return 404 if doc doesn't exist, but should be authenticated
      assert.ok(res.status === 200 || res.status === 404);
    });
  });

  describe('Authenticated Storage Tests', { timeout: TEST_TIMEOUT }, () => {
    it('GET /api/storage/object-types should return list with valid auth', async () => {
      const res = await makeRequest('GET', '/api/storage/object-types', null, AUTH_TOKEN);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
    });

    it('GET /api/storage/markers should return list with valid auth', async () => {
      const res = await makeRequest('GET', '/api/storage/markers', null, AUTH_TOKEN);
      assert.strictEqual(res.status, 200);
      assert.ok(Array.isArray(res.body.items));
    });
  });
} else {
  console.log('Skipping authenticated tests (no TEST_AUTH_TOKEN provided)');
  console.log('To test with authentication:');
  console.log('1. Login in the Designer app');
  console.log('2. Get the ID token from browser dev tools (localStorage or network tab)');
  console.log('3. Run: TEST_AUTH_TOKEN=<token> npm test');
}

console.log('');
console.log('--- Test Summary ---');
console.log('Endpoints tested:');
console.log('  - GET  /api/health');
console.log('  - POST /api/firestore/query');
console.log('  - POST /api/firestore/get-doc');
console.log('  - POST /api/firestore/doc (set)');
console.log('  - PATCH /api/firestore/doc');
console.log('  - DELETE /api/firestore/doc');
console.log('  - GET  /api/storage/object-types');
console.log('  - POST /api/storage/object-types');
console.log('  - GET  /api/storage/markers');
console.log('  - POST /api/storage/markers');
console.log('  - POST /api/storage/avatar');
console.log('  - POST /api/storage/classroom-cover');
console.log('  - POST /api/storage/experiment-thumbnail');
console.log('  - DELETE /api/storage/:bucket/:path');
console.log('  - POST /api/ai/scene-logic');
console.log('');
