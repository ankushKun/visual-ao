// import { replaceXMLFieldValue, xmlToLua } from "@/blockly/utils/xml"
import { Edge } from "@/edges"
import { Node } from "@/nodes/index"
import { TNodeType } from "@/nodes/index/registry"
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

export function addNode(type: TNodeType, extraDetail?: {}) {
  dispatchEvent(new CustomEvent("add-node", { detail: { type, ...extraDetail } }))
}

export function deleteNode(id: string, extraDetail?: {}) {
  dispatchEvent(new CustomEvent("delete-node", { detail: { id, ...extraDetail } }))
}

export function runNode(id: string, extraDetail?: {}) {
  dispatchEvent(new CustomEvent("run-node", { detail: { id, ...extraDetail } }))
}
