import { describe, it, expect, vi } from "vitest"
import { parseServerlessConfig, renderDefinitions } from "./typespec"
import type { Model } from "./typespec/model"

import type Serverless from "serverless"
import dedent from "dedent"

import type { SLS } from "./types/serverless"
import { Registry } from "./registry"
import type { Operation } from "./typespec/operation"

const context = describe

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
            route: "/hello",
            method: "get",
            returnType: "void",
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
            body: "HelloRequest",
            returnType: "void",
          },
        ])
        expect(Array.from(models.values())).toEqual([
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
            route: "/hello-world",
            method: "get",
            returnType: "void",
          },
        ])
      })
    })
  })
})

describe("renderDefinitions", () => {
  it("should generate TypeSpec definitions for given operations and models", () => {
    const operations: Operation[] = [
      // {
      //   route: "/users",
      //   method: "get",
      //   name: "getUsers",
      //   responseModel: "UserList",
      // },
      {
        route: "/users",
        method: "post",
        name: "createUser",
        body: "CreateUserRequest",
        returnType: [
          {
            statusCode: 201,
            type: "CreateUserResponse",
          },
        ],
      },
    ]

    const models = new Registry<Model>()
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
      schema: {
        properties: {
          name: { type: "string" },
          email: { type: "string" },
        },
      },
    })
    models.register("CreateUserResponse", {
      name: "CreateUserResponse",
      schema: {
        properties: {
          id: { type: "string" },
        },
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

    expect(result).toBe(`${expected}\n`)
  })
})
