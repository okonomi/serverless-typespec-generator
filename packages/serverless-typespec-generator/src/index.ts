import type serverless from "serverless"
import type Plugin from "serverless/classes/Plugin"

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

    await this.serverless.utils.writeFile(
      path.join(outputDir, "main.tsp"),
      `import "@typespec/http";

using Http;
@service(#{ title: "Widget Service" })
namespace DemoService;

model Widget {
  id: string;
  weight: int32;
  color: "red" | "blue";
}

model WidgetList {
  items: Widget[];
}

@error
model Error {
  code: int32;
  message: string;
}

model AnalyzeResult {
  id: string;
  analysis: string;
}

@route("/widgets")
@tag("Widgets")
interface Widgets {
  /** List widgets */
  @get list(): WidgetList | Error;
  /** Read widgets */
  @get read(@path id: string): Widget | Error;
  /** Create a widget */
  @post create(@body body: Widget): Widget | Error;
  /** Update a widget */
  @patch update(@path id: string, @body body: Widget): Widget | Error;
  /** Delete a widget */
  @delete delete(@path id: string): void | Error;

  /** Analyze a widget */
  @route("{id}/analyze") @post analyze(@path id: string): AnalyzeResult | Error;
}
`,
    )
  }
}
