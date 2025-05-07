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
          body: "CreateUserRequest",
          returnType: [
            {
              statusCode: 201,
              type: "UserResponse",
            },
          ],
          http: {
            method: "post",
            path: "/users",
          },
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
          body: "UpdateUserRequest",
          returnType: "void",
          http: {
            method: "put",
            path: "/users/{id}",
          },
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
          returnType: [
            {
              statusCode: 200,
              type: "UserResponse",
            },
          ],
          http: {
            method: "get",
            path: "/users/{id}",
          },
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
          returnType: "void",
          http: {
            method: "delete",
            path: "/users/{id}",
          },
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
          returnType: [
            {
              statusCode: 200,
              type: "UserResponse",
            },
            {
              statusCode: 404,
              type: "NotFoundResponse",
            },
          ],
          http: {
            method: "get",
            path: "/users/{id}",
          },
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
