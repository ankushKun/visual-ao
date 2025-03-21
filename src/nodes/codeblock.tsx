import NodeContainer from "@/nodes/node";
import { Handle, Position } from "@xyflow/react";
import { keyToNode, Node, NodeIconMapping } from "@/nodes/index";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useGlobalState } from "@/hooks/useGlobalStore";
import { InputTypes, SmolText, ToggleButton } from "@/components/right-sidebar";
import { Loader, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import Ansi from "ansi-to-react";
import { parseOutupt, runLua } from "@/lib/aos";
import Link from "next/link";
import { SubRootNodesAvailable } from "./index/registry";
import { TNodeType } from "./index/type";
import { getCode, updateNodeData } from "@/lib/events";
import Editor from "@monaco-editor/react"
import { formatLua } from "@/lib/utils";
import SyntaxHighlighter from "@/components/syntax-highlighter";
import { useTheme } from "next-themes";

// This file should be copied and modified to create new nodes
// Copy inside @nodes/community and rename the file
// Once modified, import the compoments and functions into @nodes/registry.ts

// The file should be self explanatory.
// If you need help or have questions, feel free to reachout to me on X https://x.com/ankushKun_

// data field structure for react-node custom node
export interface data {
    code: string;
}

// react flow node component
export function CodeblockNode(props: Node) {
    const { setAvailableNodes } = useGlobalState()

    // get code event
    useEffect(() => {
        const getCodeListener = ((e: CustomEvent) => {
            const me = e.detail.id == props.id
            if (!me) return
            const inputs = e.detail.data ? (e.detail.data as data) : (props.data as data)
            let code = inputs.code
            code = `\n\n-- [start:${props.id}]\n${formatLua(code)}\n-- [end:${props.id}]\n`
            e.detail.callback(code)
        }) as EventListener

        window.addEventListener("get-code", getCodeListener)
        return () => window.removeEventListener("get-code", getCodeListener)
    }, [props])

    const Icon = NodeIconMapping[props.type as TNodeType]
    return <NodeContainer {...props} onAddClick={() => setAvailableNodes(SubRootNodesAvailable)}>
        {Icon && <Icon size={30} strokeWidth={1} />}
        <div className="text-center">{keyToNode(props.type as TNodeType)}</div>
    </NodeContainer>
}

// react sidebar component that appears when a node is selected
export function CodeblockSidebar() {
    // input states according to node data (modify as needed)
    const [code, setCode] = useState("")
    const [codePreview, setCodePreview] = useState("")

    const [prompt, setPrompt] = useState<string | null>(null)
    const { activeNode, activeProcess, setActiveNode } = useGlobalState()
    const { theme } = useTheme()
    // updates the data in sidebar when the node is selected
    useEffect(() => {
        if (!activeNode) return
        const nodeData = activeNode?.data as data
        if (nodeData.code) {
            setCode(nodeData?.code.trim() || "")
        }
    }, [activeNode?.id])

    // updates the node data when the input data updates
    useEffect(() => {
        if (!activeNode) return
        updateNodeData(activeNode.id, { code });
        getCode(activeNode.id, { code }).then(code => {
            setCodePreview(code)
        })
    }, [code]);


    return <div>
        <SmolText className="h-4 p-0 ml-4 mt-4">Ask AI to write code for you (coming soon)</SmolText>
        <textarea
            disabled
            className="flex w-[97%] mx-auto rounded max-h-48 min-h-10 h-10 bg-muted focus-visible:border-ring border border-input px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
            placeholder="Prompt for AI"
            value={prompt || ""}
            rows={1}
            onChange={(e) => setPrompt(e.target.value)}
        />
        <SmolText className="h-4 p-0 ml-4 mt-4">Write your lua code here</SmolText>
        <Editor
            defaultLanguage="lua"
            value={code}
            onChange={(value) => setCode(value || "")}
            height={
                Math.min(Math.max(code.split("\n").length * 18, 18 * 10), 18 * 20)
            }
            options={{
                scrollBeyondLastLine: false,
                fontSize: 12,
                fontFamily: "monospace",
                fontLigatures: false,
                minimap: { enabled: false },
                wordWrap: "on",
                lineNumbersMinChars: 2,
                lineDecorationsWidth: 0
            }}
            onMount={(editor, monaco) => {
                const theme = localStorage.getItem("theme")
                if (theme == "dark") {
                    monaco.editor.setTheme("vs-dark")
                } else {
                    monaco.editor.setTheme("vs-light")
                }
            }}
        />
        <SyntaxHighlighter code={codePreview.trim()} theme={theme} />
    </div>
}
