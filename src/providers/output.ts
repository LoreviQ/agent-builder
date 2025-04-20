import { Provider, ShapeDescriptor } from "../types";

export const outputProvider = (shapeDescriptor: ShapeDescriptor, order = 100): Provider => {
    // Check if the shapeDescriptor is empty
    if (Object.keys(shapeDescriptor).length === 0) {
        throw new Error('outputProvider requires a non-empty shapeDescriptor.');
    }

    return {
        key: `outputShape`,
        type: 'system',
        title: `Output Shape`,
        order,
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

export const outputReminder = (shapeDescriptor: ShapeDescriptor, order = 100): Provider => {
    // Check if the shapeDescriptor is empty
    if (Object.keys(shapeDescriptor).length === 0) {
        throw new Error('outputReminder requires a non-empty shapeDescriptor.');
    }

    return {
        key: `outputReminder`,
        type: 'prompt',
        title: `Output Reminder`,
        order,
        execute: async () => {
            // Generate the compact JSON string representation
            const entries = Object.entries(shapeDescriptor);
            const jsonParts = entries.map(([key, descriptor]) => `"${key}" : ${descriptor.type}`);
            const jsonString = `{${jsonParts.join(', ')}}`; // Add spaces for readability

            return `Remember to provide the output strictly in the specified JSON format: ${jsonString}`;
        }
    };
};
