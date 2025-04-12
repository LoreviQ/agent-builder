import { Provider, ProviderType, AgentBuilderSettings } from "./types";
import { promptProvider } from "./providers";
import { joinWithNewlines } from "./utils";


const defaultSettings: AgentBuilderSettings = {
    endPromptString: "**OUTPUT**"
};

export class AgentBuilder {
    private providers: Provider[] = [];
    private settings: AgentBuilderSettings;

    constructor(prompt: string, settings?: AgentBuilderSettings) {
        this.settings = { ...defaultSettings, ...settings };
        this.providers.push(promptProvider(prompt));
    }

    addProvider(provider: Provider): this {
        this.providers.push(provider);
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
        const filteredProviders = this.providers.filter(provider => provider.type === type);
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