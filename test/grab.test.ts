import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { grab,type GrabOptions, log, printJSONStructure, type GrabFunction } from 'grab-url';


// Mock fetch globally
global.fetch = vi.fn();

describe('GRAB API Library - Core Functions', () => {
  beforeEach(() => {
    // Reset globals before each test
    window.grab.log = {};
    window.grabMockServer = {};
    window.grabDefaults = {};
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Basic HTTP Requests', () => {
    it('should make a GET request with correct URL format', async () => {
      const mockResponse = { data: 'test', success: true };
      global.fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      type User = { 
        /** Name of the user  */ 
        name: string;
        /** Age of the user  */ 
        age: number;
      };

      type RequestParams = { 
        /** Query String  to search for */ 
        q : string;
        /** Category of search  */
        category?: "news" | "general";

      };

      const result = await grab<User, RequestParams>('test-path', {
        q: " react",
        category: "gen",
        fd: 5,
      });
      result.name

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/test-path?',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json'
          })
        })
      );
      expect(result.data).toBe('test');
      expect(result.success).toBe(true);
    });

    it('should make a POST request without polluting body data', async () => {
      const mockResponse = { id: 1, created: true };
      global.fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      const response = {};
      const requestData = { name: 'test', email: 'test@example.com' };
     
      await grab('users', response, {
        post: true,
        ...requestData
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          post: true,
          body: JSON.stringify(requestData) // Should not contain page: 1
        })
      );
      expect(response.id).toBe(1);
      expect(response.created).toBe(true);
    });

    it('should handle custom base URL correctly', async () => {
      const mockResponse = { status: 'ok' };
      global.fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      await grab('health', {}, {
        baseURL: 'https://api.example.com/v1/'
      });

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/v1/health?',
        expect.any(Object)
      );
    });

    it('should handle errors properly', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const response = {};
      const result = await grab('failing-endpoint', response);

      expect(response.error).toBe('Network error'); // Should be clean error message
      expect(result.error).toBe('Network error');
    });

    it('should handle non-JSON responses', async () => {
      const textResponse = 'Plain text response';
      global.fetch.mockResolvedValueOnce({
        text: () => Promise.resolve(textResponse)
      });

      const result = await grab('text-endpoint', {});
      expect(result).toBe(textResponse);
    });
  });

  describe('Loading State Management', () => {
    it('should set and clear isLoading state', async () => {
      const mockResponse = { data: 'test' };
      let resolvePromise;
      const fetchPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      global.fetch.mockReturnValueOnce(fetchPromise);

      const response = {};
      const grabPromise = grab('test', response);
      
      // Should be loading initially
      expect(response.isLoading).toBe(true);
      
      // Resolve the fetch
      resolvePromise({
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });
      
      await grabPromise;
      
      // Should not be loading after completion
      expect(response.isLoading).toBe(false);
    });
  });

  describe('Mock Server Support', () => {
    it('should use mock server when configured', async () => {
      const mockData = { users: [{ id: 1, name: 'John' }] };
      window.grabMockServer['users'] = {
        response: mockData,
        method: 'GET'
      };

      const response = {};
      await grab('users', response);

      expect(response.users).toEqual([{ id: 1, name: 'John' }]);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should use mock server with function response', async () => {
      window.grabMockServer['search'] = {
        response: (params) => ({ 
          results: [`Result for ${params.query}`] 
        }),
        post: true
      };

      const response = {};
      await grab('search', response, {
        post: true,
        query: 'test search'
      });

      expect(response.results).toEqual(['Result for test search']);
    });
  });

  describe('Caching', () => {
    it('should cache responses when cache option is true', async () => {
      const mockResponse = { data: 'cached' };
      global.fetch.mockResolvedValue({
        text: () => Promise.resolve(JSON.stringify(mockResponse))
      });

      // First request
      const response1 = {};
      await grab('cacheable', response1, { cache: true });
      
      // Second identical request should use cache
      const response2 = {};
      await grab('cacheable', response2, { cache: true });

      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(response2.data).toBe('cached');
    });
  });

  describe('Pagination', () => {
    it('should handle pagination when explicitly configured', async () => {
      const page1Response = { items: ['item1', 'item2'], hasMore: true };
      const page2Response = { items: ['item3', 'item4'], hasMore: false };
      
      global.fetch
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(page1Response))
        })
        .mockResolvedValueOnce({
          text: () => Promise.resolve(JSON.stringify(page2Response))
        });

      const response = {};
      
      // First page
      await grab('paginated', response, {
        paginateResult: 'items',
        paginateKey: 'page',
        page: 1
      });
      
      expect(response.items).toEqual(['item1', 'item2']);
      
      // Second page should append
      await grab('paginated', response, {
        paginateResult: 'items', 
        paginateKey: 'page',
        page: 2
      });
      
      expect(response.items).toEqual(['item1', 'item2', 'item3', 'item4']);
    });
  });
});

describe('Utility Functions', () => {
  describe('log() function', () => {
    beforeEach(() => {
      vi.spyOn(console, 'debug').mockImplementation(() => {});
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should use console.debug in development', () => {
      window.location.hostname = 'localhost';
      
      log('Test message');
      
      expect(console.debug).toHaveBeenCalledWith(
        '%cTest message',
        'color: blue; font-size: 14px;'
      );
    });

    it('should handle object messages with structure description', () => {
      const testObj = { name: 'test', count: 5 };
      
      log(testObj);
      
      // Should call debug with structure description
      expect(console.debug).toHaveBeenCalled();
      const [message] = console.debug.mock.calls[0];
      expect(message).toContain('name: string');
      expect(message).toContain('count: number');
    });
  });

  describe('printJSONStructure() function', () => {
    it('should describe simple object structure', () => {
      const obj = { name: 'John', age: 30, active: true };
      const result = printJSONStructure(obj);
      
      expect(result).toBe('{ name: string, age: number, active: boolean }');
    });

    it('should describe nested object structure', () => {
      const obj = {
        user: { name: 'John', profile: { bio: 'Developer' } },
        count: 5
      };
      const result = printJSONStructure(obj);
      
      expect(result).toBe('{ user: { name: string, profile: { bio: string } }, count: number }');
    });

    it('should describe array structures', () => {
      const obj = {
        users: [{ name: 'John', age: 30 }],
        tags: ['javascript', 'testing'],
        empty: []
      };
      const result = printJSONStructure(obj);
      
      expect(result).toBe('{ users: Array<{ name: string, age: number }>, tags: Array<string>, empty: Array<unknown> }');
    });

    it('should handle primitive values', () => {
      expect(printJSONStructure('string')).toBe('string');
      expect(printJSONStructure(42)).toBe('number');
      expect(printJSONStructure(true)).toBe('boolean');
      expect(printJSONStructure(null)).toBe('null');
    });
  });
});

describe('Global State Management', () => {
  it('should maintain grab.log for debugging', async () => {
    const mockResponse = { data: 'logged' };
    global.fetch.mockResolvedValue({
      text: () => Promise.resolve(JSON.stringify(mockResponse))
    });

    await grab('logged-endpoint', {});

    // Should log the request for debugging
    expect(window.grab.log['logged-endpoint']).toBeDefined();
  });
});