import {
  type PropTypeIR,
  isArrayType,
  isPrimitiveType,
  isRefType,
  isUnionType,
} from "./type"

export function renderType(type: PropTypeIR): string {
  if (isPrimitiveType(type)) {
    return type
  }

  if (isArrayType(type)) {
    return `${renderType(type[0])}[]`
  }

  if (isRefType(type)) {
    return type.ref
  }

  if (isUnionType(type)) {
    return type.union.map(renderType).join(" | ")
  }

  const props = Object.entries(type)
    .map(([name, prop]) => `${name}: ${renderType(prop.type)}`)
    .join(", ")
  return `{ ${props} }`
}
