import type serverless from "serverless"
import type Plugin from "serverless/classes/Plugin"

export default class ServerlessTypeSpecGenerator implements Plugin {
  hooks: Plugin.Hooks
  commands: Plugin.Commands
  serverless: serverless

  constructor(serverless: serverless) {
    this.serverless = serverless
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
      "typespec:generate:run": () => {
        console.log("Generating TypeSpec files...")
      },
    }
  }
}
