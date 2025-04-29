import type serverless from "serverless"
import type Plugin from "serverless/classes/Plugin"
import type Aws from "serverless/plugins/aws/provider/awsProvider"
import type { JSONSchema4 as JSONSchema } from "json-schema"

import fs from "node:fs/promises"
import path from "node:path"

export default class ServerlessTypeSpecGenerator implements Plugin {
  hooks: Plugin.Hooks
  commands: Plugin.Commands
  serverless: serverless
  options: serverless.Options

  constructor(serverless: serverless, options: serverless.Options) {
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
        typespec: {
          type: "object",
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
    const models: Map<string, JSONSchema> = new Map() // モデル名 -> model定義

    const lines: string[] = []
    lines.push('import "@typespec/http";')
    lines.push("")
    lines.push("using Http;")
    lines.push("")

    lines.push('@service(#{ title: "Generated API" })')
    lines.push("namespace GeneratedApi;")
    lines.push("")

    const functions = this.serverless.service.functions
    for (const [functionName, functionConfig] of Object.entries(functions)) {
      const events = functionConfig.events || []
      for (const event of events) {
        if (!event.http) {
          continue
        }

        const http = event.http as Aws.Http & {
          typespec?: {
            response?: {
              schemas?: {
                "application/json": {
                  [key: string]: JSONSchema
                }
              }
            }
          }
        }
        const method = http.method.toLowerCase()
        const path = http.path.replace(/^\/|\/$/g, "")

        let requestModelName: string | undefined
        if (http.request?.schemas?.["application/json"]) {
          const model = http.request.schemas["application/json"]
          const modelName = model.title as string
          models.set(modelName, model)

          requestModelName = modelName
        }

        let responseModelName = "void"
        if (http.typespec?.response?.schemas?.["application/json"]) {
          const model =
            http.typespec.response.schemas["application/json"]["200"]
          const modelName = model.title as string
          models.set(modelName, model)

          responseModelName = modelName
        }

        lines.push(`@route("/${path}")`)
        lines.push(`@${method}`)
        if (requestModelName) {
          lines.push(
            `op ${functionName}(@body body: ${requestModelName}): ${responseModelName};`,
          )
        } else {
          lines.push(`op ${functionName}(): ${responseModelName};`)
        }
        lines.push("")
      }
    }

    for (const [modelName, model] of models) {
      lines.push(`model ${modelName} {`)
      for (const [name, detail] of Object.entries(model.properties ?? {})) {
        lines.push(`  ${name}: ${detail.type};`)
      }
      lines.push("}")
      lines.push("")
    }

    await fs.writeFile(path.join(outputDir, "main.tsp"), lines.join("\n"))
  }
}
