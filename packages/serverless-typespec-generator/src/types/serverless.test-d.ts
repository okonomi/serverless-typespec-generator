import { describe, expectTypeOf, it } from "vitest"
import type { JSONSchema } from "~/types/json-schema"
import type { Serverless } from "./serverless"

describe("Serverless", () => {
  it("should service.provider.apiGateway be optional", () => {
    expectTypeOf<
      Serverless["service"]["provider"]["apiGateway"]
    >().toBeNullable()
  })
  it("should service.provider.apiGateway.request be optional", () => {
    expectTypeOf<
      NonNullable<Serverless["service"]["provider"]["apiGateway"]>["request"]
    >().toBeNullable()
  })
  it("should service.provider.apiGateway.request.schemas be optional", () => {
    expectTypeOf<
      NonNullable<
        NonNullable<Serverless["service"]["provider"]["apiGateway"]>["request"]
      >["schemas"]
    >().toBeNullable()
  })
  it("should service.provider.apiGateway.request.schemas have JSONSchema", () => {
    type Schemas = NonNullable<
      NonNullable<
        NonNullable<Serverless["service"]["provider"]["apiGateway"]>["request"]
      >["schemas"]
    >
    type Schema = Schemas[keyof Schemas]
    expectTypeOf<Schema["schema"]>().toEqualTypeOf<JSONSchema>()
  })
  it("should service.custom be optional", () => {
    expectTypeOf<Serverless["service"]["custom"]>().toBeNullable()
  })
})
