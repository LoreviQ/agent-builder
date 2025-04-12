import { AgentBuilder } from '../agentBuilder';
import { systemProvider, promptSuffixProvider, systemSuffixProvider } from '../providers';
import { Provider, ShapeDescriptor } from '../types';
import { joinWithNewlines } from '../utils';
import * as genai from '../genai';
import * as processing from '../processing/output';

jest.mock('../genai');
jest.mock('../processing/output');

const mockGenerateTextResponse = genai.generateResponse as jest.Mock;
const mockProcessOutput = processing.processOutput as jest.Mock;

describe('AgentBuilder', () => {
    const initialPrompt = "Initial Prompt";
    const defaultEndPromptString = "**OUTPUT**";

    beforeEach(() => {
        mockGenerateTextResponse.mockReset();
        mockProcessOutput.mockReset();
    });

    const sampleShapeDescriptor: ShapeDescriptor = {
        characterName: { type: 'string', description: 'Name' },
        level: { type: 'number', description: 'Level' },
    };

    it('should initialize with a default prompt and default settings', async () => {
        const builder = new AgentBuilder(initialPrompt);
        expect(await builder.prompt()).toBe(`${initialPrompt}\n\n${defaultEndPromptString}`);
        expect(await builder.system()).toBe("");
    });

    it('should initialize with a default prompt and custom settings', async () => {
        const customEndPromptString = "CUSTOM_OUTPUT";
        const builder = new AgentBuilder(initialPrompt, { endPromptString: customEndPromptString });
        expect(await builder.prompt()).toBe(`${initialPrompt}\n\n${customEndPromptString}`);
        expect(await builder.system()).toBe("");
    });

    it('should return the correct system message when a system provider is added', async () => {
        const systemMessage = "System Message";
        const builder = new AgentBuilder(initialPrompt);
        builder.addProvider(systemProvider(systemMessage));

        expect(await builder.prompt()).toBe(`${initialPrompt}\n\n${defaultEndPromptString}`);
        expect(await builder.system()).toBe(systemMessage);
    });

    it('should format and join prompt providers in ascending order of index', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const provider1: Provider = { key: "p1", type: 'prompt', index: 10, title: "Provider 1", execute: async () => "Content 1" };
        const provider2: Provider = { key: "p2", type: 'prompt', index: 5, title: "Provider 2", execute: async () => "Content 2" };
        const provider3: Provider = { key: "p3", type: 'prompt', index: 20, execute: async () => "Content 3 No Title" }; // No title

        builder.addProvider(provider1);
        builder.addProvider(provider2);
        builder.addProvider(provider3);
        builder.addProvider(promptSuffixProvider("Suffix Content"));

        const expectedPrompt = joinWithNewlines([
            initialPrompt,
            "Content 3 No Title",
            "**Provider 1**\nContent 1",
            "**Provider 2**\nContent 2",
            "Suffix Content",
            defaultEndPromptString
        ]);

        expect(await builder.prompt()).toBe(expectedPrompt);
    });

    it('should format and join system providers in ascending order of index', async () => {
        const initialSystem = "Initial System";
        const builder = new AgentBuilder(initialPrompt);

        const provider1: Provider = { key: "s1", type: 'system', index: 15, title: "System Provider 1", execute: async () => "System Content 1" };
        const provider2: Provider = { key: "s2", type: 'system', index: 2, title: "System Provider 2", execute: async () => "System Content 2" };

        builder.addProvider(provider1);
        builder.addProvider(provider2);
        builder.addProvider(systemProvider(initialSystem));
        builder.addProvider(systemSuffixProvider("System Suffix"));

        const expectedSystem = joinWithNewlines([
            initialSystem,
            "**System Provider 1**\nSystem Content 1",
            "**System Provider 2**\nSystem Content 2",
            "System Suffix"
        ]);

        expect(await builder.system()).toBe(expectedSystem);
    });

    it('should handle a mix of prompt and system providers correctly', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const systemMessage = "Base System Message";

        const promptProvider1: Provider = { key: "p1", type: 'prompt', index: 1, title: "Prompt 1", execute: async () => "Prompt Content 1" };
        const systemProvider1: Provider = { key: "s1", type: 'system', index: 1, title: "System 1", execute: async () => "System Content 1" };

        builder.addProvider(systemProvider(systemMessage));
        builder.addProvider(promptProvider1);
        builder.addProvider(systemProvider1);

        const expectedPrompt = joinWithNewlines([
            initialPrompt,
            "**Prompt 1**\nPrompt Content 1",
            defaultEndPromptString
        ]);

        const expectedSystem = joinWithNewlines([
            systemMessage,
            "**System 1**\nSystem Content 1",
        ]);

        expect(await builder.prompt()).toBe(expectedPrompt);
        expect(await builder.system()).toBe(expectedSystem);
    });

    it('should handle provider execution errors gracefully', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const errorProvider: Provider = {
            key: "error",
            type: 'prompt',
            index: 1,
            title: "Error Provider",
            execute: async () => { throw new Error("Provider failed"); }
        };
        const workingProvider: Provider = { key: "work", type: 'prompt', index: 2, title: "Working Provider", execute: async () => "Working Content" };

        // Mock console.error to suppress error output during test
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        builder.addProvider(errorProvider);
        builder.addProvider(workingProvider);

        const expectedPrompt = joinWithNewlines([
            initialPrompt,
            "**Working Provider**\nWorking Content",
            defaultEndPromptString
        ]);

        expect(await builder.prompt()).toBe(expectedPrompt);
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error executing provider "Error Provider":', expect.any(Error));

        // Restore console.error
        consoleErrorSpy.mockRestore();
    });

    it('should add a new provider using setProvider', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const newProvider: Provider = { key: "newKey", type: 'prompt', index: 1, title: "New Provider", execute: async () => "New Content" };

        builder.setProvider(newProvider, "newKey");

        const expectedPrompt = joinWithNewlines([
            initialPrompt,
            "**New Provider**\nNew Content",
            defaultEndPromptString
        ]);
        expect(await builder.prompt()).toBe(expectedPrompt);
    });

    it('should overwrite an existing provider using setProvider', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const originalProvider: Provider = { key: "originalKey", type: 'prompt', index: 1, title: "Original Provider", execute: async () => "Original Content" };
        const updatedProvider: Provider = { key: "originalKey", type: 'prompt', index: 2, title: "Updated Provider", execute: async () => "Updated Content" };

        builder.addProvider(originalProvider); // Add the original provider first
        builder.setProvider(updatedProvider, "originalKey"); // Overwrite with setProvider

        const expectedPrompt = joinWithNewlines([
            initialPrompt,
            "**Updated Provider**\nUpdated Content",
            defaultEndPromptString
        ]);
        expect(await builder.prompt()).toBe(expectedPrompt);
    });

    it('should throw an error when adding a provider with a duplicate key using addProvider', () => {
        const builder = new AgentBuilder(initialPrompt);
        const provider1: Provider = { key: "duplicateKey", type: 'prompt', index: 1, execute: async () => "Content 1" };
        const provider2: Provider = { key: "duplicateKey", type: 'prompt', index: 2, execute: async () => "Content 2" };

        builder.addProvider(provider1);

        expect(() => builder.addProvider(provider2)).toThrow('Provider with key "duplicateKey" already exists.');
    });

    it('should add a provider with an explicit key using addProvider', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const provider: Provider = { key: "internalKey", type: 'prompt', index: 1, title: "Explicit Key Provider", execute: async () => "Explicit Content" };
        const explicitKey = "providedKey";

        builder.addProvider(provider, explicitKey);

        const expectedPrompt = joinWithNewlines([
            initialPrompt,
            "**Explicit Key Provider**\nExplicit Content",
            defaultEndPromptString
        ]);
        expect(await builder.prompt()).toBe(expectedPrompt);

        // Ensure the provider was stored under the explicit key, not the internal one
        const duplicateProvider: Provider = { key: "anotherInternalKey", type: 'prompt', index: 2, execute: async () => "Duplicate Content" };
        expect(() => builder.addProvider(duplicateProvider, explicitKey)).toThrow(`Provider with key "${explicitKey}" already exists.`);
        // Should not throw if using the internal key of the original provider
        expect(() => builder.addProvider(duplicateProvider, "internalKey")).not.toThrow();
    });

    it('should delete an existing provider', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const providerToDelete: Provider = { key: "toDelete", type: 'prompt', index: 1, title: "To Delete", execute: async () => "Delete Content" };
        const remainingProvider: Provider = { key: "toKeep", type: 'prompt', index: 2, title: "To Keep", execute: async () => "Keep Content" };

        builder.addProvider(providerToDelete);
        builder.addProvider(remainingProvider);

        // Verify both are present initially
        let expectedPrompt = joinWithNewlines([
            initialPrompt,
            "**To Keep**\nKeep Content",
            "**To Delete**\nDelete Content",
            defaultEndPromptString
        ]);
        expect(await builder.prompt()).toBe(expectedPrompt);

        // Delete one provider
        builder.deleteProvider("toDelete");

        // Verify the deleted provider is gone
        expectedPrompt = joinWithNewlines([
            initialPrompt,
            "**To Keep**\nKeep Content",
            defaultEndPromptString
        ]);
        expect(await builder.prompt()).toBe(expectedPrompt);
    });

    it('should do nothing when deleting a non-existent provider', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const existingProvider: Provider = { key: "exists", type: 'prompt', index: 1, title: "Exists", execute: async () => "Exists Content" };

        builder.addProvider(existingProvider);

        const initialPromptContent = await builder.prompt();

        // Attempt to delete a key that doesn't exist
        builder.deleteProvider("nonExistentKey");

        // Verify the prompt content is unchanged
        expect(await builder.prompt()).toBe(initialPromptContent);
    });

    it('setOutput should add outputShape and outputReminder providers', async () => {
        const builder = new AgentBuilder(initialPrompt);
        builder.setOutput(sampleShapeDescriptor);

        const systemInstruction = await builder.system();
        const promptInstruction = await builder.prompt();

        // Check if system instructions contain the output shape description
        expect(systemInstruction).toContain('Output Shape');
        expect(systemInstruction).toContain('"characterName": "(string) Name"');
        expect(systemInstruction).toContain('"level": "(number) Level"');

        // Check if prompt instructions contain the output reminder
        expect(promptInstruction).toContain('Output Reminder');
        expect(promptInstruction).toContain('{"characterName" : string, "level" : number}');
        expect(promptInstruction).toContain(defaultEndPromptString); // Ensure end prompt string is still there
    });

    it('setOutput should remove outputShape and outputReminder providers when called with no arguments', async () => {
        const builder = new AgentBuilder(initialPrompt);

        // Set an initial shape
        builder.setOutput(sampleShapeDescriptor);

        // Verify providers are present
        let systemInstruction = await builder.system();
        let promptInstruction = await builder.prompt();
        expect(systemInstruction).toContain('Output Shape');
        expect(promptInstruction).toContain('Output Reminder');

        // Reset the output shape
        builder.setOutput(); // Call without arguments

        // Verify providers are removed
        systemInstruction = await builder.system();
        promptInstruction = await builder.prompt();
        expect(systemInstruction).not.toContain('Output Shape');
        expect(systemInstruction).not.toContain('"characterName": "(string) Name"');
        expect(promptInstruction).not.toContain('Output Reminder');
        expect(promptInstruction).not.toContain('{"characterName" : string, "level" : number}');

        // Ensure the base prompt and end string are still correct
        expect(await builder.prompt()).toBe(`${initialPrompt}\n\n${defaultEndPromptString}`);
        expect(await builder.system()).toBe(""); // Assuming no other system providers were added
    });

    it('generateResponse should return raw string if outputShape is not set', async () => {
        const builder = new AgentBuilder(initialPrompt);
        const rawResponse = "This is a raw response.";
        mockGenerateTextResponse.mockResolvedValue(rawResponse);

        const result = await builder.generateResponse();

        expect(result).toBe(rawResponse);
        expect(mockGenerateTextResponse).toHaveBeenCalled();
        expect(mockProcessOutput).not.toHaveBeenCalled();
    });

    it('generateResponse should call processOutput if outputShape is set', async () => {
        const builder = new AgentBuilder(initialPrompt);
        builder.setOutput(sampleShapeDescriptor);

        const rawResponse = '```json{"characterName": "Bob", "level": "5"}```';
        const processedResponse = { characterName: 'Bob', level: 5 };

        mockGenerateTextResponse.mockResolvedValue(rawResponse);
        mockProcessOutput.mockReturnValue(processedResponse); // Use mockReturnValue for sync mock

        const result = await builder.generateResponse();

        expect(result).toEqual(processedResponse);
        expect(mockGenerateTextResponse).toHaveBeenCalled();
        expect(mockProcessOutput).toHaveBeenCalledWith(sampleShapeDescriptor, rawResponse);
    });

    it('generateResponse should propagate errors from processOutput', async () => {
        const builder = new AgentBuilder(initialPrompt);
        builder.setOutput(sampleShapeDescriptor);

        const rawResponse = 'invalid json';
        const processingError = new Error('Failed to parse JSON');

        mockGenerateTextResponse.mockResolvedValue(rawResponse);
        mockProcessOutput.mockImplementation(() => { // Use mockImplementation to throw
            throw processingError;
        });

        await expect(builder.generateResponse()).rejects.toThrow(processingError);

        expect(mockGenerateTextResponse).toHaveBeenCalled();
        expect(mockProcessOutput).toHaveBeenCalledWith(sampleShapeDescriptor, rawResponse);
    });
});