export type RenderLine = {
  indent: number
  statement: string | RenderLine[]
  continuation?: boolean
}

export function rasterize(lines: RenderLine[]): string {
  return normalizeLines(lines)
    .reduce<string[]>((acc, line) => {
      const rendered = rasterizeLine(line)
      if (line.continuation && acc.length > 0) {
        acc[acc.length - 1] += ` ${rendered.trimStart()}`
      } else {
        acc.push(rendered)
      }
      return acc
    }, [])
    .join("\n")
}

function rasterizeLine(line: RenderLine): string {
  return `${"  ".repeat(line.indent)}${line.statement}`
}

export function normalizeLines(lines: RenderLine[]): RenderLine[] {
  const normalize = (lines: RenderLine[], indent: number): RenderLine[] => {
    return lines.flatMap((line) =>
      typeof line.statement === "string"
        ? [
            {
              indent: indent + line.indent,
              statement: line.statement,
              ...(line.continuation && { continuation: true }),
            },
          ]
        : normalize(line.statement, indent + line.indent),
    )
  }
  return normalize(lines, 0)
}

export function convertToRenderLines(
  lines: Array<string | string[]>,
  indent = 0,
): RenderLine[] {
  return lines.map((line) =>
    typeof line === "string"
      ? { indent, statement: line }
      : { indent, statement: convertToRenderLines(line, 0) },
  )
}
