// Tool configurations extracted from OpenAPI spec
// Generated: 2025-12-30T23:36:57.080Z

export const toolConfigs = [
  {
    "name": "addPet",
    "description": "Add a new pet to the store.",
    "method": "post",
    "pathTemplate": "/pet",
    "executionParameters": [],
    "requestBodyContentType": "application/json",
    "baseUrl": "/api/v3"
  },
  {
    "name": "updatePet",
    "description": "Update an existing pet.",
    "method": "put",
    "pathTemplate": "/pet",
    "executionParameters": [],
    "requestBodyContentType": "application/json",
    "baseUrl": "/api/v3"
  },
  {
    "name": "findPetsByStatus",
    "description": "Finds Pets by status.",
    "method": "get",
    "pathTemplate": "/pet/findByStatus",
    "executionParameters": [
      {
        "name": "status",
        "in": "query"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "findPetsByTags",
    "description": "Finds Pets by tags.",
    "method": "get",
    "pathTemplate": "/pet/findByTags",
    "executionParameters": [
      {
        "name": "tags",
        "in": "query"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "getPetById",
    "description": "Find pet by ID.",
    "method": "get",
    "pathTemplate": "/pet/{petId}",
    "executionParameters": [
      {
        "name": "petId",
        "in": "path"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "updatePetWithForm",
    "description": "Updates a pet in the store with form data.",
    "method": "post",
    "pathTemplate": "/pet/{petId}",
    "executionParameters": [
      {
        "name": "petId",
        "in": "path"
      },
      {
        "name": "name",
        "in": "query"
      },
      {
        "name": "status",
        "in": "query"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "deletePet",
    "description": "Deletes a pet.",
    "method": "delete",
    "pathTemplate": "/pet/{petId}",
    "executionParameters": [
      {
        "name": "api_key",
        "in": "header"
      },
      {
        "name": "petId",
        "in": "path"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "uploadFile",
    "description": "Uploads an image.",
    "method": "post",
    "pathTemplate": "/pet/{petId}/uploadImage",
    "executionParameters": [
      {
        "name": "petId",
        "in": "path"
      },
      {
        "name": "additionalMetadata",
        "in": "query"
      }
    ],
    "requestBodyContentType": "application/octet-stream",
    "baseUrl": "/api/v3"
  },
  {
    "name": "getInventory",
    "description": "Returns pet inventories by status.",
    "method": "get",
    "pathTemplate": "/store/inventory",
    "executionParameters": [],
    "baseUrl": "/api/v3"
  },
  {
    "name": "placeOrder",
    "description": "Place an order for a pet.",
    "method": "post",
    "pathTemplate": "/store/order",
    "executionParameters": [],
    "requestBodyContentType": "application/json",
    "baseUrl": "/api/v3"
  },
  {
    "name": "getOrderById",
    "description": "Find purchase order by ID.",
    "method": "get",
    "pathTemplate": "/store/order/{orderId}",
    "executionParameters": [
      {
        "name": "orderId",
        "in": "path"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "deleteOrder",
    "description": "Delete purchase order by identifier.",
    "method": "delete",
    "pathTemplate": "/store/order/{orderId}",
    "executionParameters": [
      {
        "name": "orderId",
        "in": "path"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "createUser",
    "description": "Create user.",
    "method": "post",
    "pathTemplate": "/user",
    "executionParameters": [],
    "requestBodyContentType": "application/json",
    "baseUrl": "/api/v3"
  },
  {
    "name": "createUsersWithListInput",
    "description": "Creates list of users with given input array.",
    "method": "post",
    "pathTemplate": "/user/createWithList",
    "executionParameters": [],
    "requestBodyContentType": "application/json",
    "baseUrl": "/api/v3"
  },
  {
    "name": "loginUser",
    "description": "Logs user into the system.",
    "method": "get",
    "pathTemplate": "/user/login",
    "executionParameters": [
      {
        "name": "username",
        "in": "query"
      },
      {
        "name": "password",
        "in": "query"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "logoutUser",
    "description": "Logs out current logged in user session.",
    "method": "get",
    "pathTemplate": "/user/logout",
    "executionParameters": [],
    "baseUrl": "/api/v3"
  },
  {
    "name": "getUserByName",
    "description": "Get user by user name.",
    "method": "get",
    "pathTemplate": "/user/{username}",
    "executionParameters": [
      {
        "name": "username",
        "in": "path"
      }
    ],
    "baseUrl": "/api/v3"
  },
  {
    "name": "updateUser",
    "description": "Update user resource.",
    "method": "put",
    "pathTemplate": "/user/{username}",
    "executionParameters": [
      {
        "name": "username",
        "in": "path"
      }
    ],
    "requestBodyContentType": "application/json",
    "baseUrl": "/api/v3"
  },
  {
    "name": "deleteUser",
    "description": "Delete user resource.",
    "method": "delete",
    "pathTemplate": "/user/{username}",
    "executionParameters": [
      {
        "name": "username",
        "in": "path"
      }
    ],
    "baseUrl": "/api/v3"
  }
];

// Create a map for quick lookup
export const toolConfigMap = new Map(toolConfigs.map(t => [t.name, t]));
