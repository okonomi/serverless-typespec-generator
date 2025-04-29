import { describe, it, expect } from "vitest"
import { type Model, renderDefinitions } from "./typespec"

const context = describe

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
