import { Provider, ProviderType, AgentBuilderSettings, ShapeDescriptor } from "./types";
import { promptProvider, outputProvider, outputReminder } from "./providers";
import { joinWithNewlines } from "./utils";
import { generateResponse as generateTextResponse } from "./genai";
import { processOutput } from "./processing/output";


const defaultSettings: AgentBuilderSettings = {
    endPromptString: "**OUTPUT**",
    model: "gemini-2.0-flash"
};

export class AgentBuilder {
    private providers: Map<string, Provider> = new Map();
    private settings: AgentBuilderSettings;
    private outputShape: ShapeDescriptor | null = null;

    constructor(prompt: string, settings?: AgentBuilderSettings) {
        this.settings = { ...defaultSettings, ...settings };
        const initialProvider = promptProvider(prompt);
        this.providers.set(initialProvider.key, initialProvider);
    }

    addProvider(provider: Provider, key?: string): this {
        let providerKey = key ?? provider.key;
        if (this.providers.has(providerKey)) {
            throw new Error(`Provider with key "${providerKey}" already exists.`);
        }
        this.providers.set(providerKey, provider);
        return this;
    }

    setProvider(provider: Provider, key?: string): this {
        let providerKey = key ?? provider.key;
        this.providers.set(providerKey, provider);
        return this;
    }

    // Formats provider content into a string
    private formatProviderContent(content: string, title?: string): string {
        if (title) {
            return `**${title}**\n${content}`;
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

    setOutput(shapeDescriptor: ShapeDescriptor): this {
        this.setProvider(outputProvider(shapeDescriptor), 'outputShape');
        this.setProvider(outputReminder(shapeDescriptor), 'outputReminder');
        this.outputShape = shapeDescriptor;
        return this;
    }

    async prompt(): Promise<string> {
        const providerContent = await this.executeProviders('prompt');
        return joinWithNewlines([providerContent, this.settings.endPromptString]);
    }

    async system(): Promise<string> {
        const providerContent = await this.executeProviders('system');
        return providerContent ?? "";
    }

    async generateResponse(): Promise<string | Record<string, any>> {
        const systemInstruction = await this.system();
        const userPrompt = await this.prompt();

        const response = await generateTextResponse(userPrompt, this.settings.model!, systemInstruction);
        if (!this.outputShape) {
            return response;
        }
        // TODO: Handle graceful errors (repeat query ideally)
        return processOutput(this.outputShape, response);
    }
}