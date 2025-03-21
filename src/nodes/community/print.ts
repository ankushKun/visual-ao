import { NodeConfig } from "@/nodes/index/registry"
import { TNodeData } from "../index/type"
import { convertor, TextOrVariable } from "@/lib/utils"

export type data = {
    var: string
    varType: TextOrVariable
}

export const templateNode: NodeConfig = {
    name: "Print",
    type: "print",
    iconName: "SquareTerminal",
    outputType: "inherit",
    inputs: {
        "var": {
            label: "Variable Name (variable / value)",
            type: "text",
            input: "normal",
            placeholder: "Hello AO!",
            showVariableToggle: true,
            values: ["Hello AO!", "gm", convertor.variable("ao.id")],
        }
    },
    codeTemplate: "print({var})"
}