import { Block } from 'blockly';
import { BlockRegistration, registerBlock } from '../../utils/registry';
import * as Lua from 'blockly/lua';

const type = "table_set"
const block: BlockRegistration = {
    type,
    category: 'Tables',
    block: {
        init: function (this: Block) {
            this.setInputsInline(true);
            this.setPreviousStatement(true, null);
            this.setNextStatement(true, null);
            this.setColour(230);
            this.appendValueInput('TABLE')
                .setCheck('TABLE')
                .appendField('set in table');
            this.appendValueInput('KEY')
                .setCheck(null)
                .appendField('key');
            this.appendValueInput('VALUE')
                .setCheck(null)
                .appendField('to');
            this.setTooltip("Set a value in a table");
            this.setHelpUrl("");
        }
    },
    generator: (block: Block) => {
        const table = Lua.luaGenerator.valueToCode(block, 'TABLE', Lua.Order.ATOMIC) || '{}';
        const key = Lua.luaGenerator.valueToCode(block, 'KEY', Lua.Order.ATOMIC) || '1';
        const value = Lua.luaGenerator.valueToCode(block, 'VALUE', Lua.Order.ATOMIC) || 'nil';
        return `${table}[${key}] = ${value}\n`;
    },
    toolbox: {
        type,
        kind: "block",
        inputs: {
            TABLE: {
                shadow: {
                    type: "TABLE",
                    fields: {
                        TABLE: "table"
                    }
                }
            },
            KEY: {
                kind: "input",
                type: "text",
                shadow: {
                    type: "text",
                    fields: {
                        TEXT: "key"
                    }
                }
            },
            VALUE: {
                kind: "input",
                type: "text",
                shadow: {
                    type: "text",
                    fields: {
                        TEXT: "value"
                    }
                }
            }
        }
    }
};

registerBlock(block); 