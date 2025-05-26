import { describe, expect, it } from "vitest"
import { createServerlessMock } from "~/test/helper"
import { buildServerlessIR } from "./build"
import type { ServerlessIR } from "./type"

const context = describe

describe("buildServerlessIR", () => {
  context("should handle functions", () => {
    it("with basic Serverless IR", () => {
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
        world: {
          name: "world",
          handler: "handler.world",
          events: [],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
          },
        },
      ])
    })
    it("without events", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([])
    })
    it("with http key only event", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: "",
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([])
    })
    it("with http event and invalid http method", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "invalid",
                path: "/hello",
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([])
    })
    it("with s3 events", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              s3: {
                bucket: "my-bucket",
                event: "s3:ObjectCreated:*",
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([])
    })
    it("with multiple events", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              sns: {
                arn: "arn:aws:sns:us-east-1:123456789012:my-topic",
              },
            },
            {
              http: {
                method: "get",
                path: "/hello",
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
          },
        },
      ])
    })
    it("with multiple http events", () => {
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
            {
              http: {
                method: "post",
                path: "/hello",
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
          },
        },
      ])
    })
    it("with path and no slash starts", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "hello",
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
          },
        },
      ])
    })
    it("with kebab-case name", () => {
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
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "helloWorld",
          event: {
            method: "get",
            path: "/hello-world",
          },
        },
      ])
    })
    it("with request", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello",
                request: {
                  schemas: {
                    "application/json": {
                      title: "User",
                      type: "object",
                      properties: {
                        name: {
                          type: "string",
                        },
                        email: {
                          type: "string",
                        },
                      },
                      required: ["name", "email"],
                    },
                  },
                },
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "model",
          key: "User",
          name: "User",
          schema: {
            title: "User",
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
            required: ["name", "email"],
          },
        },
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            request: {
              body: { schema: "User" },
            },
          },
        },
      ])
    })
    it("with request of reference", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello",
                request: {
                  schemas: {
                    "application/json": "user",
                  },
                },
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            request: {
              body: { schema: "user" },
            },
          },
        },
      ])
    })
    it("with api gateway request model", () => {
      const serverless = createServerlessMock(
        {
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
        },
        {
          request: {
            schemas: {
              user: {
                name: "User",
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                  required: ["name", "email"],
                },
              },
            },
          },
        },
      )
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "model",
          key: "user",
          name: "User",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
            required: ["name", "email"],
          },
        },
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
          },
        },
      ])
    })
    it("with path parameters", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello/:name",
                request: {
                  parameters: {
                    paths: {
                      name: true,
                    },
                  },
                },
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello/:name",
            request: {
              path: {
                name: { required: true },
              },
            },
          },
        },
      ])
    })
    it("with path parameters (documentation)", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello/:name",
                documentation: {
                  pathParams: [
                    {
                      name: "name",
                      description: "The name of the person to greet",
                      schema: { type: "string" },
                    },
                  ],
                },
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello/:name",
            request: {
              path: {
                name: {
                  required: true,
                  description: "The name of the person to greet",
                },
              },
            },
          },
        },
      ])
    })
    it("with anonymous response model", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello",
                documentation: {
                  methodResponses: [
                    {
                      statusCode: 200,
                      responseModels: {
                        "application/json": {
                          type: "object",
                          properties: {
                            name: { type: "string" },
                            email: { type: "string" },
                          },
                          required: ["name", "email"],
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
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            responses: [
              {
                statusCode: 200,
                body: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                  required: ["name", "email"],
                },
              },
            ],
          },
        },
      ])
    })
    it("with reference response model", () => {
      const serverless = createServerlessMock(
        {
          hello: {
            name: "hello",
            handler: "handler.hello",
            events: [
              {
                http: {
                  method: "get",
                  path: "/hello",
                  documentation: {
                    methodResponses: [
                      {
                        statusCode: 200,
                        responseModels: {
                          "application/json": "user",
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
              user: {
                name: "User",
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                  required: ["name", "email"],
                },
              },
            },
          },
        },
      )
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "model",
          key: "user",
          name: "User",
          schema: {
            type: "object",
            properties: {
              name: { type: "string" },
              email: { type: "string" },
            },
            required: ["name", "email"],
          },
        },
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            responses: [
              {
                statusCode: 200,
                body: "user",
              },
            ],
          },
        },
      ])
    })
    it("with named response model", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello",
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
                          required: ["id", "name", "email"],
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
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "model",
          key: "User",
          name: "User",
          schema: {
            title: "User",
            type: "object",
            properties: {
              id: { type: "string" },
              name: { type: "string" },
              email: { type: "string" },
            },
            required: ["id", "name", "email"],
          },
        },
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            responses: [
              {
                statusCode: 200,
                body: "User",
              },
            ],
          },
        },
      ])
    })
    it("with summary", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello",
                documentation: {
                  summary: "Say hello",
                },
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            summary: "Say hello",
          },
        },
      ])
    })
    it("with description", () => {
      const serverless = createServerlessMock({
        hello: {
          name: "hello",
          handler: "handler.hello",
          events: [
            {
              http: {
                method: "get",
                path: "/hello",
                documentation: {
                  description: "Say hello",
                },
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            description: "Say hello",
            method: "get",
            path: "/hello",
          },
        },
      ])
    })
    it("with request body description", () => {
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
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        email: { type: "string" },
                      },
                      required: ["name", "email"],
                    },
                  },
                },
                documentation: {
                  requestBody: {
                    description: "User data",
                  },
                },
              },
            },
          ],
        },
      })
      const result = buildServerlessIR(serverless)
      expect(result).toStrictEqual<ServerlessIR[]>([
        {
          kind: "function",
          name: "hello",
          event: {
            method: "post",
            path: "/hello",
            request: {
              body: {
                schema: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                  },
                  required: ["name", "email"],
                },
                description: "User data",
              },
            },
          },
        },
      ])
    })
  })
})
