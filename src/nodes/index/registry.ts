import { LucideIcon, CodeIcon, Workflow, MessageSquareShare, FunctionSquareIcon, DownloadCloud, Send, Coins, SquareDashed, Plus, GitBranch, Repeat } from "lucide-react";

// Import your node components and (if available) sidebar editors
import StartNode from "@/nodes/index/start";
import AnnotationNode from "@/nodes/index/annotation";
import { TNodeData } from "@/nodes/index/type";

import { TemplateSidebar } from "@/nodes/_template";
import { TemplateNode } from "@/nodes/_template";
import { HandlerNode, HandlerSidebar } from "@/nodes/handler";
import { SendMessageSidebar } from "../send-message";
import { SendMessageNode } from "../send-message";
import { CodeblockSidebar } from "../codeblock";
import { CodeblockNode } from "../codeblock";
import { TokenNode } from "../token";
import { TokenSidebar } from "../token";
import { ConditionalNode, ConditionalSidebar } from "../conditional";
import { LoopNode, LoopSidebar } from "../loop";
import { TEdges } from "@/edges";

export type TNodeType =
    | "start"
    | "add-node"
    | "annotation"
    | "handler"
    | "token"
    | "send-message"
    | "codeblock"
    | "conditional"
    | "loop"
    | "template";

export const RootNodesAvailable: TNodeType[] = ["handler", "codeblock", "token", "loop"]
export const SubRootNodesAvailable: TNodeType[] = ["send-message", "codeblock", "conditional", "loop"]

export const attachables: TNodeType[] = ["handler", "token", "conditional", "loop"]

// Define possible edge types
// export type TEdgeType = "default" | "message" | "tokenId";

// Define a configuration interface for a node:
export interface NodeConfig {
    type: TNodeType;
    name: string; // Friendly display name
    icon: LucideIcon;
    NodeComponent: React.FC<any>;
    SidebarComponent: React.FC<any>;
    embedFunction?: (inputs: TNodeData) => string;
    outputType: TEdges; // What type of edge should be used when this is the source
}

// Create an array of node configurations – adding a new node now only means adding a new entry here.
const nodeConfigs: NodeConfig[] = [
    {
        type: "start",
        name: "Start",
        icon: CodeIcon,
        NodeComponent: StartNode,
        SidebarComponent: () => null,  // No sidebar needed
        outputType: "default"
    },
    {
        type: "annotation",
        name: "Annotation",
        icon: CodeIcon,
        NodeComponent: AnnotationNode,
        SidebarComponent: () => null,
        outputType: "default"
    },
    // 
    {
        type: "handler",
        name: "Handler",
        icon: Workflow,
        NodeComponent: HandlerNode,
        SidebarComponent: HandlerSidebar,
        outputType: "message"
    },
    {
        type: "token",
        name: "Token",
        icon: Coins,
        NodeComponent: TokenNode,
        SidebarComponent: TokenSidebar,
        outputType: "tokenId"
    },
    {
        type: "send-message",
        name: "Send Message",
        icon: MessageSquareShare,
        NodeComponent: SendMessageNode,
        SidebarComponent: SendMessageSidebar,
        outputType: "inherit"
    },
    {
        type: "codeblock",
        name: "Code Block",
        icon: CodeIcon,
        NodeComponent: CodeblockNode,
        SidebarComponent: CodeblockSidebar,
        outputType: "inherit"
    },
    {
        type: "conditional",
        name: "Conditional",
        icon: GitBranch,
        NodeComponent: ConditionalNode,
        SidebarComponent: ConditionalSidebar,
        outputType: "inherit"
    },
    {
        type: "loop",
        name: "Loop",
        icon: Repeat,
        NodeComponent: LoopNode,
        SidebarComponent: LoopSidebar,
        outputType: "loop"
    }
];

if (process.env.NODE_ENV == "development") {
    nodeConfigs.push({
        type: "template",
        name: "Template",
        icon: SquareDashed,
        NodeComponent: TemplateNode,
        SidebarComponent: TemplateSidebar,
        outputType: "default"
    });
}

export { nodeConfigs };
