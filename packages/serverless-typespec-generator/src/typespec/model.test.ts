import { describe, it, expect } from "vitest"
import dedent from "dedent"
import { render, type Model } from "./model"

const context = describe

describe("render", () => {
  context("when rendering model", () => {
    context("with name", () => {
      it("renders a model with a name", () => {
        const model: Model = {
          name: "TestModel",
          schema: {
            type: "object",
            properties: {},
          },
        }
        const result = render(model)
        expect(result).toBe(dedent`
          model TestModel {
          }
        `)
      })
    })
    context("with properties", () => {
      it("renders a model with properties", () => {
        const model: Model = {
          name: "User",
          schema: {
            type: "object",
            properties: {
              id: { type: "string" },
              age: { type: "number" },
            },
          },
        }
        const result = render(model)
        expect(result).toBe(dedent`
          model User {
            id: string;
            age: number;
          }
        `)
      })
    })
    context("with various property types", () => {
      it("renders a model with various property types", () => {
        const model: Model = {
          name: "Mixed",
          schema: {
            type: "object",
            properties: {
              active: { type: "boolean" },
              tags: { type: "array" },
              meta: { type: "object" },
            },
          },
        }
        const result = render(model)
        expect(result).toBe(dedent`
          model Mixed {
            active: boolean;
            tags: array;
            meta: object;
          }
        `)
      })
    })
    context("without name", () => {
      it("inline anonymous model", () => {
        const model: Model = {
          name: null,
          schema: {
            type: "object",
            properties: {
              id: { type: "string" },
              age: { type: "number" },
            },
          },
        }
        const result = render(model)
        expect(result).toBe(dedent`
          {
            id: string;
            age: number;
          }
        `)
      })
    })
    context("with nested properties", () => {
      it("renders a model with nested properties", () => {
        const model: Model = {
          name: "Nested",
          schema: {
            type: "object",
            properties: {
              user: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  profile: {
                    type: "object",
                    properties: {
                      age: { type: "number" },
                      active: { type: "boolean" },
                    },
                  },
                },
              },
            },
          },
        }
        const result = render(model)
        expect(result).toBe(dedent`
          model Nested {
            user: {
              id: string;
              profile: {
                age: number;
                active: boolean;
              };
            };
          }
        `)
      })
    })
    context("with array properties", () => {
      it("renders a model with array properties", () => {
        const model: Model = {
          name: "ArrayModel",
          schema: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "string",
                },
              },
              items2: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                  },
                },
              },
            },
          },
        }
        const result = render(model)
        expect(result).toBe(dedent`
          model ArrayModel {
            items: string[];
            items2: {
              id: string;
            }[];
          }
        `)
      })
    })
  })
})
