# petstore-api

MCP server auto-generated from OpenAPI specification using the [mcp-use](https://mcp-use.com) framework.

## Features

- 🛠️ **19 API Tools** - All operations from the OpenAPI spec
- 🔍 **Built-in Inspector** - Test tools at `/inspector`
- 📡 **Streamable HTTP** - Modern MCP transport
- 🔐 **Authentication Support** - Bearer tokens & custom headers
- 🎨 **UI Widgets** - Compatible with ChatGPT and MCP-UI

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your API credentials

# Start the server
npm start

# Or with hot reload
npm run dev
```

Then open http://localhost:3000/inspector to test your tools!

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3000 |
| `NODE_ENV` | Environment (development/production) | development |
| `API_BASE_URL` | Base URL for API requests | /api/v3 |
| `API_KEY` | Bearer token for Authorization header | - |
| `API_AUTH_HEADER` | Custom auth header (format: `Header:value`) | - |
| `MCP_URL` | Public MCP server URL (for widgets) | http://localhost:3000 |
| `ALLOWED_ORIGINS` | Allowed origins in production (comma-separated) | - |

## Connect to Claude Desktop

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "petstore-api": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

## Connect to ChatGPT

This server supports the OpenAI Apps SDK. Configure your ChatGPT integration to use:

```
http://localhost:3000/mcp
```

## Available Tools

| Tool | Method | Path | Description |
|------|--------|------|-------------|
| `addPet` | POST | /pet | Add a new pet to the store. |
| `updatePet` | PUT | /pet | Update an existing pet. |
| `findPetsByStatus` | GET | /pet/findByStatus | Finds Pets by status. |
| `findPetsByTags` | GET | /pet/findByTags | Finds Pets by tags. |
| `getPetById` | GET | /pet/{petId} | Find pet by ID. |
| `updatePetWithForm` | POST | /pet/{petId} | Updates a pet in the store with form data. |
| `deletePet` | DELETE | /pet/{petId} | Deletes a pet. |
| `uploadFile` | POST | /pet/{petId}/uploadImage | Uploads an image. |
| `getInventory` | GET | /store/inventory | Returns pet inventories by status. |
| `placeOrder` | POST | /store/order | Place an order for a pet. |
| `getOrderById` | GET | /store/order/{orderId} | Find purchase order by ID. |
| `deleteOrder` | DELETE | /store/order/{orderId} | Delete purchase order by identifier. |
| `createUser` | POST | /user | Create user. |
| `createUsersWithListInput` | POST | /user/createWithList | Creates list of users with given input array. |
| `loginUser` | GET | /user/login | Logs user into the system. |
| `logoutUser` | GET | /user/logout | Logs out current logged in user session. |
| `getUserByName` | GET | /user/{username} | Get user by user name. |
| `updateUser` | PUT | /user/{username} | Update user resource. |
| `deleteUser` | DELETE | /user/{username} | Delete user resource. |

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /inspector` | Interactive tool testing UI |
| `POST /mcp` | MCP protocol endpoint |
| `GET /sse` | Server-Sent Events endpoint |
| `GET /health` | Health check endpoint |

## Project Structure

```
petstore-api/
├── .env              # Environment configuration
├── .env.example      # Example environment file
├── package.json      # Dependencies
├── README.md         # This file
└── src/
    ├── index.js      # Main server with tool registrations
    ├── http-client.js # HTTP utilities for API calls
    └── tools-config.js # Tool configurations from OpenAPI
```

## Production Deployment

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
ENV NODE_ENV=production
EXPOSE 3000
CMD ["npm", "start"]
```

### PM2

```bash
pm2 start src/index.js --name petstore-api
```

## Source

- **OpenAPI Spec**: `https://petstore3.swagger.io/api/v3/openapi.json`
- **Generated**: 2025-12-30T23:36:57.107Z
- **Framework**: [mcp-use](https://mcp-use.com)

## License

MIT
