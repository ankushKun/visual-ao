import NodeContainer from "@/nodes/node";
import { Handle, Position } from "@xyflow/react";
import { keyToNode, Node, NodeIconMapping } from "@/nodes/index";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { useGlobalState } from "@/hooks/useGlobalStore";
import { InputTypes, SmolText, ToggleButton } from "@/components/right-sidebar";
import { SubRootNodesAvailable } from "./index/registry";
import { getCode, getConnectedNodes, updateNodeData } from "@/lib/events";
import { formatLua, sanitizeVariableName } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { TNodeType } from "./index/type";
import SyntaxHighlighter from "@/components/syntax-highlighter";
import { useTheme } from "next-themes";

// data field structure for react-node custom node
export interface data {
    lhs: string;
    lhsType: InputTypes;
    operator: string;
    rhs: string;
    rhsType: InputTypes;
    useAdvanced: boolean;
    advancedCondition: string;
}

// Available operators for the condition builder
const operators = [
    { value: "==", label: "equals (==)" },
    { value: "~=", label: "not equals (~=)" },
    { value: ">", label: "greater than (>)" },
    { value: "<", label: "less than (<)" },
    { value: ">=", label: "greater than or equal (>=)" },
    { value: "<=", label: "less than or equal (<=)" },
    { value: "and", label: "and" },
    { value: "or", label: "or" },
];

// Common values for condition inputs
const CommonValues = {
    "ao.id": "ao.id",
    "msg.From": "msg.From",
    "msg.Data": "msg.Data",
    "msg.Target": "msg.Target",
    "true": "true",
    "false": "false",
    "nil": "nil"
}

// react flow node component
export function ConditionalNode(props: Node) {
    const { setAvailableNodes } = useGlobalState();

    // get code event
    useEffect(() => {
        const getCodeListener = ((e: CustomEvent) => {
            const me = e.detail.id == props.id;
            if (!me) return;

            const inputs = (e.detail.data || props.data) as data;
            const { lhs, lhsType, operator, rhs, rhsType, useAdvanced, advancedCondition } = inputs;

            // Create async function to handle code generation
            const generateCode = async () => {
                const connectedNodes = getConnectedNodes(props.id);
                let body = "";

                const iterateNode = async (node: any) => {
                    if (Array.isArray(node)) {
                        for (const n of node) {
                            await iterateNode(n);
                        }
                    } else {
                        const nodeCode = await getCode(node.id, node.data);
                        body += nodeCode;
                    }
                };

                for (const node of connectedNodes) {
                    await iterateNode(node);
                }

                // Generate the condition based on whether we're using advanced mode or not
                let conditionCode;
                if (useAdvanced) {
                    conditionCode = advancedCondition;
                } else {
                    // Format the LHS and RHS based on their types
                    const lhsCode = lhsType === "TEXT" && !isNaN(Number(lhs)) ? lhs :
                        lhsType === "TEXT" ? `"${lhs}"` : lhs;

                    const rhsCode = rhsType === "TEXT" && !isNaN(Number(rhs)) ? rhs :
                        rhsType === "TEXT" ? `"${rhs}"` : rhs;

                    conditionCode = `${lhsCode} ${operator} ${rhsCode}`;
                }

                let code = `if ${conditionCode} then
    ${body.length > 0 ? body : "-- Add nodes to the graph to add code here"}
end`;
                code = `\n\n-- [start:${props.id}]\n${formatLua(code)}\n-- [end:${props.id}]\n`

                e.detail.callback(code);
            };

            // Execute the async code generation
            generateCode().catch(err => {
                console.error("Error generating code:", err);
                e.detail.callback("");
            });
        }) as EventListener;

        window.addEventListener("get-code", getCodeListener);
        return () => window.removeEventListener("get-code", getCodeListener);
    }, [props]);

    const Icon = NodeIconMapping[props.type as TNodeType];
    return <NodeContainer {...props} onAddClick={() => setAvailableNodes(SubRootNodesAvailable)}>
        {Icon && <Icon size={30} strokeWidth={1} />}
        <div className="text-center">{keyToNode(props.type as TNodeType)}</div>
    </NodeContainer>;
}

