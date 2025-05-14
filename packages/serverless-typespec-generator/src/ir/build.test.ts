import { describe, expect, it, vi } from "vitest"

import { formatTypeSpec } from "@typespec/compiler"
import type Serverless from "serverless"
import type { SLS } from "./../types/serverless"
import type { JSONSchema, TypeSpecIR } from "./../typespec/ir/type"
import { buildIR, jsonSchemaToTypeSpecIR } from "./build"

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

describe("buildIR", () => {
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
        const irList = buildIR(serverless)

        expect(irList).toEqual<TypeSpecIR[]>([
          {
            kind: "operation",
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
        const irList = buildIR(serverless)

        expect(irList).toEqual<TypeSpecIR[]>([
          {
            kind: "operation",
            name: "hello",
            method: "post",
            route: "/hello",
            requestBody: { ref: "HelloRequest" },
          },
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
        const irList = buildIR(serverless)
        expect(irList).toEqual<TypeSpecIR[]>([
          {
            kind: "operation",
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
        const irList = buildIR(serverless)
        expect(irList.filter((ir) => ir.kind === "operation")).toEqual<
          TypeSpecIR[]
        >([
          {
            kind: "operation",
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
        const irList = buildIR(serverless)
        expect(irList).toEqual<TypeSpecIR[]>([
          {
            kind: "operation",
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
        const irList = buildIR(serverless)
        expect(irList).toEqual<TypeSpecIR[]>([
          {
            kind: "operation",
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
    context("with array schema", () => {
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
        const irList = buildIR(serverless)
        expect(irList).toEqual<TypeSpecIR[]>([
          {
            kind: "operation",
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
      })
    })
    context("with array schema with allOf", () => {
      it("should parse array api model correctly", () => {
        const serverless = createServerlessMock([], {
          request: {
            schemas: {
              tags: {
                name: "Tags",
                schema: {
                  type: "array",
                  items: {
                    type: "object",
                    allOf: [
                      {
                        type: "object",
                        properties: {
                          slug: { type: "string" },
                        },
                      },
                      {
                        type: "object",
                        properties: {
                          name: { type: "string" },
                        },
                      },
                      {
                        type: "object",
                        required: ["slug", "name"],
                      },
                    ],
                  },
                },
              },
            },
          },
        })
        const irList = buildIR(serverless)
        expect(irList).toEqual<TypeSpecIR[]>([
          {
            kind: "alias",
            name: "Tags",
            type: [
              {
                slug: { type: "string", required: true },
                name: { type: "string", required: true },
              },
            ],
          },
        ])
      })
    })
  })
})

describe("jsonSchemaToTypeSpecIR", () => {
  it("should convert a simple JSON schema to IR", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        age: { type: "integer" },
      },
      required: ["id"],
    }
    const result = jsonSchemaToTypeSpecIR(schema, "Model")
    expect(result).toEqual<TypeSpecIR>({
      kind: "model",
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: false },
      },
    })
  })
  it("should convert a JSON schema of array to IR", () => {
    const schema: JSONSchema = {
      type: "array",
      items: { type: "string" },
    }
    const result = jsonSchemaToTypeSpecIR(schema, "Tags")
    expect(result).toEqual<TypeSpecIR>({
      kind: "alias",
      name: "Tags",
      type: ["string"],
    })
  })
  it("should convert a JSON schema with allOf to IR", () => {
    const schema: JSONSchema = {
      allOf: [
        {
          type: "object",
          properties: {
            id: { type: "string" },
          },
          required: ["id"],
        },
        {
          type: "object",
          properties: {
            age: { type: "integer" },
          },
          required: ["age"],
        },
      ],
    }
    const result = jsonSchemaToTypeSpecIR(schema, "Model")
    expect(result).toEqual<TypeSpecIR>({
      kind: "model",
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: true },
      },
    })
  })
  it("should convert a JSON schema with allOf and required to IR", () => {
    const schema: JSONSchema = {
      type: "object",
      allOf: [
        {
          type: "object",
          properties: {
            id: { type: "string" },
          },
        },
        {
          type: "object",
          properties: {
            age: { type: "integer" },
          },
        },
        {
          type: "object",
          required: ["id", "age"],
        },
      ],
    }
    const result = jsonSchemaToTypeSpecIR(schema, "Model")
    expect(result).toEqual<TypeSpecIR>({
      kind: "model",
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: true },
      },
    })
  })
  it("should convert a simple JSON schema to IR", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        id: { type: "string" },
        age: { type: "integer" },
      },
      required: ["id"],
    }
    const result = jsonSchemaToTypeSpecIR(schema, "Model")
    expect(result).toEqual<TypeSpecIR>({
      kind: "model",
      name: "Model",
      props: {
        id: { type: "string", required: true },
        age: { type: "numeric", required: false },
      },
    })
  })
  it("should convert a JSON schema with array properties to IR", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        tags: { type: "array", items: { type: "string" } },
      },
      required: ["tags"],
    }
    const result = jsonSchemaToTypeSpecIR(schema, "ArrayModel")
    expect(result).toEqual<TypeSpecIR>({
      kind: "model",
      name: "ArrayModel",
      props: {
        tags: { type: ["string"], required: true },
      },
    })
  })
  it("should convert a JSON schema with nested object properties to IR", () => {
    const schema: JSONSchema = {
      type: "object",
      properties: {
        meta: {
          type: "object",
          properties: {
            name: { type: "string" },
          },
          required: ["name"],
        },
      },
      required: ["meta"],
    }
    const result = jsonSchemaToTypeSpecIR(schema, "ObjectModel")
    expect(result).toEqual<TypeSpecIR>({
      kind: "model",
      name: "ObjectModel",
      props: {
        meta: {
          type: {
            name: { type: "string", required: true },
          },
          required: true,
        },
      },
    })
  })
})
