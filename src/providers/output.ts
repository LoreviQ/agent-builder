import { Provider, FieldDescriptor } from "../types";

export const outputProvider = <T extends Record<string, FieldDescriptor>>(shapeDescriptor: T, index = 100): Provider => {
    // Check if the shapeDescriptor is empty
    if (Object.keys(shapeDescriptor).length === 0) {
        throw new Error('outputProvider requires a non-empty shapeDescriptor.');
    }

    return {
        key: `outputShape`,
        type: 'system',
        title: `Output Shape`,
        index,
        execute: async () => {
            // No need to check for empty here again, as it's handled above
            const entries = Object.entries(shapeDescriptor);

            // format the shape description
            const shapeLines = entries
                .map(([key, descriptor]) => `  "${key}": "(${descriptor.type}) ${descriptor.description}"`)
                .join(',\n');
            const jsonBlock = `{\n${shapeLines}\n}`;

            return `The output MUST be a single, valid JSON object. This JSON object must contain exactly ${entries.length} keys in the shape:\n\`\`\`json\n${jsonBlock}\n\`\`\``;
        }
    };
};
