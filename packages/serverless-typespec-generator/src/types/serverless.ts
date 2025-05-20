import type { AWS } from "@serverless/typescript"
import type ServerlessOrigin from "serverless"
import type Service from "serverless/classes/Service"
import type { JSONSchema } from "~/types/json-schema"

type Functions = NonNullable<AWS["functions"]>
type FunctionDefinition = Functions[string]
type FunctionEvent = NonNullable<FunctionDefinition["events"]>[number]
type FunctionHttpEvent = Extract<FunctionEvent, { http: unknown }>["http"]
type FunctionHttpEventRef = Extract<FunctionHttpEvent, string>
type FunctionHttpEventDetail = Extract<FunctionHttpEvent, object>
type FunctionHttpEventRequest = NonNullable<FunctionHttpEventDetail["request"]>

type FunctionHttpEventRequestWithSchema = Omit<
  FunctionHttpEventRequest,
  "schemas"
> & {
  schemas?: Record<string, JSONSchema | string>
}

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

export type FunctionHttpEventDetailWithDocumentation = Omit<
  FunctionHttpEventDetail,
  "request"
> & {
  request?: FunctionHttpEventRequestWithSchema
} & {
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

type ServerlessServiceProvider = Service["provider"] & AWS["provider"]
type ServerlessApiGateway = NonNullable<ServerlessServiceProvider["apiGateway"]>
type ServerlessApiGatewayRequest = NonNullable<ServerlessApiGateway["request"]>

type ServerlessServiceProviderWithSchemas = Omit<
  ServerlessServiceProvider,
  "apiGateway"
> & {
  apiGateway?: Omit<ServerlessApiGateway, "request"> & {
    request?: Omit<ServerlessApiGatewayRequest, "schemas"> & {
      schemas?: Record<
        string,
        {
          schema: JSONSchema
          name?: string
          description?: string
        }
      >
    }
  }
}

export type ServiceWithDoc = Omit<
  Service,
  "provider" | "functions" | "getAllEventsInFunction"
> & {
  provider: ServerlessServiceProviderWithSchemas
  functions: FunctionsWithDocumentation
  getAllEventsInFunction(functionName: string): FunctionEventWithDocumentation[]
}

export type Serverless = Omit<ServerlessOrigin, "service"> & {
  service: ServiceWithDoc
}

export type TypeSpecGeneratorOptions = ServerlessOrigin.Options & {
  "output-dir": string
  "experimental-serverless-ir"?: boolean
}

export namespace Serverless {
  export type Options = TypeSpecGeneratorOptions
}
