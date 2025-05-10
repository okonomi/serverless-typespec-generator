import { describe, expect, it } from "vitest"
import { rasterize } from "./rendering"
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
})
