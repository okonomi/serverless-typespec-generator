import type { AWS } from "@serverless/typescript"
import type ServerlessOrigin from "serverless"
import type Service from "serverless/classes/Service"
import type { JSONSchema } from "../ir/type"

type Functions = NonNullable<AWS["functions"]>
type FunctionDefinition = Functions[string]
type FunctionEvent = NonNullable<FunctionDefinition["events"]>[number]
type FunctionHttpEvent = Extract<FunctionEvent, { http: unknown }>["http"]

export type HttpEventDocumentation = {
  pathParams?: {
    name: string
    schema: { type: "string" }
  }[]
  methodResponses?: {
    statusCode: number
    responseModels?: {
      "application/json": JSONSchema | string
    }
  }[]
}

export type FunctionHttpEventWithDocumentation = FunctionHttpEvent & {
  documentation?: HttpEventDocumentation
}

export type EventWithDocumentation =
  | (Omit<Extract<FunctionEvent, { http: unknown }>, "http"> & {
      http: FunctionHttpEventWithDocumentation
    })
  | Exclude<FunctionEvent, { http: unknown }>

export type FunctionDefinitionWithDocumentation = Omit<
  FunctionDefinition,
  "events"
> & {
  events: EventWithDocumentation[]
}

export type FunctionsWithDocumentation = {
  [K in keyof Functions]: FunctionDefinitionWithDocumentation
}

export type ServiceWithDoc = Service & {
  provider: Service["provider"] & AWS["provider"]
  functions: FunctionsWithDocumentation
}

export type Serverless = ServerlessOrigin & {
  service: ServiceWithDoc
}

export namespace Serverless {
  export type Options = ServerlessOrigin.Options
}
