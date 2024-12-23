import { Block } from 'blockly';
import { BlockRegistration, registerBlock } from '../../utils/registry';
import * as Lua from 'blockly/lua';

// Define the block
const type = "TABLE"
const block: BlockRegistration = {
    hidden: true,
    type,
    category: 'Lua Tables',
    block: {
        init: function (this: Block) {
            this.setOutput(true, "TABLE");
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.setTooltip("A table");
        }
    },
    generator: (block: Block) => {
        return ["{}", Lua.Order.ATOMIC];
    },
    toolbox: {
        type,
        kind: "block"
    }
};

// Register the block
registerBlock(block); 