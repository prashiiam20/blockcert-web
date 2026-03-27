import { NETWORKS, ROLES, ROLE_NAMES } from './config/contracts';

describe('frontend configuration', () => {
  test('defines localhost network for local development', () => {
    expect(NETWORKS.localhost).toBeDefined();
    expect(NETWORKS.localhost.chainId).toBe('0x539');
    expect(NETWORKS.localhost.rpcUrl).toMatch(/^http/);
  });

  test('keeps role ids and labels in sync', () => {
    expect(ROLES.GOVERNMENT).toBe(1);
    expect(ROLES.RECRUITER).toBe(5);
    expect(ROLE_NAMES[ROLES.GOVERNMENT]).toBe('Government');
    expect(ROLE_NAMES[ROLES.RECRUITER]).toBe('Recruiter');
  });
});
