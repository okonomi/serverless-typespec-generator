import path from "node:path"
import type Plugin from "serverless/classes/Plugin"
import { buildServerlessIR } from "~/ir/serverless/build"
import { buildTypeSpecIR } from "~/ir/typespec/build"
import { emitTypeSpec, emitTypeSpecHeader } from "~/ir/typespec/emit"
import type { JSONSchema } from "~/types/json-schema"
import type { Serverless } from "~/types/serverless"
import type { TypeSpecNamespaceIR } from "./ir/typespec/type"

export class ServerlessTypeSpecGenerator implements Plugin {
  hooks: Plugin.Hooks
  commands: Plugin.Commands
  serverless: Serverless
  options: Serverless.Options

  constructor(serverless: Serverless, options: Serverless.Options) {
    this.serverless = serverless
    this.options = options

    this.commands = {
      typespec: {
        commands: {
          generate: {
            lifecycleEvents: ["run"],
            options: {
              "output-dir": {
                usage: "Output directory for generated TypeSpec files",
                required: true,
                type: "string",
              },
            },
          },
        },
      },
    }

    const responseSchema: JSONSchema = {
      type: "object",
      properties: {
        documentation: {
          type: "object",
          properties: {
            methodResponses: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  statusCode: { type: "number" },
                  responseModels: {
                    type: "object",
                  },
                },
                required: ["statusCode"],
              },
            },
          },
        },
      },
    }
    this.serverless.configSchemaHandler.defineFunctionEventProperties(
      "aws",
      "http",
      responseSchema,
    )

    this.hooks = {
      "typespec:generate:run": async () => {
        await this.generate()
      },
    }

    this.serverless.configSchemaHandler.defineCustomProperties({
      type: "object",
      properties: {
        typespecGenerator: {
          type: "object",
          properties: {
            title: {
              type: "string",
              description: "Title for the generated TypeSpec API",
              default: "Generated API",
            },
            namespace: {
              type: "string",
              description: "Namespace for the generated TypeSpec API",
              default: "GeneratedApi",
            },
            description: {
              type: "string",
              description: "Description for the generated TypeSpec API",
            },
            version: {
              type: "string",
              description: "Version for the generated TypeSpec API",
              default: "1.0.0",
            },
            openapiVersion: {
              type: "string",
              description: "OpenAPI version to use for TypeSpec generation",
              enum: ["3.0.0", "3.1.0"],
              default: "3.1.0",
            },
          },
        },
      },
    })
  }

  async generate() {
    console.log("Generating TypeSpec files...")

    const outputDir = path.resolve(
      this.serverless.serviceDir,
      String(this.options["output-dir"]),
    )

    await this.generateTspConfig(outputDir)
    await this.generateTypeSpec(outputDir)
  }

  async generateTspConfig(outputDir: string) {
    const openapiVersion =
      this.serverless.service.custom?.typespecGenerator?.openapiVersion ||
      "3.1.0"

    await this.serverless.utils.writeFile(
      path.join(outputDir, "tspconfig.yaml"),
      `emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{output-dir}/schema"
    openapi-versions:
      - ${openapiVersion}
`,
    )
  }

  async generateTypeSpec(outputDir: string) {
    const slsIrList = buildServerlessIR(this.serverless)
    const tspIrList = buildTypeSpecIR(slsIrList)

    const namespace = buildTypeSpecService(this.serverless.service.custom)
    const typespec = emitTypeSpec([namespace, ...tspIrList])

    const header = emitTypeSpecHeader()

    await this.serverless.utils.writeFile(
      path.join(outputDir, "main.tsp"),
      [header, typespec].join("\n"),
    )
  }
}

function buildTypeSpecService(
  custom: Serverless["service"]["custom"],
): TypeSpecNamespaceIR {
  const name = custom?.typespecGenerator?.namespace || "GeneratedApi"
  const serviceTitle = custom?.typespecGenerator?.title || "Generated API"
  const description = custom?.typespecGenerator?.description
  const version = custom?.typespecGenerator?.version || "1.0.0"
  const namespace: TypeSpecNamespaceIR = {
    kind: "namespace",
    name,
    serviceTitle,
    version,
  }
  if (description) {
    namespace.description = description
  }

  return namespace
}
