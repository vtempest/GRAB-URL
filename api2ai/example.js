/**
 * Example: Programmatic usage of the OpenAPI to MCP-Use generator
 * 
 * This script demonstrates various ways to use the generator.
 */

import { generateMcpServer, extractTools, loadOpenApiSpec } from './generate-mcp-use-server.js';

// ============================================================================
// Example 1: Generate from a remote URL
// ============================================================================

async function generateFromUrl() {
  console.log('Example 1: Generate from URL\n');
  
  const result = await generateMcpServer(
    'https://petstore3.swagger.io/api/v3/openapi.json',
    './petstore-mcp',
    {
      serverName: 'petstore-api',
      baseUrl: 'https://petstore3.swagger.io/api/v3',
      port: 3000,
    }
  );
  
  console.log('Generated tools:', result.tools.slice(0, 5), '...');
}

// ============================================================================
// Example 2: Generate with filtering
// ============================================================================

async function generateWithFiltering() {
  console.log('Example 2: Generate with filtering\n');
  
  const result = await generateMcpServer(
    'https://petstore3.swagger.io/api/v3/openapi.json',
    './petstore-readonly',
    {
      serverName: 'petstore-readonly',
      // Only include GET endpoints (read-only)
      filterFn: (tool) => tool.method.toLowerCase() === 'get',
      port: 3001,
    }
  );
  
  console.log(`Generated ${result.toolCount} read-only tools`);
}

// ============================================================================
// Example 3: Extract tools without generating server
// ============================================================================

async function extractToolsOnly() {
  console.log('Example 3: Extract tools only\n');
  
  const spec = await loadOpenApiSpec('https://petstore3.swagger.io/api/v3/openapi.json');
  
  console.log(`API: ${spec.info.title} v${spec.info.version}`);
  
  const tools = extractTools(spec, {
    baseUrl: 'https://petstore3.swagger.io/api/v3',
    // Exclude dangerous operations
    excludeOperationIds: ['deletePet', 'deleteOrder', 'deleteUser'],
    // Only include pet-related endpoints
    filterFn: (tool) => tool.pathTemplate.includes('/pet'),
  });
  
  console.log('\nExtracted pet-related tools:');
  tools.forEach(tool => {
    console.log(`  ${tool.method.toUpperCase().padEnd(6)} ${tool.pathTemplate}`);
    console.log(`    → ${tool.name}: ${tool.description}`);
  });
}

// ============================================================================
// Example 4: Generate from local file
// ============================================================================

async function generateFromLocalFile() {
  console.log('Example 4: Generate from local file\n');
  
  // This would work with a local file:
  // const result = await generateMcpServer(
  //   './my-api-spec.yaml',
  //   './my-api-mcp',
  //   {
  //     serverName: 'my-api',
  //     port: 3002,
  //   }
  // );
  
  console.log('(Skipped - requires local file)');
}

// ============================================================================
// Example 5: Advanced - Custom tool processing
// ============================================================================

async function advancedUsage() {
  console.log('Example 5: Advanced tool processing\n');
  
  const spec = await loadOpenApiSpec('https://petstore3.swagger.io/api/v3/openapi.json');
  const tools = extractTools(spec);
  
  // Analyze the tools
  const methodCounts = {};
  const tagCounts = {};
  
  tools.forEach(tool => {
    methodCounts[tool.method] = (methodCounts[tool.method] || 0) + 1;
  });
  
  console.log('Tools by HTTP method:');
  Object.entries(methodCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([method, count]) => {
      console.log(`  ${method.toUpperCase()}: ${count} tools`);
    });
  
  console.log('\nTools with request body:', 
    tools.filter(t => t.requestBodyContentType).length);
  
  console.log('Tools requiring path params:', 
    tools.filter(t => t.executionParameters.some(p => p.in === 'path')).length);
}

// ============================================================================
// Run examples
// ============================================================================

async function main() {
  const example = process.argv[2] || 'all';
  
  try {
    switch (example) {
      case '1':
        await generateFromUrl();
        break;
      case '2':
        await generateWithFiltering();
        break;
      case '3':
        await extractToolsOnly();
        break;
      case '4':
        await generateFromLocalFile();
        break;
      case '5':
        await advancedUsage();
        break;
      case 'all':
      default:
        // Just run the analysis example by default
        await advancedUsage();
        console.log('\n---\nRun specific example with: node example.js [1-5]');
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