// react sidebar component that appears when a node is selected
export function ConditionalSidebar() {
    // input states according to node data
    const [lhs, setLhs] = useState("");
    const [lhsType, setLhsType] = useState<InputTypes>("VARIABLE");
    const [operator, setOperator] = useState("==");
    const [rhs, setRhs] = useState("");
    const [rhsType, setRhsType] = useState<InputTypes>("TEXT");
    const [useAdvanced, setUseAdvanced] = useState(false);
    const [advancedCondition, setAdvancedCondition] = useState("");
    const [code, setCode] = useState("");
    const { theme } = useTheme()
    const { activeNode } = useGlobalState();

    // updates the data in sidebar when the node is selected
    useEffect(() => {
        if (!activeNode) return;
        const nodeData = activeNode?.data as data;
        setLhs(nodeData?.lhs || "");
        setLhsType(nodeData?.lhsType || "VARIABLE");
        setOperator(nodeData?.operator || "==");
        setRhs(nodeData?.rhs || "");
        setRhsType(nodeData?.rhsType || "TEXT");
        setUseAdvanced(nodeData?.useAdvanced || false);
        setAdvancedCondition(nodeData?.advancedCondition || "");

        embed(nodeData)
    }, [activeNode?.id]);

    // updates the node data when the input data updates
    useEffect(() => {
        if (!activeNode) return;
        const newNodeData: data = {
            lhs,
            lhsType,
            operator,
            rhs,
            rhsType,
            useAdvanced,
            advancedCondition
        };
        activeNode.data = newNodeData;
        updateNodeData(activeNode.id, newNodeData);

        embed(newNodeData).then((code) => {
            setCode(code.trim());
        });
    }, [lhs, lhsType, operator, rhs, rhsType, useAdvanced, advancedCondition]);

    // helper function to toggle the input type between text and variable
    function handleTypeToggle(
        currentType: InputTypes,
        setType: (type: InputTypes) => void,
        value: string,
        setValue: (value: string) => void
    ) {
        const newType = currentType === "TEXT" ? "VARIABLE" : "TEXT";
        setType(newType);

        if (!activeNode) return;

        // If switching to variable type, sanitize the value
        if (newType === "VARIABLE") {
            const sanitizedValue = sanitizeVariableName(value);
            setValue(sanitizedValue);
        }
    }

    // takes in input data and returns a string of lua code via promise
    function embed(inputs: data) {
        return new Promise<string>(async (resolve) => {
            try {
                const code = await getCode(activeNode?.id!, inputs);
                setCode(code.trim());
                resolve(code);
            } catch (err) {
                console.error("Error embedding code:", err);
                resolve("");
            }
        });
    }

    return <div>
        <div className="flex items-center justify-between px-4 mt-4">
            <SmolText className="h-4 p-0">Visual Condition Builder</SmolText>
            <div className="flex items-center space-x-2">
                <SmolText className="h-4 p-0">Advanced</SmolText>
                <input
                    type="checkbox"
                    checked={useAdvanced}
                    onChange={(e) => setUseAdvanced(e.target.checked)}
                    className="h-4 w-4"
                />
            </div>
        </div>

        {!useAdvanced ? (
            <>
                {/* Left-hand side */}
                <div className="flex mt-4 px-2 items-end gap-1 justify-between h-5">
                    <SmolText className="h-4 p-0 ml-2">Left Value</SmolText>
                    <ToggleButton
                        className="mb-0.5 mr-2"
                        nameType={lhsType}
                        onClick={() => handleTypeToggle(lhsType, setLhsType, lhs, setLhs)}
                    />
                </div>
                <Input
                    type="text"
                    placeholder={lhsType === "VARIABLE" ? "Enter variable name (e.g. msg.From)" : "Enter text value"}
                    value={lhs}
                    onChange={(e) => {
                        if (lhsType === "VARIABLE") {
                            const sanitized = sanitizeVariableName(e.target.value);
                            setLhs(sanitized);
                        } else {
                            setLhs(e.target.value);
                        }
                    }}
                />
                {lhsType === "VARIABLE" && (
                    <div className="flex flex-wrap gap-1 px-2 mt-1">
                        {Object.entries(CommonValues).map(([key, value]) => (
                            <Button
                                key={`lhs-${key}`}
                                data-active={lhs === value}
                                variant="ghost"
                                onClick={() => setLhs(value)}
                                className="p-0 m-0 h-4 px-2 py-0.5 text-xs rounded-full border border-dashed border-muted-foreground/30 data-[active=true]:border-muted-foreground/100 data-[active=true]:bg-muted-foreground/10 data-[active=false]:text-muted-foreground/60 data-[active=false]:hover:bg-muted-foreground/5"
                            >
                                {key}
                            </Button>
                        ))}
                    </div>
                )}

                {/* Operator */}
                <SmolText className="h-4 p-0 ml-4 mt-4">Operator</SmolText>
                <Select value={operator} onValueChange={setOperator}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an operator" />
                    </SelectTrigger>
                    <SelectContent>
                        {operators.map((op) => (
                            <SelectItem key={op.value} value={op.value}>
                                {op.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {/* Right-hand side */}
                <div className="flex mt-4 px-2 items-end gap-1 justify-between h-5">
                    <SmolText className="h-4 p-0 ml-2">Right Value</SmolText>
                    <ToggleButton
                        className="mb-0.5 mr-2"
                        nameType={rhsType}
                        onClick={() => handleTypeToggle(rhsType, setRhsType, rhs, setRhs)}
                    />
                </div>
                <Input
                    type="text"
                    placeholder={rhsType === "VARIABLE" ? "Enter variable name (e.g. balance)" : "Enter text value (e.g. 100)"}
                    value={rhs}
                    onChange={(e) => {
                        if (rhsType === "VARIABLE") {
                            const sanitized = sanitizeVariableName(e.target.value);
                            setRhs(sanitized);
                        } else {
                            setRhs(e.target.value);
                        }
                    }}
                />
                {rhsType === "VARIABLE" && (
                    <div className="flex flex-wrap gap-1 px-2 mt-1">
                        {Object.entries(CommonValues).map(([key, value]) => (
                            <Button
                                key={`rhs-${key}`}
                                data-active={rhs === value}
                                variant="ghost"
                                onClick={() => setRhs(value)}
                                className="p-0 m-0 h-4 px-2 py-0.5 text-xs rounded-full border border-dashed border-muted-foreground/30 data-[active=true]:border-muted-foreground/100 data-[active=true]:bg-muted-foreground/10 data-[active=false]:text-muted-foreground/60 data-[active=false]:hover:bg-muted-foreground/5"
                            >
                                {key}
                            </Button>
                        ))}
                    </div>
                )}
            </>
        ) : (
            <>
                <SmolText className="h-4 p-0 ml-4 mt-4">Advanced Condition</SmolText>
                <textarea
                    className="flex w-full bg-muted focus-visible:border-ring border border-input px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                    rows={5}
                    value={advancedCondition}
                    onChange={(e) => setAdvancedCondition(e.target.value)}
                    placeholder="Enter a custom Lua condition (e.g., count > 10 and isActive)"
                />
            </>
        )}

        <SyntaxHighlighter code={code.trim()} theme={theme} />

        <div className="text-muted-foreground text-xs p-2 mt-4">
            This node will conditionally execute the connected nodes if the condition evaluates to true.<br /><br />
            Examples:<br />
            - Left: <code>count</code> (variable) | Operator: <code>&gt;</code> | Right: <code>10</code> (text)<br />
            - Left: <code>message.Tags["Type"]</code> (variable) | Operator: <code>==</code> | Right: <code>Transfer</code> (text)<br />
            - Use advanced mode for complex conditions like: <code>balance ~= nil and balance &gt; 0</code>
        </div>
    </div>;
} 