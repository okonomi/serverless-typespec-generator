import { describe, it, expect, vi } from "vitest"
import { parseServerlessConfig, renderDefinitions } from "./typespec"

import type Serverless from "serverless"
import dedent from "dedent"
import { formatTypeSpec } from "@typespec/compiler"

import type { SLS } from "./types/serverless"
import type { OperationIR, TypeSpecIR } from "./typespec/ir/type"

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
  apiGateway?: SLS["service"]["provider"]["apiGateway"],
): SLS {
  return {
    service: {
      provider: {
        ...(apiGateway && { apiGateway }),
      },
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

        expect(operations).toEqual<OperationIR[]>([
          {
            name: "hello",
            method: "get",
            route: "/hello",
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

        expect(operations).toEqual<OperationIR[]>([
          {
            name: "hello",
            method: "post",
            route: "/hello",
            requestBody: { ref: "HelloRequest" },
          },
        ])
        expect(Array.from(models.values())).toEqual<TypeSpecIR[]>([
          {
            kind: "model",
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
        expect(operations).toEqual<OperationIR[]>([
          {
            name: "helloWorld",
            method: "get",
            route: "/hello-world",
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
        expect(operations).toEqual<OperationIR[]>([
          {
            name: "getUser",
            method: "get",
            route: "/users/{id}",
            parameters: {
              id: { type: "string", required: true },
            },
            returnType: [
              {
                statusCode: 200,
                body: { ref: "User" },
              },
            ],
            http: {
              params: ["id"],
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
        expect(operations).toEqual<OperationIR[]>([
          {
            name: "getUser",
            method: "get",
            route: "/users/{id}",
            parameters: {
              id: { type: "string", required: true },
            },
            returnType: [
              {
                statusCode: 200,
                body: {
                  id: { type: "string", required: false },
                  name: { type: "string", required: false },
                  email: { type: "string", required: false },
                },
              },
            ],
            http: {
              params: ["id"],
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
        expect(operations).toEqual<OperationIR[]>([
          {
            name: "getUsers",
            method: "get",
            route: "/users",
            returnType: [
              {
                statusCode: 200,
                body: [
                  {
                    id: { type: "string", required: false },
                    name: { type: "string", required: false },
                    email: { type: "string", required: false },
                  },
                ],
              },
            ],
          },
        ])
      })
    })
    context("with array", () => {
      it("should parse array api model correctly", () => {
        const serverless = createServerlessMock(
          [
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
                            "application/json": "users",
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            } as unknown as Serverless.FunctionDefinitionHandler,
          ],
          {
            request: {
              schemas: {
                users: {
                  name: "Users",
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        id: { type: "string" },
                        name: { type: "string" },
                        email: { type: "string" },
                      },
                      required: ["id", "name", "email"],
                    },
                  },
                },
              },
            },
          },
        )
        const { operations, models } = parseServerlessConfig(serverless)
        expect(Array.from(models.values())).toEqual<TypeSpecIR[]>([
          {
            kind: "alias",
            name: "Users",
            type: [
              {
                id: { type: "string", required: true },
                name: { type: "string", required: true },
                email: { type: "string", required: true },
              },
            ],
          },
        ])
        expect(operations).toEqual<OperationIR[]>([
          {
            name: "getUsers",
            method: "get",
            route: "/users",
            returnType: [
              {
                statusCode: 200,
                body: { ref: "Users" },
              },
            ],
          },
        ])
      })
    })
  })
})

describe("renderDefinitions", () => {
  it("should generate TypeSpec definitions for given operations and models", async () => {
    const irList: TypeSpecIR[] = [
      {
        kind: "operation",
        operation: {
          name: "createUser",
          method: "post",
          route: "/users",
          requestBody: { ref: "CreateUserRequest" },
          returnType: [
            {
              statusCode: 201,
              body: { ref: "CreateUserResponse" },
            },
          ],
        },
      },
      {
        kind: "model",
        name: "CreateUserRequest",
        props: {
          name: { type: "string", required: true },
          email: { type: "string", required: true },
        },
      },
      {
        kind: "model",
        name: "CreateUserResponse",
        props: {
          id: { type: "string", required: true },
        },
      },
    ]
    const result = renderDefinitions(irList)

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
