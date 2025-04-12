import { outputProvider, outputReminder } from '../output';
import { ShapeDescriptor } from '../../types';

describe('outputProvider', () => {
    const sampleShapeDescriptor: ShapeDescriptor = {
        name: { type: 'string', description: 'The name of the item.' },
        count: { type: 'number', description: 'How many items there are.' },
        isActive: { type: 'boolean', description: 'Whether the item is active.' },
    };

    const expectedKeyCount = Object.keys(sampleShapeDescriptor).length;

    it('should return a provider object with correct defaults', () => {
        const provider = outputProvider(sampleShapeDescriptor);
        expect(provider.key).toBe('outputShape');
        expect(provider.type).toBe('system');
        expect(provider.title).toBe('Output Shape');
        expect(provider.index).toBe(-100); // Default index
    });

    it('should return a provider object with the specified index', () => {
        const customIndex = 50;
        const provider = outputProvider(sampleShapeDescriptor, customIndex);
        expect(provider.index).toBe(customIndex);
    });

    it('should return execute function that produces the correct description string', async () => {
        const provider = outputProvider(sampleShapeDescriptor);
        const result = await provider.execute();

        // Check overall structure
        expect(result).toContain(`exactly ${expectedKeyCount} keys in the shape:`);
        expect(result).toContain('```json');
        expect(result).toContain('{');
        expect(result).toContain('}');
        expect(result).toContain('```');

        // Check individual key descriptions
        expect(result).toContain('  "name": "(string) The name of the item."');
        expect(result).toContain('  "count": "(number) How many items there are."');
        expect(result).toContain('  "isActive": "(boolean) Whether the item is active."');

        // Check formatting (commas, newlines within the JSON block)
        const jsonBlockRegex = /```json\n{\n([^]+)\n}\n```/;
        const match = result.match(jsonBlockRegex);
        expect(match).toBeTruthy();
        if (match) {
            const jsonContent = match[1];
            const lines = jsonContent.split(',\n');
            expect(lines).toHaveLength(expectedKeyCount);
            expect(lines[0]).toBe('  "name": "(string) The name of the item."');
            expect(lines[1]).toBe('  "count": "(number) How many items there are."');
            expect(lines[2]).toBe('  "isActive": "(boolean) Whether the item is active."');
            // Ensure no trailing comma on the last line
            expect(lines[lines.length - 1]).not.toMatch(/,$/);
        }
    });

    it('should throw an error for an empty shape descriptor', () => {
        expect(() => {
            outputProvider({});
        }).toThrow('outputProvider requires a non-empty shapeDescriptor.');
    });
});

describe('outputReminder', () => {
    const sampleShapeDescriptor: ShapeDescriptor = {
        name: { type: 'string', description: 'Unused description' }, // Description is not used in the output string
        count: { type: 'number', description: 'Ignored' },
        isActive: { type: 'boolean', description: 'Also ignored' },
    };

    it('should return a provider object with correct defaults', () => {
        const provider = outputReminder(sampleShapeDescriptor);
        expect(provider.key).toBe('outputReminder');
        expect(provider.type).toBe('prompt'); // Should be prompt type
        expect(provider.title).toBe('Output Reminder');
        expect(provider.index).toBe(-100); // Default index
    });

    it('should return a provider object with the specified index', () => {
        const customIndex = 200;
        const provider = outputReminder(sampleShapeDescriptor, customIndex);
        expect(provider.index).toBe(customIndex);
    });

    it('should return execute function that produces the correct reminder string', async () => {
        const provider = outputReminder(sampleShapeDescriptor);
        const result = await provider.execute();

        // Define the expected compact JSON string part
        const expectedJsonString = '{"name" : string, "count" : number, "isActive" : boolean}';

        // Check if the result contains the base message and the specific JSON string
        expect(result).toBe(`Remember to provide the output strictly in the specified JSON format: ${expectedJsonString}`);
    });

    it('should throw an error for an empty shape descriptor', () => {
        // Use expect(...).toThrow() to check for the error
        expect(() => {
            outputReminder({});
        }).toThrow('outputReminder requires a non-empty shapeDescriptor.');
    });
}); 