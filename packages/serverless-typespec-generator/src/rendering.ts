export type RenderLine = {
  indent: number
  statement: string
}

export function rasterize(lines: RenderLine[]): string {
  return lines.map((l) => rasterizeLine(l)).join("\n")
}

function rasterizeLine(line: RenderLine): string {
  return `${"  ".repeat(line.indent)}${line.statement}`
}
