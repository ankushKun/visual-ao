import { BezierEdge } from "@xyflow/react";
import DashedEdge from "./dashed";
import MessageEdge from "./message";
import TokenIdEdge from "./token-id";
import LoopEdge from "./loop";
import LoopEndEdge from "./loop-end";
export interface Edge {
    id: string;
    source: string;
    target: string;
    type: string;
    data?: any;
}

const Edges = {
    default: BezierEdge,
    dashed: DashedEdge,
    message: MessageEdge,
    tokenId: TokenIdEdge,
    loop: LoopEdge,
    loopEnd: LoopEndEdge
}

type TEdges = keyof typeof Edges | "inherit"

export { Edges, type TEdges };