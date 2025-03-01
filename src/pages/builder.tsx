import { SmolText } from "@/components/right-sidebar";
import TopBar from "@/components/top-bar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NodeConfig } from "@/nodes/index/registry";
import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup, } from "@/components/ui/resizable"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger, } from "@/components/ui/tooltip"
import { Plus, X, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { convertor, TextOrVariable, TConverted } from "@/lib/utils";
import { GenerateNode, GenerateSidebar } from "@/nodes/index/generators";

// inputs:
// - node name
// - node type (autogenerated from name)
// - node icon (selector for lucide icons)
// - output type (default or inherit)
// - inputs:
//   - name (is the key of the entry)
//   - type (text, number, boolean)
//   - input type (normal, dropdown, checkbox)
//   - label (optional)
//   - showVariableToggle (optional, default is false)
//   - values (optional, for dropdown and checkbox)
//   - placeholder (optional)
// - codeGenerator

interface InputConfig {
    input: "normal" | "dropdown" | "checkbox";
    type: "text" | "number" | "boolean";
    label?: string;
    showVariableToggle?: boolean;
    values?: TConverted[];
    placeholder?: string;
}

interface NodeInputs {
    [key: string]: InputConfig;
}

export default function NodeBuildder() {
    const [node, setNode] = useState<Partial<NodeConfig>>({ inputs: {} });
    const [iconSearch, setIconSearch] = useState("");
    const [selectedIcon, setSelectedIcon] = useState<string>("");
    const [newInputKey, setNewInputKey] = useState("");

    // Get all Lucide icons and filter out non-icon exports
    const iconList = Object.entries(LucideIcons).map(([name]) => name).filter((name) => !name.endsWith("Icon"));

    // Filter icons based on search
    const filteredIcons = iconList
        .filter(name => name.toLowerCase().includes(iconSearch.toLowerCase()))
        .slice(0, 25); // Limit to first 100 icons for performance

    useEffect(() => {
        console.log(node);
    }, [node]);

    const addInput = () => {
        if (!newInputKey || !node.inputs) return;
        setNode(prev => ({
            ...prev,
            inputs: {
                ...prev.inputs,
                [newInputKey]: {
                    type: "text",
                    input: "normal",
                    showVariableToggle: false
                }
            }
        }));
        setNewInputKey("");
    };

    const removeInput = (key: string) => {
        if (!node.inputs) return;
        const newInputs = { ...node.inputs };
        delete newInputs[key];
        setNode(prev => ({ ...prev, inputs: newInputs }));
    };

    const updateInput = (key: string, field: string, value: any) => {
        if (!node.inputs) return;
        const currentInputs = node.inputs as NodeInputs;

        // Special handling for dropdown values
        if (field === 'values' && currentInputs[key]?.input === 'dropdown') {
            const values = value as TConverted[];
            setNode(prev => ({
                ...prev,
                inputs: {
                    ...currentInputs,
                    [key]: {
                        ...currentInputs[key],
                        values
                    }
                }
            }));
            return;
        }

        // If changing to dropdown, initialize values as empty array of TextOrVariable objects
        if (field === 'input' && value === 'dropdown') {
            setNode(prev => ({
                ...prev,
                inputs: {
                    ...currentInputs,
                    [key]: {
                        ...currentInputs[key],
                        input: value,
                        showVariableToggle: false,
                        type: currentInputs[key]?.type === 'boolean' ? 'text' : currentInputs[key]?.type || 'text',
                        values: []
                    }
                }
            }));
            return;
        }

        // If changing to checkbox type, force boolean data type
        if (field === 'input' && value === 'checkbox') {
            setNode(prev => ({
                ...prev,
                inputs: {
                    ...currentInputs,
                    [key]: {
                        ...currentInputs[key],
                        [field]: value,
                        type: 'boolean',
                        showVariableToggle: false
                    }
                }
            }));
            return;
        }

        // Don't allow changing data type if input type is checkbox
        if (field === 'type' && currentInputs[key]?.input === 'checkbox') {
            return;
        }

        // Don't allow boolean type for dropdown inputs
        if (field === 'type' && value === 'boolean' && currentInputs[key]?.input === 'dropdown') {
            return;
        }

        setNode(prev => ({
            ...prev,
            inputs: {
                ...currentInputs,
                [key]: {
                    ...currentInputs[key],
                    [field]: value
                }
            }
        }));
    };

    const updateDropdownValueType = (inputKey: string, valueIndex: number, type: TextOrVariable) => {
        const currentInputs = node.inputs as NodeInputs;
        if (!currentInputs?.[inputKey]?.values) return;

        const currentValues = [...currentInputs[inputKey].values!];
        currentValues[valueIndex] = {
            ...currentValues[valueIndex],
            type
        };

        setNode(prev => ({
            ...prev,
            inputs: {
                ...currentInputs,
                [inputKey]: {
                    ...currentInputs[inputKey],
                    values: currentValues
                }
            }
        }));
    };

    return (
        <div className="flex flex-col h-screen">
            <TopBar />
            <div className="w-full border-b">
                <div className="text-xl font-light p-2 px-6">Node Builder</div>
            </div>
            <ResizablePanelGroup direction="horizontal" className="">
                <ResizablePanel defaultSize={35} minSize={20} maxSize={50} className="p-2 h-[calc(100vh-120px)] !overflow-y-scroll">
                    <SmolText className="ml-2 mt-2 text-lg font-semibold">Node Name</SmolText>
                    <Input placeholder="Enter friendly display name (e.g. Send Message)"
                        onChange={(e) => setNode((node) => { return { ...node, name: e.target.value, type: e.target.value.toLowerCase().replace(/ /g, "-").replaceAll(/[^a-z0-9-]/g, "") as any } })}
                    />
                    <SmolText className="ml-2 mt-2 text-lg font-semibold">Node Type</SmolText>
                    <Input placeholder="Enter node type (e.g. send-message)"
                        value={node.type}
                        onChange={(e) => setNode((node) => { return { ...node, type: e.target.value as any } })}
                    />
                    <SmolText className="ml-2 mt-2 text-lg font-semibold">Node Icon</SmolText>
                    <Input
                        placeholder="Search icons..."
                        value={iconSearch}
                        onChange={(e) => setIconSearch(e.target.value)}
                        className="mb-4"
                    />
                    <div className="flex flex-wrap gap-2 items-center justify-center px-2 mx-auto" suppressHydrationWarning>
                        {filteredIcons.map(iconName => {
                            const Icon = LucideIcons[iconName as keyof typeof LucideIcons] as React.FC<any>;
                            return (
                                <TooltipProvider key={iconName} delayDuration={0}>
                                    <Tooltip>
                                        <TooltipTrigger data-selected={selectedIcon == iconName} suppressHydrationWarning onClick={() => {
                                            setSelectedIcon(iconName);
                                            setNode(node => ({ ...node, iconName }));
                                        }}
                                            className="!aspect-square w-11 h-11 !p-0 border flex items-center justify-center rounded-md data-[selected=true]:bg-green-400/20"
                                            title={iconName}>
                                            <Icon />
                                        </TooltipTrigger>
                                        <TooltipContent sideOffset={2} side="bottom" className="bg-[#cdcdcd] shadow p-1 px-2 text-foreground">
                                            <p>{iconName}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            );
                        })}
                    </div>
                    <SmolText className="ml-2 mt-2 text-lg font-semibold">Node Output Type</SmolText>
                    <div className="grid grid-cols-2 gap-2 justify-center px-2">
                        <Button data-selected={node.outputType === "default"} variant="outline" className="w-full data-[selected=true]:bg-green-400/20" onClick={() => setNode((node) => { return { ...node, outputType: "default" } })}>Default</Button>
                        <Button data-selected={node.outputType === "inherit"} variant="outline" className="w-full data-[selected=true]:bg-green-400/20" onClick={() => setNode((node) => { return { ...node, outputType: "inherit" } })}>Inherit</Button>
                        <div className="text-sm text-center text-muted-foreground">Default edge type (no labels)</div>
                        <div className="text-sm text-center text-muted-foreground">Inherits the edge type from the previous node</div>
                    </div>

                    <div className="ml-2 mt-2 flex items-center justify-between gap-2">
                        <SmolText className="text-lg mt-4 font-semibold">Node Inputs</SmolText>
                        <div className="flex gap-2 items-center mt-4">
                            <Input
                                placeholder="Input key"
                                value={newInputKey}
                                onChange={(e) => setNewInputKey(e.target.value)}
                                className="w-32"
                            />
                            <Button variant="outline" onClick={addInput}><Plus className="w-4 h-4" /></Button>
                        </div>
                    </div>

                    <div className="overflow-y-auto mt-4 w-full px-2">
                        {node.inputs && Object.entries(node.inputs).map(([key, input]) => (
                            <div key={key} className="border rounded-lg p-4 mb-4 mx-auto">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="font-medium">{key}</div>
                                    <Button variant="ghost" size="icon" onClick={() => removeInput(key)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid gap-2">
                                        <div className="text-sm font-medium">Input Type</div>
                                        <Select
                                            value={input.input}
                                            onValueChange={(value) => updateInput(key, 'input', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="normal">Normal</SelectItem>
                                                <SelectItem value="dropdown">Dropdown</SelectItem>
                                                <SelectItem value="checkbox">Checkbox</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="text-sm font-medium">Data Type</div>
                                        <Select
                                            value={input.type}
                                            onValueChange={(value) => updateInput(key, 'type', value)}
                                            disabled={input.input === 'checkbox'}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="text">Text</SelectItem>
                                                <SelectItem value="number">Number</SelectItem>
                                                <SelectItem value="boolean" disabled={['dropdown', 'normal'].includes(input.input)}>Boolean</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="text-sm font-medium">Label (Optional)</div>
                                        <Input
                                            placeholder="Enter label"
                                            value={input.label || ''}
                                            onChange={(e) => updateInput(key, 'label', e.target.value)}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <div className="text-sm font-medium">Placeholder (Optional)</div>
                                        <Input
                                            placeholder="Enter placeholder"
                                            value={input.placeholder || ''}
                                            onChange={(e) => updateInput(key, 'placeholder', e.target.value)}
                                        />
                                    </div>

                                    {input.input === 'dropdown' && (
                                        <div className="space-y-4">
                                            <div className="text-sm font-medium">Values</div>
                                            <div className="space-y-2">
                                                {((input.values || []) as TConverted[]).map((val: TConverted, idx: number) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        <Input
                                                            value={val.value}
                                                            onChange={(e) => {
                                                                const newValues = [...(input.values || [])] as TConverted[];
                                                                newValues[idx] = {
                                                                    ...newValues[idx],
                                                                    value: e.target.value
                                                                };
                                                                updateInput(key, 'values', newValues);
                                                            }}
                                                            placeholder={`Value ${idx + 1}`}
                                                        />
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={val.type === "TEXT" ? "bg-green-400/20" : ""}
                                                                onClick={() => updateDropdownValueType(key, idx, "TEXT")}
                                                            >
                                                                Text
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className={val.type === "VARIABLE" ? "bg-green-400/20" : ""}
                                                                onClick={() => updateDropdownValueType(key, idx, "VARIABLE")}
                                                            >
                                                                Variable
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => {
                                                                    const newValues = [...(input.values || [])] as TConverted[];
                                                                    newValues.splice(idx, 1);
                                                                    updateInput(key, 'values', newValues);
                                                                }}
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                                <Button
                                                    variant="outline"
                                                    className="w-full"
                                                    onClick={() => {
                                                        const newValues = [...(input.values || []), {
                                                            type: "TEXT" as TextOrVariable,
                                                            value: ""
                                                        }] as TConverted[];
                                                        updateInput(key, 'values', newValues);
                                                    }}
                                                >
                                                    <Plus className="w-4 h-4 mr-2" /> Add Value
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex items-center justify-center space-x-2">
                                        <div data-disabled={input.input != "normal"} className="text-sm font-medium data-[disabled=true]:text-muted-foreground/80">Show Variable Toggle</div>
                                        <Switch
                                            disabled={input.input != "normal"}
                                            checked={input.showVariableToggle || false}
                                            onCheckedChange={(checked) => updateInput(key, 'showVariableToggle', checked)}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel>
                    <ResizablePanelGroup direction="vertical">
                        <ResizablePanel defaultSize={50} className="flex items-center justify-center">
                            <div className="bg-white w-[114px] h-[114px] rounded-md border flex flex-col items-center justify-center">
                                {(() => {
                                    if (!node.iconName) return null;
                                    const Icon = LucideIcons[node.iconName as keyof typeof LucideIcons] as React.FC<any>;
                                    return <Icon className="w-10 h-10" strokeWidth={1.2} />
                                })()}
                                {node.name}
                            </div>
                        </ResizablePanel>
                        <ResizableHandle />
                        <ResizablePanel defaultSize={50}>
                            <pre className="text-xs p-5">{JSON.stringify(node, null, 2)}</pre>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
    )
}