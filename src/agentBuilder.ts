import { Provider, ProviderType, AgentBuilderSettings, ShapeDescriptor } from "./types";
import { promptProvider, outputProvider, outputReminder } from "./providers";
import { joinWithNewlines } from "./utils";
import { generateResponse as generateTextResponse } from "./genai";
import { processOutput } from "./processing/output";


const defaultSettings: AgentBuilderSettings = {
    endPromptString: "# OUTPUT",
    model: "gemini-2.0-flash",
    debug: false,
};

/**
 * Builds and executes AI agent prompts by assembling content from various providers.
 * Allows for structured prompt generation, system message definition, and optional
 * typed output processing.
 */
export class AgentBuilder {
    private providers: Map<string, Provider> = new Map();
    private settings: AgentBuilderSettings;
    private outputShape: ShapeDescriptor | null = null;

    /**
     * Creates a new AgentBuilder instance.
     * @param prompt The initial base prompt content.
     * @param settings Optional settings to override defaults.
     */
    constructor(prompt: string, settings?: AgentBuilderSettings) {
        console.log("Creating a new AgentBuilder instance");
        this.settings = { ...defaultSettings, ...settings };
        const initialProvider = promptProvider(prompt);
        this.providers.set(initialProvider.key, initialProvider);
    }

    /**
     * Adds a new provider to the agent. Throws an error if a provider with the same key already exists.
     * @param provider The provider instance to add.
     * @param key Optional explicit key for the provider. If not provided, `provider.key` is used.
     * @returns The AgentBuilder instance for chaining.
     * @throws Error if a provider with the specified key already exists.
     */
    addProvider(provider: Provider, key?: string): this {
        let providerKey = key ?? provider.key;
        if (this.providers.has(providerKey)) {
            throw new Error(`Provider with key "${providerKey}" already exists.`);
        }
        this.providers.set(providerKey, provider);
        return this;
    }

    /**
     * Adds or updates a provider in the agent. If a provider with the same key exists, it will be overwritten.
     * @param provider The provider instance to add or update.
     * @param key Optional explicit key for the provider. If not provided, `provider.key` is used.
     * @returns The AgentBuilder instance for chaining.
     */
    setProvider(provider: Provider, key?: string): this {
        let providerKey = key ?? provider.key;
        this.providers.set(providerKey, provider);
        return this;
    }

    /**
     * Deletes a provider from the agent by its key. Does nothing if the key doesn't exist.
     * @param key The key of the provider to delete.
     * @returns The AgentBuilder instance for chaining.
     */
    deleteProvider(key: string): this {
        this.providers.delete(key);
        return this;
    }

    // Formats provider content into a string
    private formatProviderContent(content: string, title?: string): string {
        if (title) {
            return `# ${title}\n${content}`;
        }
        return content;
    }

    private async executeProviders(type: ProviderType): Promise<string | undefined> {
        // Filter providers by type
        const filteredProviders = Array.from(this.providers.values()).filter(provider => provider.type === type);
        if (filteredProviders.length === 0) {
            return undefined;
        }

        // Sort providers by index
        filteredProviders.sort((a, b) => b.index - a.index);

        // Execute providers
        const results = await Promise.all(
            filteredProviders.map(async (provider) => {
                try {
                    const content = await provider.execute();
                    return this.formatProviderContent(content, provider.title);
                } catch (error) {
                    console.error(`Error executing provider "${provider.title}":`, error);
                    return undefined; // Skip failed providers
                }
            })
        );

        return joinWithNewlines(results.filter(result => result !== undefined));
    }

    /**
     * Configures the agent to expect a specific JSON output shape.
     * Adds providers to guide the AI model and automatically parses the response.
     * @param shapeDescriptor An object describing the expected JSON structure, types, and descriptions. If not provided, the output shape is removed.
     * @returns The AgentBuilder instance for chaining.
     */
    setOutput(shapeDescriptor?: ShapeDescriptor): this {
        if (!shapeDescriptor) {
            this.deleteProvider('outputShape');
            this.deleteProvider('outputReminder');
            this.outputShape = null;
            return this;
        }
        this.setProvider(outputProvider(shapeDescriptor), 'outputShape');
        this.setProvider(outputReminder(shapeDescriptor), 'outputReminder');
        this.outputShape = shapeDescriptor;
        return this;
    }

    /**
     * Asynchronously executes all 'prompt' type providers and formats them into the final user prompt string.
     * @returns A promise that resolves to the fully assembled user prompt string.
     */
    async prompt(): Promise<string> {
        const providerContent = await this.executeProviders('prompt');
        const prompt = joinWithNewlines([providerContent, this.settings.endPromptString]);
        if (this.settings.debug) {
            console.log("Prompt:", prompt);
        }
        return prompt;
    }

    /**
     * Asynchronously executes all 'system' type providers and formats them into the final system instruction string.
     * @returns A promise that resolves to the fully assembled system instruction string, or an empty string if no system providers exist.
     */
    async system(): Promise<string> {
        const providerContent = await this.executeProviders('system');
        const system = providerContent ?? "";
        if (this.settings.debug) {
            console.log("System Instruction:", system);
        }
        return system;
    }

    /**
     * Generates the final prompt and system instructions, sends them to the AI model,
     * and processes the response.
     * If `setOutput` was called, it attempts to parse the response according to the specified shape.
     * Otherwise, it returns the raw text response.
     * @returns A promise that resolves to the AI model's response, either as a raw string or a parsed object.
     */
    async generateResponse(): Promise<string | Record<string, any>> {
        if (this.settings.debug) {
            console.log("Generating a response");
        }
        const systemInstruction = await this.system();
        const userPrompt = await this.prompt();
        const response = await generateTextResponse(userPrompt, this.settings.model!, systemInstruction);
        if (!this.outputShape) {
            return response;
        }
        if (this.settings.debug) {
            console.log("Raw Response:", response);
        }
        const processed_response = processOutput(this.outputShape, response);
        if (this.settings.debug) {
            console.log("Processed Response:", processed_response);
        }
        return processed_response;
    }
}