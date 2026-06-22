import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useApi } from '../apiFetch';
import * as AuthContext from '../../features/auth/AuthContext';

vi.mock('../../features/auth/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('useApi hook', () => {
  const mockLogoutUser = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should inject JWT token into authorization header when token is present', async () => {
    // Arrange
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: { id: '1', username: 'test', email: 'test@test.com' },
      token: 'mock-jwt-token',
      loginUser: vi.fn(),
      logoutUser: mockLogoutUser,
    });

    const mockResponseData = { id: '123', value: 'hello' };
    const mockFetch = vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ data: mockResponseData }),
    } as Response);

    // Act
    const { result } = renderHook(() => useApi());
    const data = await result.current.request('/some-endpoint');

    // Assert
    expect(data).toEqual(mockResponseData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/some-endpoint'),
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    
    const callArgs = mockFetch.mock.calls[0];
    const headers = callArgs?.[1]?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer mock-jwt-token');
  });

  it('should trigger logout when response is 401', async () => {
    // Arrange
    vi.mocked(AuthContext.useAuth).mockReturnValue({
      user: null,
      token: 'expired-token',
      loginUser: vi.fn(),
      logoutUser: mockLogoutUser,
    });

    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    } as Response);

    // Act & Assert
    const { result } = renderHook(() => useApi());
    await expect(result.current.request('/some-endpoint')).rejects.toThrow('Unauthorized');
    expect(mockLogoutUser).toHaveBeenCalled();
  });
});
