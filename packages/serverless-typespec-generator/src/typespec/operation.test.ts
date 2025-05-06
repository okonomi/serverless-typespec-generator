import { describe, it, expect } from "vitest"
import dedent from "dedent"
import { render, type Operation } from "./operation"

const context = describe

describe("render", () => {
  context("when rendering operation", () => {
    context("with request and response models", () => {
      it("renders an operation with request and response models", () => {
        const op: Operation = {
          name: "createUser",
          route: "/users",
          method: "post",
          requestModel: "CreateUserRequest",
          responseModels: [
            {
              statusCode: 201,
              body: "UserResponse",
            },
          ],
        }
        const result = render(op)
        expect(result).toBe(dedent`
          @route("/users")
          @post
          op createUser(@body body: CreateUserRequest): {
            @statusCode statusCode: 201;
            @body body: UserResponse;
          };
        `)
      })
    })

    context("with request model", () => {
      it("renders an operation with request model and without response model", () => {
        const op: Operation = {
          name: "updateUser",
          route: "/users/{id}",
          method: "put",
          requestModel: "UpdateUserRequest",
          responseModels: null,
        }
        expect(render(op)).toBe(dedent`
          @route("/users/{id}")
          @put
          op updateUser(@body body: UpdateUserRequest): void;
        `)
      })
    })

    context("with response model", () => {
      it("renders an operation without request model", () => {
        const op: Operation = {
          name: "getUser",
          route: "/users/{id}",
          method: "get",
          requestModel: null,
          responseModels: [
            {
              statusCode: 200,
              body: "UserResponse",
            },
          ],
        }
        const result = render(op)
        expect(result).toBe(dedent`
          @route("/users/{id}")
          @get
          op getUser(): {
            @statusCode statusCode: 200;
            @body body: UserResponse;
          };
        `)
      })
    })

    context("with request and response models", () => {
      it("renders operation without models", () => {
        const op: Operation = {
          name: "deleteUser",
          route: "/users/{id}",
          method: "delete",
          requestModel: null,
          responseModels: null,
        }
        expect(render(op)).toBe(dedent`
          @route("/users/{id}")
          @delete
          op deleteUser(): void;
        `)
      })
    })

    context("with multiple response models", () => {
      it("renders operation with multiple response models", () => {
        const op: Operation = {
          name: "getUser",
          route: "/users/{id}",
          method: "get",
          requestModel: null,
          responseModels: [
            {
              statusCode: 200,
              body: "UserResponse",
            },
            {
              statusCode: 404,
              body: "NotFoundResponse",
            },
          ],
        }
        expect(render(op)).toBe(dedent`
          @route("/users/{id}")
          @get
          op getUser(): {
            @statusCode statusCode: 200;
            @body body: UserResponse;
          } | {
            @statusCode statusCode: 404;
            @body body: NotFoundResponse;
          };
        `)
      })
    })
  })
})
