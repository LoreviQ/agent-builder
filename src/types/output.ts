export type FieldDescriptor = {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array'; // Extend as needed
    description: string;
}

/**
 * Describes the desired shape and types for structured output or input.
 * It's a record where keys are the property names and values are FieldDescriptors.
 */
export type ShapeDescriptor = Record<string, FieldDescriptor>;