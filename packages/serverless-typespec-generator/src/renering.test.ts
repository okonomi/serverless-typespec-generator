import { describe, expect, it } from "vitest"
import { rasterize, normalizeLines, convertToRenderLines } from "./rendering"
import dedent from "dedent"

describe("rasterize", () => {
  describe("when rendering lines", () => {
    it("renders a line with the correct indentation", () => {
      const lines = [
        { indent: 0, statement: "model TestModel {" },
        { indent: 1, statement: "id: string;" },
        { indent: 0, statement: "}" },
      ]
      const result = rasterize(lines)
      expect(result).toBe(dedent`
        model TestModel {
          id: string;
        }
      `)
    })
  })
  describe("when rendering nested lines", () => {
    it("renders nested lines with the correct indentation", () => {
      const lines = [
        { indent: 0, statement: "{" },
        {
          indent: 1,
          statement: [
            { indent: 0, statement: "foo" },
            { indent: 0, statement: "bar" },
          ],
        },
        { indent: 0, statement: "}" },
      ]
      const result = rasterize(lines)
      expect(result).toBe(dedent`
        {
          foo
          bar
        }
      `)
    })
  })
  describe("when continuing a line", () => {
    it("continues a line with the correct indentation", () => {
      const lines = [
        { indent: 0, statement: "foo:" },
        { indent: 0, statement: "{", continue: true },
        { indent: 1, statement: "bar:" },
        { indent: 1, statement: "{", continue: true },
        { indent: 2, statement: "baz" },
        { indent: 1, statement: "}" },
        { indent: 0, statement: "}" },
      ]
      const result = rasterize(lines)
      expect(result).toBe(dedent`
        foo: {
          bar: {
            baz
          }
        }
      `)
    })
  })
})

describe("normalizeLines", () => {
  it("normalizes lines with different indentations", () => {
    const lines = [
      { indent: 0, statement: "{" },
      {
        indent: 1,
        statement: [
          { indent: 0, statement: "foo" },
          { indent: 0, statement: "{" },
          {
            indent: 1,
            statement: [{ indent: 0, statement: "bar" }],
          },
          { indent: 0, statement: "}" },
        ],
      },
      { indent: 0, statement: "}" },
    ]
    const result = normalizeLines(lines)
    expect(result).toStrictEqual([
      { indent: 0, statement: "{" },
      { indent: 1, statement: "foo" },
      { indent: 1, statement: "{" },
      { indent: 2, statement: "bar" },
      { indent: 1, statement: "}" },
      { indent: 0, statement: "}" },
    ])
  })
})

describe("convertToRenderLines", () => {
  it("converts a single line to RenderLine", () => {
    const lines = ["foo"]
    const result = convertToRenderLines(lines)
    expect(result).toStrictEqual([{ indent: 0, statement: "foo" }])
  })

  it("converts nested lines to RenderLine", () => {
    const lines = ["{", ["foo"], "}"]
    const result = convertToRenderLines(lines)
    expect(result).toStrictEqual([
      { indent: 0, statement: "{" },
      { indent: 0, statement: [{ indent: 0, statement: "foo" }] },
      { indent: 0, statement: "}" },
    ])
  })
})
