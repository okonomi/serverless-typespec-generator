import { describe, expect, it } from "vitest"
import { createServerlessMock } from "../../test/helper"
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
          kind: "function",
          name: "hello",
          event: {
            method: "get",
            path: "/hello",
            request: {
              body: {
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
              body: "user",
            },
          },
        },
      ])
    })
    it("with api gateway request model", () => {
      const serverless = createServerlessMock(
        {},
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
      ])
    })
  })
})
