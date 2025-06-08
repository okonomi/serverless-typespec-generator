import type { AWS } from "@serverless/typescript"
import type ServerlessOrigin from "serverless"
import type Service from "serverless/classes/Service"
import type { JSONSchema } from "~/types/json-schema"
import type { Replace, ReplaceByPath } from "~/types/util"

type Functions = NonNullable<AWS["functions"]>
type FunctionDefinition = Functions[string]
type FunctionEvent = NonNullable<FunctionDefinition["events"]>[number]
type FunctionHttpEvent = Extract<FunctionEvent, { http: unknown }>["http"]
type FunctionHttpEventRef = Extract<FunctionHttpEvent, string>
type FunctionHttpEventDetail = Extract<FunctionHttpEvent, object>
type FunctionHttpEventRequest = NonNullable<FunctionHttpEventDetail["request"]>

type FunctionHttpEventRequestWithSchema = Replace<
  FunctionHttpEventRequest,
  "schemas",
  Record<string, JSONSchema | string>
>

export type HttpEventDocumentation = {
  summary?: string
  description?: string
  pathParams?: {
    name: string
    description?: string
    schema: { type: "string" }
  }[]
  requestBody?: {
    description?: string
    required?: boolean
  }
  methodResponses?: {
    statusCode: number
    responseModels?: {
      "application/json": JSONSchema | string
    }
  }[]
}

export type FunctionHttpEventDetailWithDocumentation = Replace<
  FunctionHttpEventDetail,
  "request",
  FunctionHttpEventRequestWithSchema
> & {
  documentation?: HttpEventDocumentation
}

export type FunctionEventWithDocumentation =
  | Replace<
      Extract<FunctionEvent, { http: unknown }>,
      "http",
      FunctionHttpEventRef | FunctionHttpEventDetailWithDocumentation
    >
  | Exclude<FunctionEvent, { http: unknown }>

export type FunctionDefinitionWithDocumentation = Replace<
  FunctionDefinition,
  "events",
  FunctionEventWithDocumentation[]
>

export type FunctionsWithDocumentation = {
  [K in keyof Functions]: FunctionDefinitionWithDocumentation
}

type ServerlessServiceProvider = Service["provider"] & AWS["provider"]
type ServerlessServiceProviderWithSchemas = ReplaceByPath<
  ServerlessServiceProvider,
  ["apiGateway", "request", "schemas"],
  Record<
    string,
    {
      schema: JSONSchema
      name?: string
      description?: string
    }
  >
>

type ServiceCustom = {
  typespecGenerator?: {
    title?: string
    description?: string
    version?: string
    openapiVersion?: "3.0.0" | "3.1.0"
  }
}

export type ServiceWithDoc = Omit<
  Service,
  "custom" | "provider" | "functions" | "getAllEventsInFunction"
> & {
  custom?: ServiceCustom
  provider: ServerlessServiceProviderWithSchemas
  functions: FunctionsWithDocumentation
  getAllEventsInFunction(functionName: string): FunctionEventWithDocumentation[]
}

export type Serverless = Replace<ServerlessOrigin, "service", ServiceWithDoc>

export type TypeSpecGeneratorOptions = ServerlessOrigin.Options & {
  "output-dir": string
}

export namespace Serverless {
  export type Options = TypeSpecGeneratorOptions
}
