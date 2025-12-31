#!/usr/bin/env node

/**
 * petstore-api - MCP Server
 * 
 * Auto-generated from OpenAPI specification using mcp-use framework.
 * 
 * Features:
 * - 19 API tools available
 * - Built-in Inspector at http://localhost:3000/inspector
 * - Streamable HTTP transport
 */

import 'dotenv/config';
import { MCPServer } from 'mcp-use/server';
import { z } from 'zod';
import { executeRequest } from './http-client.js';
import { toolConfigMap } from './tools-config.js';

// ============================================================================
// Configuration
// ============================================================================

const PORT = parseInt(process.env.PORT || '3000');
const isDev = process.env.NODE_ENV !== 'production';

// API configuration
const apiConfig = {
  baseUrl: process.env.API_BASE_URL || '/api/v3',
  headers: {},
};

// Set up authentication headers
if (process.env.API_KEY) {
  apiConfig.headers['Authorization'] = `Bearer ${process.env.API_KEY}`;
}

if (process.env.API_AUTH_HEADER) {
  const [key, ...valueParts] = process.env.API_AUTH_HEADER.split(':');
  const value = valueParts.join(':'); // Handle values with colons
  if (key && value) {
    apiConfig.headers[key.trim()] = value.trim();
  }
}

// ============================================================================
// Server Setup
// ============================================================================

const server = new MCPServer({
  name: 'petstore-api',
  version: '1.0.0',
  description: 'MCP server generated from OpenAPI specification',
  baseUrl: process.env.MCP_URL || `http://localhost:${PORT}`,
  allowedOrigins: isDev
    ? undefined  // Development: allow all origins
    : process.env.ALLOWED_ORIGINS?.split(',').map(s => s.trim()) || [],
});

// ============================================================================
// Tool Registrations
// ============================================================================

// Add a new pet to the store.
server.tool('addPet', {
  description: 'Add a new pet to the store.',
  parameters: z.object({
    requestBody: z.unknown().describe('Create a new pet in the store')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('addPet');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Update an existing pet.
server.tool('updatePet', {
  description: 'Update an existing pet.',
  parameters: z.object({
    requestBody: z.unknown().describe('Update an existent pet in the store')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('updatePet');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Finds Pets by status.
server.tool('findPetsByStatus', {
  description: 'Finds Pets by status.',
  parameters: z.object({
    status: z.enum(['available', 'pending', 'sold']).describe('Status values that need to be considered for filter')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('findPetsByStatus');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Finds Pets by tags.
server.tool('findPetsByTags', {
  description: 'Finds Pets by tags.',
  parameters: z.object({
    tags: z.array(z.string()).describe('Tags to filter by')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('findPetsByTags');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Find pet by ID.
server.tool('getPetById', {
  description: 'Find pet by ID.',
  parameters: z.object({
    petId: z.number().int().describe('ID of pet to return')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('getPetById');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Updates a pet in the store with form data.
server.tool('updatePetWithForm', {
  description: 'Updates a pet in the store with form data.',
  parameters: z.object({
    petId: z.number().int().describe('ID of pet that needs to be updated'),
    name: z.string().optional().describe('Name of pet that needs to be updated'),
    status: z.string().optional().describe('Status of pet that needs to be updated')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('updatePetWithForm');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Deletes a pet.
server.tool('deletePet', {
  description: 'Deletes a pet.',
  parameters: z.object({
    api_key: z.string().optional(),
    petId: z.number().int().describe('Pet id to delete')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('deletePet');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Uploads an image.
server.tool('uploadFile', {
  description: 'Uploads an image.',
  parameters: z.object({
    petId: z.number().int().describe('ID of pet to update'),
    additionalMetadata: z.string().optional().describe('Additional Metadata'),
    requestBody: z.string().optional().describe('Request body')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('uploadFile');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Returns pet inventories by status.
server.tool('getInventory', {
  description: 'Returns pet inventories by status.',
  parameters: z.object({}),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('getInventory');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Place an order for a pet.
server.tool('placeOrder', {
  description: 'Place an order for a pet.',
  parameters: z.object({
    requestBody: z.unknown().optional().describe('Request body')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('placeOrder');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Find purchase order by ID.
server.tool('getOrderById', {
  description: 'Find purchase order by ID.',
  parameters: z.object({
    orderId: z.number().int().describe('ID of order that needs to be fetched')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('getOrderById');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Delete purchase order by identifier.
server.tool('deleteOrder', {
  description: 'Delete purchase order by identifier.',
  parameters: z.object({
    orderId: z.number().int().describe('ID of the order that needs to be deleted')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('deleteOrder');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Create user.
server.tool('createUser', {
  description: 'Create user.',
  parameters: z.object({
    requestBody: z.unknown().optional().describe('Created user object')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('createUser');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Creates list of users with given input array.
server.tool('createUsersWithListInput', {
  description: 'Creates list of users with given input array.',
  parameters: z.object({
    requestBody: z.array(z.unknown()).optional().describe('Request body')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('createUsersWithListInput');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Logs user into the system.
server.tool('loginUser', {
  description: 'Logs user into the system.',
  parameters: z.object({
    username: z.string().optional().describe('The user name for login'),
    password: z.string().optional().describe('The password for login in clear text')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('loginUser');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Logs out current logged in user session.
server.tool('logoutUser', {
  description: 'Logs out current logged in user session.',
  parameters: z.object({}),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('logoutUser');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Get user by user name.
server.tool('getUserByName', {
  description: 'Get user by user name.',
  parameters: z.object({
    username: z.string().describe('The name that needs to be fetched. Use user1 for testing')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('getUserByName');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Update user resource.
server.tool('updateUser', {
  description: 'Update user resource.',
  parameters: z.object({
    username: z.string().describe('name that need to be deleted'),
    requestBody: z.unknown().optional().describe('Update an existent user in the store')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('updateUser');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// Delete user resource.
server.tool('deleteUser', {
  description: 'Delete user resource.',
  parameters: z.object({
    username: z.string().describe('The name that needs to be deleted')
  }),
  execute: async (params) => {
    const toolConfig = toolConfigMap.get('deleteUser');
    const result = await executeRequest(toolConfig, params, apiConfig);

    if (result.ok) {
      return typeof result.data === 'string'
        ? result.data
        : JSON.stringify(result.data, null, 2);
    } else {
      throw new Error(`API Error (${result.status}): ${typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }`);
    }
  },
});

// ============================================================================
// Start Server
// ============================================================================

server.listen(PORT);

console.log(`
🚀 petstore-api MCP Server Started!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📍 Server:    http://localMCP Server Starthost:${PORT}
🔍 Inspector: http://localhost:${PORT}/inspector
📡 MCP:       http://localhost:${PORT}/mcp
🔄 SSE:       http://localhost:${PORT}/sse

🛠️  Tools Available: 19
   • addPet
   • updatePet
   • findPetsByStatus
   • findPetsByTags
   • getPetById
   ... and 14 more

Environment: ${isDev ? 'Development' : 'Production'}
API Base:    ${apiConfig.baseUrl || 'Not configured'}

Press Ctrl+C to stop the server.
`);
