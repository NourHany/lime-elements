import { toggleMark, setBlockType, wrapIn } from 'prosemirror-commands';
import { Schema, MarkType, NodeType } from 'prosemirror-model';
import { wrapInList } from 'prosemirror-schema-list';
import { Command } from 'prosemirror-state';
import { EditorMenuTypes, levelMapping } from './types';

type CommandFunction = (
    schema: Schema,
    mark: EditorMenuTypes,
    url?: string,
) => Command;

interface CommandMapping {
    [key: string]: CommandFunction;
}

const createToggleMarkCommand = (
    schema: Schema,
    markName: string,
    url?: string,
): Command => {
    const markType: MarkType | undefined = schema.marks[markName];
    if (!markType) {
        throw new Error(`Mark "${markName}" not found in schema`);
    }

    if (markName === EditorMenuTypes.Link && url) {
        return toggleMark(markType, { href: url });
    }

    return toggleMark(markType);
};

const createSetNodeTypeCommand = (
    schema: Schema,
    nodeType: string,
    level?: number,
): Command => {
    const type: NodeType | undefined = schema.nodes[nodeType];
    if (!type) {
        throw new Error(`Node type "${nodeType}" not found in schema`);
    }

    if (nodeType === 'heading' && level) {
        return setBlockType(type, { level: level });
    } else {
        return setBlockType(type);
    }
};

const createWrapInCommand = (schema: Schema, nodeType: string): Command => {
    const type: NodeType | undefined = schema.nodes[nodeType];
    if (!type) {
        throw new Error(`Node type "${nodeType}" not found in schema`);
    }

    return wrapIn(type);
};

const createListCommand = (schema: Schema, listType: string): Command => {
    const type: NodeType | undefined = schema.nodes[listType];
    if (!type) {
        throw new Error(`List type "${listType}" not found in schema`);
    }

    return wrapInList(type);
};

const commandMapping: CommandMapping = {
    strong: createToggleMarkCommand,
    em: createToggleMarkCommand,
    underline: createToggleMarkCommand,
    headerlevel1: (schema) =>
        createSetNodeTypeCommand(schema, 'heading', levelMapping.one),
    headerlevel2: (schema) =>
        createSetNodeTypeCommand(schema, 'heading', levelMapping.two),
    headerlevel3: (schema) =>
        createSetNodeTypeCommand(schema, 'heading', levelMapping.three),
    blockquote: createWrapInCommand,
    /* eslint-disable camelcase */
    ordered_list: createListCommand,
    bullet_list: createListCommand,
    /* eslint-enable camelcase */
    link: createToggleMarkCommand,
};

export class MenuCommandFactory {
    private schema: Schema;

    constructor(schema: Schema) {
        this.schema = schema;
    }

    getCommand(mark: EditorMenuTypes, url?: string) {
        if (!Object.values(EditorMenuTypes).includes(mark)) {
            throw new Error(`The Menu Type "${mark}" is not supported`);
        }

        const commandFunc = commandMapping[mark];
        if (!commandFunc) {
            throw new Error(`The Mark "${mark}" is not supported`);
        }

        return commandFunc(this.schema, mark, url);
    }

    buildKeymap() {
        return {
            'Mod-B': this.getCommand(EditorMenuTypes.Strong),
            'Mod-I': this.getCommand(EditorMenuTypes.Italic),
            'Mod-Shift-1': this.getCommand(EditorMenuTypes.HeaderLevel1),
            'Mod-Shift-2': this.getCommand(EditorMenuTypes.HeaderLevel2),
            'Mod-Shift-3': this.getCommand(EditorMenuTypes.HeaderLevel3),
        };
    }
}
