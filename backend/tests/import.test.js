const request = require('supertest');
const app = require('../server');
const path = require('path');

describe('Import API', () => {
  test('should validate Excel file', async () => {
    const response = await request(app)
      .post('/api/preview')
      .attach('file', path.join(__dirname, 'fixtures/valid.xlsx'));
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('validationResults');
  });

  test('should reject invalid file', async () => {
    const response = await request(app)
      .post('/api/preview')
      .attach('file', path.join(__dirname, 'fixtures/invalid.txt'));
    
    expect(response.status).toBe(400);
  });
}); 