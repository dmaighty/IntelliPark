export const DEV_MOCK_ACCESS_TOKEN = '__DEV_MOCK_ACCESS_TOKEN__';

export function getMockUser() {
  return {
    id: 0,
    full_name: 'Dev User',
    email: 'dev@localhost',
    role: 'driver',
    created_at: new Date().toISOString(),
  };
}

export function getMockAuthPayload() {
  return {
    access_token: DEV_MOCK_ACCESS_TOKEN,
    token_type: 'bearer',
    user: getMockUser(),
  };
}

export function isDevMockToken(token) {
  return token === DEV_MOCK_ACCESS_TOKEN;
}
