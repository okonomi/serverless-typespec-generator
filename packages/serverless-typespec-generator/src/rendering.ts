export type RenderLine = {
  indent: number
  statement: string | RenderLine[]
  continues?: boolean
}

export function rasterize(lines: RenderLine[]): string {
  const normalized = normalizeLines(lines)
  const result: string[] = []
  for (let i = 0; i < normalized.length; i++) {
    const line = normalized[i]
    const rendered = rasterizeLine(line)
    if (line.continues && i + 1 < normalized.length) {
      // 次の行を連結する
      const nextRendered = rasterizeLine(normalized[i + 1])
      result.push(`${rendered} ${nextRendered.trimStart()}`)
      i++ // 1行スキップ
    } else {
      result.push(rendered)
    }
  }
  return result.join("\n")
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
              ...(line.continues && { continues: true }),
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
