import path from "node:path"
import type Plugin from "serverless/classes/Plugin"
import { buildServerlessIR } from "~/ir/serverless/build"
import { buildTypeSpecIR } from "~/ir/typespec/build"
import { emitTypeSpec } from "~/ir/typespec/emit"
import type { JSONSchema } from "~/types/json-schema"
import type { Serverless } from "~/types/serverless"

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
              "experimental-serverless-ir": {
                usage: "Use serverless IR",
                required: false,
                type: "boolean",
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
    await this.generateTypeSpec(outputDir)
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

  async generateTypeSpec(outputDir: string) {
    const slsIrList = buildServerlessIR(this.serverless)
    const tspIrList = buildTypeSpecIR(slsIrList)
    const typespec = emitTypeSpec(tspIrList)

    await this.serverless.utils.writeFile(
      path.join(outputDir, "main.tsp"),
      typespec,
    )
  }
}
