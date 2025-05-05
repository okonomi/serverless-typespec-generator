import { describe, it, expect, vi } from "vitest"
import { parseServerlessConfig, renderDefinitions } from "./typespec"
import type { Model } from "./typespec/model"

import type Serverless from "serverless"

const context = describe

function createServerlessMock(
  functions: Serverless.FunctionDefinitionHandler[],
): Serverless {
  return {
    service: {
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
  } as unknown as Serverless
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
            route: "/hello",
            method: "get",
            requestModel: null,
            responseModel: null,
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
            route: "/hello",
            method: "post",
            requestModel: "HelloRequest",
            responseModel: null,
          },
        ])
        expect(models).toEqual(
          new Map([
            [
              "HelloRequest",
              {
                name: "HelloRequest",
                schema: {
                  title: "HelloRequest",
                  type: "object",
                  properties: {
                    name: { type: "string" },
                  },
                },
              },
            ],
          ]),
        )
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
            route: "/hello-world",
            method: "get",
            requestModel: null,
            responseModel: null,
          },
        ])
      })
    })
  })
})

describe("renderDefinitions", () => {
  it("should generate TypeSpec definitions for given operations and models", () => {
    const operations = [
      // {
      //   route: "/users",
      //   method: "get",
      //   name: "getUsers",
      //   requestModel: null,
      //   responseModel: "UserList",
      // },
      {
        route: "/users",
        method: "post",
        name: "createUser",
        requestModel: "CreateUserRequest",
        responseModel: "CreateUserResponse",
      },
    ]

    const models = new Map<string, Model>([
      // [
      //   "UserList",
      //   {
      //     name: "UserList",
      //     schema: {
      //       properties: {
      //         users: { type: "array", items: { type: "object" } },
      //       },
      //     },
      //   },
      // ],
      [
        "CreateUserRequest",
        {
          name: "CreateUserRequest",
          schema: {
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
          },
        },
      ],
      [
        "CreateUserResponse",
        {
          name: "CreateUserResponse",
          schema: {
            properties: {
              id: { type: "string" },
            },
          },
        },
      ],
    ])

    const result = renderDefinitions(operations, models)

    const expected = `import "@typespec/http";

using Http;

@service(#{ title: "Generated API" })
namespace GeneratedApi;

@route("/users")
@post
op createUser(@body body: CreateUserRequest): CreateUserResponse;

model CreateUserRequest {
  name: string;
  email: string;
}

model CreateUserResponse {
  id: string;
}
`

    expect(result).toBe(expected)
  })
})
