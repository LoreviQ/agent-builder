import { Provider, ProviderType, AgentBuilderSettings } from "./types";
import { promptProvider } from "./providers";
import { joinWithNewlines } from "./utils";


const defaultSettings: AgentBuilderSettings = {
    endPromptString: "**OUTPUT**"
};

export class AgentBuilder {
    private providers: Map<string, Provider> = new Map();
    private settings: AgentBuilderSettings;

    constructor(prompt: string, settings?: AgentBuilderSettings) {
        this.settings = { ...defaultSettings, ...settings };
        const initialProvider = promptProvider(prompt);
        this.providers.set(initialProvider.key, initialProvider);
    }

    addProvider(provider: Provider): this {
        if (this.providers.has(provider.key)) {
            throw new Error(`Provider with key "${provider.key}" already exists.`);
        }
        this.providers.set(provider.key, provider);
        return this;
    }

    setProvider(key: string, provider: Provider): this {
        this.providers.set(key, provider);
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

    async prompt(): Promise<string> {
        const providerContent = await this.executeProviders('prompt');
        return joinWithNewlines([providerContent, this.settings.endPromptString]);
    }

    async system(): Promise<string> {
        const providerContent = await this.executeProviders('system');
        return providerContent ?? "";
    }
}