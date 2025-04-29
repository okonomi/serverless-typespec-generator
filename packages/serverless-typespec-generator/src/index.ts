import type serverless from "serverless"
import type Plugin from "serverless/classes/Plugin"

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
        if (event.http) {
          const http = event.http
          const method = http.method.toLowerCase()
          const path = http.path.replace(/^\/|\/$/g, "")

          lines.push(`@route("/${path}")`)
          lines.push(`@${method}`)
          lines.push(`op ${functionName}(): void;`)
          lines.push("")
        }
      }
    }

    await fs.writeFile(path.join(outputDir, "main.tsp"), lines.join("\n"))
  }
}
