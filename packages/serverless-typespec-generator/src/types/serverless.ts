import type { AWS } from "@serverless/typescript"
import type ServerlessOrigin from "serverless"
import type Service from "serverless/classes/Service"
import type { JSONSchema } from "../ir/type"

type Functions = NonNullable<AWS["functions"]>
type FunctionDefinition = Functions[string]
type FunctionEvent = NonNullable<FunctionDefinition["events"]>[number]
type FunctionHttpEvent = Extract<FunctionEvent, { http: unknown }>["http"]
type FunctionHttpEventRef = Extract<FunctionHttpEvent, string>
type FunctionHttpEventDetail = Extract<FunctionHttpEvent, object>

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

export type FunctionHttpEventDetailWithDocumentation =
  FunctionHttpEventDetail & {
    documentation?: HttpEventDocumentation
  }

export type FunctionEventWithDocumentation =
  | (Omit<Extract<FunctionEvent, { http: unknown }>, "http"> & {
      http: FunctionHttpEventRef | FunctionHttpEventDetailWithDocumentation
    })
  | Exclude<FunctionEvent, { http: unknown }>

export type FunctionDefinitionWithDocumentation = Omit<
  FunctionDefinition,
  "events"
> & {
  events: FunctionEventWithDocumentation[]
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
