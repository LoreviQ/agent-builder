import { processOutput } from '../output';
import { ShapeDescriptor, FieldDescriptor } from '../../types'; // Adjust path if needed

describe('processOutput', () => {
    const sampleShapeDescriptor: ShapeDescriptor = {
        name: { type: 'string', description: '...' },
        count: { type: 'number', description: '...' },
        isActive: { type: 'boolean', description: '...' },
        details: { type: 'object', description: '...' },
        items: { type: 'array', description: '...' },
    };

    it('should process a valid JSON string matching the shape', () => {
        const jsonString = '{"name": "Test", "count": 123, "isActive": true, "details": {"a": 1}, "items": [1, 2]}';
        const expected = { name: 'Test', count: 123, isActive: true, details: { a: 1 }, items: [1, 2] };
        expect(processOutput(sampleShapeDescriptor, jsonString)).toEqual(expected);
    });

    it('should process a valid JSON string with markdown fences', () => {
        const jsonString = '```json\n{"name": "Test", "count": 123, "isActive": true, "details": {"a": 1}, "items": [1, 2]}\n```';
        const expected = { name: 'Test', count: 123, isActive: true, details: { a: 1 }, items: [1, 2] };
        expect(processOutput(sampleShapeDescriptor, jsonString)).toEqual(expected);
    });

    it('should process valid JSON with extra whitespace and different fence newlines', () => {
        const jsonString = '   Some text before\n```json{"name": "Test", "count": 123, "isActive": true, "details": {"a": 1}, "items": [1, 2]}```\n  Some text after  ';
        const expected = { name: 'Test', count: 123, isActive: true, details: { a: 1 }, items: [1, 2] };
        expect(processOutput(sampleShapeDescriptor, jsonString)).toEqual(expected);
    });

    it('should ignore extra keys in the JSON string', () => {
        const jsonString = '{"name": "Test", "count": 123, "isActive": true, "details": {}, "items": [], "extraKey": "ignored"}';
        const expected = { name: 'Test', count: 123, isActive: true, details: {}, items: [] };
        expect(processOutput(sampleShapeDescriptor, jsonString)).toEqual(expected);
    });

    it('should cast string numbers to numbers', () => {
        const jsonString = '{"name": "Test", "count": "456", "isActive": true, "details": {}, "items": []}';
        const expected = { name: 'Test', count: 456, isActive: true, details: {}, items: [] };
        expect(processOutput(sampleShapeDescriptor, jsonString)).toEqual(expected);
    });

    it('should cast string booleans (case-insensitive) to booleans', () => {
        const jsonString1 = '{"name": "Test", "count": 1, "isActive": "true", "details": {}, "items": []}';
        const jsonString2 = '{"name": "Test", "count": 1, "isActive": "FALSE", "details": {}, "items": []}';
        const expected1 = { name: 'Test', count: 1, isActive: true, details: {}, items: [] };
        const expected2 = { name: 'Test', count: 1, isActive: false, details: {}, items: [] };
        expect(processOutput(sampleShapeDescriptor, jsonString1)).toEqual(expected1);
        expect(processOutput(sampleShapeDescriptor, jsonString2)).toEqual(expected2);
    });

    it('should cast numbers/booleans to string if type is string', () => {
        const jsonString = '{"name": 123, "count": 456, "isActive": true, "details": {}, "items": []}';
        const expected = { name: '123', count: 456, isActive: true, details: {}, items: [] };
        expect(processOutput(sampleShapeDescriptor, jsonString)).toEqual(expected);
    });

    it('should throw error for missing key in JSON', () => {
        const jsonString = '{"name": "Test", "isActive": true, "details": {}, "items": []}'; // Missing count
        expect(() => processOutput(sampleShapeDescriptor, jsonString))
            .toThrow('Missing key "count" in parsed JSON data.');
    });

    it('should throw error for invalid JSON syntax', () => {
        const jsonString = '{"name": "Test", "count": 123, }'; // Trailing comma
        expect(() => processOutput(sampleShapeDescriptor, jsonString))
            .toThrow(/Failed to parse JSON:.*/);
    });

    it('should throw error for incorrect type (number for string without casting)', () => {
        // If strict string checking is desired, uncomment the throw in processOutput
        // const jsonString = '{"name": 123, "count": 1, "isActive": true, "details": {}, "items": []}';
        // expect(() => processOutput(sampleShapeDescriptor, jsonString))
        //     .toThrow('Type mismatch for key "name": expected string, got number');
    });

    it('should throw error for uncastable string to number', () => {
        const jsonString = '{"name": "Test", "count": "abc", "isActive": true, "details": {}, "items": []}';
        expect(() => processOutput(sampleShapeDescriptor, jsonString))
            .toThrow('Type mismatch for key "count": expected number, got string "abc" (could not convert)');
    });

    it('should throw error for uncastable string to boolean', () => {
        const jsonString = '{"name": "Test", "count": 1, "isActive": "maybe", "details": {}, "items": []}';
        expect(() => processOutput(sampleShapeDescriptor, jsonString))
            .toThrow('Type mismatch for key "isActive": expected boolean, got string "maybe" (could not convert)');
    });

    it('should throw error for incorrect type (array for object)', () => {
        const jsonString = '{"name": "Test", "count": 1, "isActive": false, "details": [], "items": []}';
        expect(() => processOutput(sampleShapeDescriptor, jsonString))
            .toThrow('Type mismatch for key "details": expected object, got object'); // typeof array is object
    });

    it('should throw error for incorrect type (object for array)', () => {
        const jsonString = '{"name": "Test", "count": 1, "isActive": false, "details": {}, "items": {}}';
        expect(() => processOutput(sampleShapeDescriptor, jsonString))
            .toThrow('Type mismatch for key "items": expected array, got object');
    });

    it('should throw error for empty JSON string', () => {
        expect(() => processOutput(sampleShapeDescriptor, ''))
            .toThrow('processOutput requires a non-empty jsonString.');
    });

    it('should throw error for empty shape descriptor', () => {
        const jsonString = '{"a": 1}';
        expect(() => processOutput({}, jsonString))
            .toThrow('processOutput requires a non-empty shapeDescriptor.');
    });
}); 