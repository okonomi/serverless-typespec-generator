import type serverless from "serverless"
import type Plugin from "serverless/classes/Plugin"

export default class ServerlessTypeSpecGenerator implements Plugin {
  hooks: Plugin.Hooks
  commands: Plugin.Commands
  serverless: serverless

  constructor(serverless: serverless) {
    console.log("Serverless TypeSpec Generator")

    this.serverless = serverless
    this.commands = {
      typespec: {
        commands: {
          generate: {
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

    this.hooks = {}
  }
}
