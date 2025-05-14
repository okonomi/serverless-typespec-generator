import path from "node:path"
import type Serverless from "serverless"
import type Plugin from "serverless/classes/Plugin"
import type { SLS } from "./types/serverless"
import { parseServerlessConfig, renderDefinitions } from "./typespec"
import type { JSONSchema } from "./typespec/ir/type"

export default class ServerlessTypeSpecGenerator implements Plugin {
  hooks: Plugin.Hooks
  commands: Plugin.Commands
  serverless: SLS
  options: Serverless.Options

  constructor(serverless: SLS, options: Serverless.Options) {
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
  }

  async generate() {
    console.log("Generating TypeSpec files...")

    const outputDir = path.resolve(
      this.serverless.serviceDir,
      String(this.options["output-dir"]),
    )

    await this.generateTspConfig(outputDir)
    await this.generateTypespec(outputDir)
  }

  async generateTspConfig(outputDir: string) {
    await this.serverless.utils.writeFile(
      path.join(outputDir, "tspconfig.yaml"),
      `emit:
  - "@typespec/openapi3"
options:
  "@typespec/openapi3":
    emitter-output-dir: "{output-dir}/schema"
    openapi-versions:
      - 3.1.0
`,
    )
  }

  async generateTypespec(outputDir: string) {
    const { operations, models } = parseServerlessConfig(this.serverless)
    const typespec = renderDefinitions([
      ...operations,
      ...Array.from(models.values()),
    ])

    await this.serverless.utils.writeFile(
      path.join(outputDir, "main.tsp"),
      typespec,
    )
  }
}
