import { ShapeDescriptor } from '../types'; // Import ShapeDescriptor

/**
 * Processes a JSON string based on a shape descriptor, validates types,
 * performs basic casting, and returns a structured object.
 *
 * @param shapeDescriptor An object describing the expected keys and their types.
 * @param jsonString The input string, potentially containing a JSON object within ```json fences.
 * @returns An object conforming to the shapeDescriptor.
 * @throws Error if shapeDescriptor is empty, jsonString is empty, JSON is invalid, or type validation/casting fails.
 */
export const processOutput = (
    shapeDescriptor: ShapeDescriptor,
    jsonString: string
): Record<string, any> => {

    if (Object.keys(shapeDescriptor).length === 0) {
        throw new Error('processOutput requires a non-empty shapeDescriptor.');
    }
    if (!jsonString || jsonString.trim() === '') {
        throw new Error('processOutput requires a non-empty jsonString.');
    }

    let extractedJson = jsonString.trim();

    // Attempt to extract JSON from ```json blocks
    const jsonBlockRegex = /```json\n?({[^]*?})\n?```/i; // Case-insensitive
    const match = extractedJson.match(jsonBlockRegex);
    if (match && match[1]) {
        extractedJson = match[1];
    } else {
        // If no markdown fences, assume the whole string might be JSON
        // Basic check: does it start with { and end with }?
        if (!extractedJson.startsWith('{') || !extractedJson.endsWith('}')) {
            // It might still be valid JSON without fences, but this is a heuristic
            // We rely on JSON.parse to ultimately validate
        }
    }

    let parsedData: Record<string, any>;
    try {
        parsedData = JSON.parse(extractedJson);
    } catch (error) {
        throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}\nOriginal String: ${jsonString}\nExtracted JSON: ${extractedJson}`);
    }

    const result: Record<string, any> = {};

    for (const key in shapeDescriptor) {
        if (Object.prototype.hasOwnProperty.call(shapeDescriptor, key)) {
            const descriptor = shapeDescriptor[key];
            const value = parsedData[key];

            if (value === undefined || value === null) {
                // Handle missing keys - throwing an error for now
                // Could potentially allow optional keys or default values later
                throw new Error(`Missing key "${key}" in parsed JSON data.`);
            }

            // Type validation and casting
            switch (descriptor.type) {
                case 'string':
                    if (typeof value !== 'string') {
                        // Allow simple casting from number/boolean for convenience?
                        // For now, strict check.
                        result[key] = String(value); // Explicit cast might be desired sometimes
                        // throw new Error(`Type mismatch for key "${key}": expected string, got ${typeof value}`);
                    } else {
                        result[key] = value;
                    }
                    break;
                case 'number':
                    if (typeof value === 'number' && !isNaN(value)) {
                        result[key] = value;
                    } else if (typeof value === 'string') {
                        const num = Number(value); // Use Number for more flexible parsing than parseFloat
                        if (!isNaN(num)) {
                            result[key] = num;
                        } else {
                            throw new Error(`Type mismatch for key "${key}": expected number, got string "${value}" (could not convert)`);
                        }
                    } else {
                        throw new Error(`Type mismatch for key "${key}": expected number, got ${typeof value}`);
                    }
                    break;
                case 'boolean':
                    if (typeof value === 'boolean') {
                        result[key] = value;
                    } else if (typeof value === 'string') {
                        const lowerValue = value.toLowerCase();
                        if (lowerValue === 'true') {
                            result[key] = true;
                        } else if (lowerValue === 'false') {
                            result[key] = false;
                        } else {
                            throw new Error(`Type mismatch for key "${key}": expected boolean, got string "${value}" (could not convert)`);
                        }
                    } else {
                        throw new Error(`Type mismatch for key "${key}": expected boolean, got ${typeof value}`);
                    }
                    break;
                case 'object':
                    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                        throw new Error(`Type mismatch for key "${key}": expected object, got ${typeof value}`);
                    }
                    result[key] = value; // Shallow validation - further processing might be needed
                    break;
                case 'array':
                    if (!Array.isArray(value)) {
                        throw new Error(`Type mismatch for key "${key}": expected array, got ${typeof value}`);
                    }
                    result[key] = value; // Shallow validation - further processing might be needed
                    break;
                default:
                    // Handle unknown types in descriptor if necessary
                    throw new Error(`Unknown type "${descriptor.type}" specified in shapeDescriptor for key "${key}".`);
            }
        }
    }

    // Note: Keys present in parsedData but not in shapeDescriptor are currently ignored.

    return result;
};
