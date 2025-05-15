export type ServerlessIR = ServerlessFunctionIR

export type ServerlessFunctionIR = {
  kind: "function"
  name: string
  event: ServerlessHttpEventIR
}

export type ServerlessHttpEventIR = {
  method: "get" | "post" | "put" | "delete" | "patch"
  path: string
}
