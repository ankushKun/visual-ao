import * as Blockly from 'blockly';
import { luaGenerator } from 'blockly/lua';
import { ToolboxDefinition } from 'react-blockly';

export interface BlockDefinition {
    init: (this: Blockly.Block) => void;
    mutate?: (this: Blockly.Block) => void;
    compose?: (topBlock: Blockly.Block) => void;
    decompose?: (workspace: Blockly.Workspace) => Blockly.Block;
}

export interface ToolboxBlockDefinition {
    type: string;
    kind: "block";
    inputs?: Record<string, any>;
    fields?: Record<string, any>;
}

export interface BlockRegistration {
    hidden?: boolean;
    type: string;
    category: string;
    block: BlockDefinition;
    generator: (block: Blockly.Block) => string | [string, number];
    toolbox: ToolboxBlockDefinition;
    // extensions?: string[];
}

// Global registry of all blocks
export const blockRegistry: BlockRegistration[] = [];

// Helper function to register a block
export function registerBlock(registration: BlockRegistration) {
    console.log("registering block", registration)
    blockRegistry.push(registration);
}

// Function to initialize all registered blocks
export function initializeBlocks() {
    console.log("initializing blocks", blockRegistry)
    for (const { type, block, generator } of blockRegistry) {
        Blockly.Blocks[type] = block;
        luaGenerator.forBlock[type] = generator;
    }
} 