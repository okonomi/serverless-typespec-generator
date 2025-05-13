import { describe, it, expect, vi } from "vitest"
import { parseServerlessConfig, renderDefinitions } from "./typespec"
import type { Model } from "./typespec/model"

import type Serverless from "serverless"
import dedent from "dedent"
import { formatTypeSpec } from "@typespec/compiler"

import type { SLS } from "./types/serverless"
import { Registry } from "./registry"
import type { Operation } from "./typespec/operation"
import type { ModelIR } from "./typespec/ir/type"

const context = describe

async function normalizeTypeSpec(code: string) {
  const formattedCode = await formatTypeSpec(code, {
    indent: "  ",
    lineWidth: 80,
    trailingNewline: false,
  })
  return formattedCode.trimEnd()
}

function createServerlessMock(
  functions: Serverless.FunctionDefinitionHandler[],
): SLS {
  return {
    service: {
      provider: {},
      getAllFunctions: vi.fn(() => {
        return functions.map((fn) => fn.name)
      }),
      getAllEventsInFunction: vi.fn((functionName: string) => {
        const fn = functions.find((f) => f.name === functionName)
        if (!fn) {
          return []
        }
        return fn.events
      }),
    },
  } as unknown as SLS
}

describe("parseServerlessConfig", () => {
  context("when parsing a serverless config", () => {
    context("with no models", () => {
      it("should handle valid serverless configurations", () => {
        const serverless = createServerlessMock([
          {
            name: "hello",
            handler: "handler.hello",
            events: [
              {
                http: {
                  method: "get",
                  path: "/hello",
                },
              },
            ],
          },
        ])
        const { operations } = parseServerlessConfig(serverless)

        expect(operations).toEqual([
          {
            name: "hello",
            returnType: "void",
            http: {
              method: "get",
              path: "/hello",
            },
          },
        ])
      })
    })
    context("with models", () => {
      it("should parse models correctly", () => {
        const serverless = createServerlessMock([
          {
            name: "hello",
            handler: "handler.hello",
            events: [
              {
                http: {
                  method: "post",
                  path: "/hello",
                  request: {
                    schemas: {
                      "application/json": {
                        title: "HelloRequest",
                        type: "object",
                        properties: {
                          name: { type: "string" },
                        },
                      },
                    },
                  },
                },
              },
            ],
          },
        ])
        const { operations, models } = parseServerlessConfig(serverless)

        expect(operations).toEqual([
          {
            name: "hello",
            body: "HelloRequest",
            returnType: "void",
            http: {
              method: "post",
              path: "/hello",
            },
          },
        ])
        expect(Array.from(models.values())).toEqual<ModelIR[]>([
          {
            name: "HelloRequest",
            props: {
              name: { type: "string", required: false },
            },
          },
        ])
      })
    })
    context("with kebab-case name functions", () => {
      it("should operation name collectly", () => {
        const serverless = createServerlessMock([
          {
            name: "hello-world",
            handler: "handler.helloWorld",
            events: [
              {
                http: {
                  method: "get",
                  path: "/hello-world",
                },
              },
            ],
          },
        ])
        const { operations } = parseServerlessConfig(serverless)
        expect(operations).toEqual([
          {
            name: "helloWorld",
            returnType: "void",
            http: {
              method: "get",
              path: "/hello-world",
            },
          },
        ])
      })
    })
    context("with path parameters", () => {
      it("should parse path parameters correctly", () => {
        const serverless = createServerlessMock([
          {
            name: "getUser",
            handler: "handler.getUser",
            events: [
              {
                http: {
                  method: "get",
                  path: "/users/{id}",
                  request: {
                    parameters: {
                      paths: {
                        id: true,
                      },
                    },
                  },
                  documentation: {
                    methodResponses: [
                      {
                        statusCode: 200,
                        responseModels: {
                          "application/json": {
                            title: "User",
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          } as unknown as Serverless.FunctionDefinitionHandler,
        ])
        const { operations } = parseServerlessConfig(serverless)
        expect(operations).toEqual([
          {
            name: "getUser",
            pathParameters: [
              {
                name: "id",
                type: "string",
                required: true,
              },
            ],
            returnType: [
              {
                statusCode: 200,
                type: "User",
              },
            ],
            http: {
              method: "get",
              path: "/users/{id}",
            },
          },
        ])
      })
    })
    context("with anonymous response model", () => {
      it("should parse anonymous response model correctly", () => {
        const serverless = createServerlessMock([
          {
            name: "getUser",
            handler: "handler.getUser",
            events: [
              {
                http: {
                  method: "get",
                  path: "/users/{id}",
                  request: {
                    parameters: {
                      paths: {
                        id: true,
                      },
                    },
                  },
                  documentation: {
                    methodResponses: [
                      {
                        statusCode: 200,
                        responseModels: {
                          "application/json": {
                            type: "object",
                            properties: {
                              id: { type: "string" },
                              name: { type: "string" },
                              email: { type: "string" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          } as unknown as Serverless.FunctionDefinitionHandler,
        ])
        const { operations, models } = parseServerlessConfig(serverless)
        expect(operations).toEqual([
          {
            name: "getUser",
            pathParameters: [
              {
                name: "id",
                type: "string",
                required: true,
              },
            ],
            returnType: [
              {
                statusCode: 200,
                type: {
                  name: null,
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      email: { type: "string" },
                    },
                  },
                },
              },
            ],
            http: {
              method: "get",
              path: "/users/{id}",
            },
          },
        ])
      })
    })
    context("with array response model", () => {
      it("should parse array response model correctly", () => {
        const serverless = createServerlessMock([
          {
            name: "getUsers",
            handler: "handler.getUsers",
            events: [
              {
                http: {
                  method: "get",
                  path: "/users",
                  documentation: {
                    methodResponses: [
                      {
                        statusCode: 200,
                        responseModels: {
                          "application/json": {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                id: { type: "string" },
                                name: { type: "string" },
                                email: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            ],
          } as unknown as Serverless.FunctionDefinitionHandler,
        ])
        const { operations, models } = parseServerlessConfig(serverless)
        expect(operations).toEqual([
          {
            name: "getUsers",
            returnType: [
              {
                statusCode: 200,
                type: {
                  name: null,
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                      },
                    },
                  },
                },
              },
            ],
            http: {
              method: "get",
              path: "/users",
            },
          },
        ])
      })
    })
  })
})

describe("renderDefinitions", () => {
  it("should generate TypeSpec definitions for given operations and models", async () => {
    const operations: Operation[] = [
      // {
      //   route: "/users",
      //   method: "get",
      //   name: "getUsers",
      //   responseModel: "UserList",
      // },
      {
        name: "createUser",
        body: "CreateUserRequest",
        returnType: [
          {
            statusCode: 201,
            type: "CreateUserResponse",
          },
        ],
        http: {
          method: "post",
          path: "/users",
        },
      },
    ]

    const models = new Registry<ModelIR>()
    // models.register("UserList", {
    //   name: "UserList",
    //   schema: {
    //     properties: {
    //       users: { type: "array", items: { type: "object" } },
    //     },
    //   },
    // })
    models.register("CreateUserRequest", {
      name: "CreateUserRequest",
      props: {
        name: { type: "string", required: true },
        email: { type: "string", required: true },
      },
    })
    models.register("CreateUserResponse", {
      name: "CreateUserResponse",
      props: {
        id: { type: "string", required: true },
      },
    })

    const result = renderDefinitions(operations, models)

    const expected = dedent`
      import "@typespec/http";

      using Http;

      @service(#{ title: "Generated API" })
      namespace GeneratedApi;

      @route("/users")
      @post
      op createUser(@body body: CreateUserRequest): {
        @statusCode statusCode: 201;
        @body body: CreateUserResponse;
      };

      model CreateUserRequest {
        name: string;
        email: string;
      }

      model CreateUserResponse {
        id: string;
      }
    `

    expect(await normalizeTypeSpec(result)).toBe(expected)
  })
})
