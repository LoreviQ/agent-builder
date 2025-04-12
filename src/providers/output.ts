import { Provider, FieldDescriptor } from "../types";

export const outputProvider = <T extends Record<string, FieldDescriptor>>(shapeDescriptor: T, index = 100): Provider => ({
    key: `outputShape`,
    type: 'system',
    title: `Output Shape`,
    index,
    execute: async () => {
        // object shape descriptor
        const entries = Object.entries(shapeDescriptor);

        // format the shape description
        const shapeLines = entries
            .map(([key, descriptor]) => `  "${key}": "(${descriptor.type}) ${descriptor.description}"`)
            .join(',\n');
        const jsonBlock = `{\n${shapeLines}\n}`;

        // Construct the final string using the formatted JSON block
        return `The output MUST be a single, valid JSON object. This JSON object must contain exactly ${entries.length} keys in the shape:\n\`\`\`json\n${jsonBlock}\n\`\`\``;
    }
});
