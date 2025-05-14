import { describe, expect, it } from "vitest"

import { formatTypeSpec } from "@typespec/compiler"
import dedent from "dedent"
import type { TypeSpecIR } from "./../typespec/ir/type"
import { emitTypeSpec } from "./emit"

async function normalizeTypeSpec(code: string) {
  const formattedCode = await formatTypeSpec(code, {
    indent: "  ",
    lineWidth: 80,
    trailingNewline: false,
  })
  return formattedCode.trimEnd()
}

describe("emitTypeSpec", () => {
  it("should generate TypeSpec definitions for given operations and models", async () => {
    const irList: TypeSpecIR[] = [
      {
        kind: "operation",
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
    const result = emitTypeSpec(irList)

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
