import { AgentBuilder } from '../agentBuilder';
import { systemProvider, promptSuffixProvider, systemSuffixProvider } from '../providers/prompt';
import { Provider } from '../types';
import { joinWithNewlines } from '../utils';
describe('AgentBuilder', () => {
    const initialPrompt = "Initial Prompt";
    const defaultEndPromptString = "**OUTPUT**";

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
});