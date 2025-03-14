// import { replaceXMLFieldValue, xmlToLua } from "@/blockly/utils/xml"
import { Edge } from "@/edges"
import { Node } from "@/nodes/index"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function shortAddress(address: string) {
  return `${address.slice(0, 5)}...${address.slice(-5)}`
}

export function getNodesOrdered(nodes: any, edges: any): Node[] {
  // make a list of connected nodes in order between start and add
  let edge: Edge = edges[0]
  let node: Node = nodes[0]
  const list = []
  while (edge.target != "add") {
    const nextNode = nodes.find((node: Node) => node.id == edge.target)
    const nextEdge = edges.find((edge: Edge) => edge.source == nextNode.id)
    if (!nextEdge) break
    node = nextNode
    edge = nextEdge
    list.push(node)
  }
  return list
}

export function sanitizeVariableName(name: string) {
  let sanitized = String(name).replace(/[^a-zA-Z0-9_\.]/g, '')
  // Must start with letter
  if (sanitized.length > 0 && !/^[a-zA-Z]/.test(sanitized)) {
    // strip numbers from start
    sanitized = sanitized.replace(/^[0-9]*/, '')
  }
  return sanitized
}

export function formatLua(code: string) {
  code = `${code}`

  try {
    return (require("lua-format").Beautify(code, {
      RenameVariables: false,
      RenameGlobals: false,
      SolveMath: false
    }) as string).split("\n").slice(4).join("\n").trim() + ""
  } catch (e: any) {
    console.log(e)
    return code
  }
}
export type TextOrVariable = "TEXT" | "VARIABLE"
export type TConverted = { value: string, type: TextOrVariable }
export const convertor = {
  // text inside quotes ""
  text: (input: string): TConverted => {
    const strInput = String(input || "");
    return strInput ?
      (strInput.startsWith('"') && strInput.endsWith('"') ?
        { value: strInput, type: "TEXT" } :
        { value: `"${strInput}"`, type: "TEXT" }) :
      { value: "", type: "TEXT" };
  },
  // strip starting and ending quotes
  variable: (input: string): TConverted => {
    const strInput = String(input || "");
    return strInput ?
      { value: strInput.replace(/^["']+|["']+$/g, ''), type: "VARIABLE" } :
      { value: "", type: "VARIABLE" };
  },
  // convert to number
  number: (input: string): TConverted => {
    const varValue = convertor.variable(input || "").value;
    return { value: varValue.replace(/[^0-9]/g, '') || "", type: "VARIABLE" };
  },
  // convert to boolean
  boolean: (input: string): TConverted => {
    const varValue = convertor.variable(input || "").value;
    return { value: (varValue === "true") ? "true" : "false", type: "VARIABLE" };
  }
}
