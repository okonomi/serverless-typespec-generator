import { describe, expect, it } from "vitest"
import { createServerlessMock } from "../../test/helper"
import type { JSONSchema } from "../../types/json-schema"
import { buildIR, convertType, jsonSchemaToTypeSpecIR } from "./build"
import type { PropTypeIR, TypeSpecIR } from "./type"

const context = describe

describe("buildIR", () => {
  context("when parsing a serverless config", () => {
    context("with no models", () => {
      it("should handle valid serverless configurations", () => {
        const serverless = createServerlessMock({
          hello: {
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
        })
        const irList = buildIR(serverless)

        expect(irList).toStrictEqual<TypeSpecIR[]>([
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
        const serverless = createServerlessMock({
          hello: {
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
        })
        const irList = buildIR(serverless)

        expect(irList).toStrictEqual<TypeSpecIR[]>([
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
        const serverless = createServerlessMock({
          "hello-world": {
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
        })
        const irList = buildIR(serverless)
        expect(irList).toStrictEqual<TypeSpecIR[]>([
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
        const serverless = createServerlessMock({
          getUser: {
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
          },
        })
        const irList = buildIR(serverless)
        expect(irList.filter((ir) => ir.kind === "operation")).toStrictEqual<
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
        const serverless = createServerlessMock({
          getUser: {
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
          },
        })
        const irList = buildIR(serverless)
        expect(irList).toStrictEqual<TypeSpecIR[]>([
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
        const serverless = createServerlessMock({
          getUsers: {
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
          },
        })
        const irList = buildIR(serverless)
        expect(irList).toStrictEqual<TypeSpecIR[]>([
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
          {
            getUsers: {
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
            },
          },
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
        expect(irList).toStrictEqual<TypeSpecIR[]>([
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
        const serverless = createServerlessMock(
          {},
          {
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
          },
        )
        const irList = buildIR(serverless)
        expect(irList).toStrictEqual<TypeSpecIR[]>([
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
  context("should convert JSON Schema", () => {
    it("with simplified schema to IR", () => {
      const schema: JSONSchema = {
        type: "object",
        properties: {
          id: { type: "string" },
          age: { type: "integer" },
        },
        required: ["id"],
      }
      const result = jsonSchemaToTypeSpecIR(schema, "Model")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: false },
        },
      })
    })
    it("of array to IR", () => {
      const schema: JSONSchema = {
        type: "array",
        items: { type: "string" },
      }
      const result = jsonSchemaToTypeSpecIR(schema, "Tags")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "alias",
        name: "Tags",
        type: ["string"],
      })
    })
    it("with allOf to IR", () => {
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
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: true },
        },
      })
    })
    it("with allOf and required to IR", () => {
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
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "Model",
        props: {
          id: { type: "string", required: true },
          age: { type: "numeric", required: true },
        },
      })
    })
    it("with array properties to IR", () => {
      const schema: JSONSchema = {
        type: "object",
        properties: {
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["tags"],
      }
      const result = jsonSchemaToTypeSpecIR(schema, "ArrayModel")
      expect(result).toStrictEqual<TypeSpecIR>({
        kind: "model",
        name: "ArrayModel",
        props: {
          tags: { type: ["string"], required: true },
        },
      })
    })
    it("with nested object properties to IR", () => {
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
      expect(result).toStrictEqual<TypeSpecIR>({
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
})

describe("convertType", () => {
  it("should convert string type to string", () => {
    const schema: JSONSchema = { type: "string" }
    const result = convertType(schema)
    expect(result).toBe("string")
  })
  it("should convert integer type to numeric", () => {
    const schema: JSONSchema = { type: "integer" }
    const result = convertType(schema)
    expect(result).toBe("numeric")
  })
  it("should convert number type to numeric", () => {
    const schema: JSONSchema = { type: "number" }
    const result = convertType(schema)
    expect(result).toBe("numeric")
  })
  it("should convert boolean type to boolean", () => {
    const schema: JSONSchema = { type: "boolean" }
    const result = convertType(schema)
    expect(result).toBe("boolean")
  })
  it("should convert array type to array of string", () => {
    const schema: JSONSchema = { type: "array", items: { type: "string" } }
    const result = convertType(schema)
    expect(result).toStrictEqual(["string"])
  })
  it("should convert oneOf type to union of types", () => {
    const schema: JSONSchema = {
      oneOf: [{ type: "string" }, { type: "null" }],
    }
    const result = convertType(schema)
    expect(result).toStrictEqual<PropTypeIR>({ union: ["string", "null"] })
  })
})
