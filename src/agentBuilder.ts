import { Provider, ProviderType, AgentSettings, ShapeDescriptor, Action } from "./types";
import { promptProvider, outputProvider, outputReminder } from "./providers";
import { joinWithNewlines } from "./utils";
import { replyAction } from "./actions";

const defaultSettings: AgentSettings = {
    endPromptString: "# OUTPUT",
    model: "gemini-2.0-flash",
    debug: false,
};

/**
 * Builds and executes AI agent prompts by assembling content from various providers
 * and executing defined actions based on the generated response.
 */
export class Agent {
    private providers: Map<string, Provider> = new Map();
    private actions: Map<string, Action> = new Map();
    settings: AgentSettings;
    outputShape: ShapeDescriptor | null = null;

    /**
     * Creates a new Agent instance.
     * @param prompt The initial base prompt content.
     * @param settings Optional settings to override defaults.
     */
    constructor(prompt: string, settings?: AgentSettings) {
        console.log("Creating a new Agent instance");
        this.settings = { ...defaultSettings, ...settings };
        const initialProvider = promptProvider(prompt);
        this.providers.set(initialProvider.key, initialProvider);
        this.actions.set(replyAction.key, replyAction);
    }

    /**
     * Adds a new provider to the agent. Throws an error if a provider with the same key already exists.
     * @param provider The provider instance to add.
     * @param key Optional explicit key for the provider. If not provided, `provider.key` is used.
     * @returns The Agent instance for chaining.
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
     * @returns The Agent instance for chaining.
     */
    setProvider(provider: Provider, key?: string): this {
        let providerKey = key ?? provider.key;
        this.providers.set(providerKey, provider);
        return this;
    }

    /**
     * Deletes a provider from the agent by its key. Does nothing if the key doesn't exist.
     * @param key The key of the provider to delete.
     * @returns The Agent instance for chaining.
     */
    deleteProvider(key: string): this {
        this.providers.delete(key);
        return this;
    }

    /**
     * Adds a new action to the agent. Throws an error if an action with the same key already exists.
     * @param action The action instance to add.
     * @param key Optional explicit key for the action. If not provided, `action.key` is used.
     * @returns The Agent instance for chaining.
     * @throws Error if an action with the specified key already exists.
     */
    addAction(action: Action, key?: string): this {
        let actionKey = key ?? action.key;
        if (this.actions.has(actionKey)) {
            throw new Error(`Action with key "${actionKey}" already exists.`);
        }
        this.actions.set(actionKey, { ...action, enabled: action.enabled ?? true });
        return this;
    }

    /**
     * Adds or updates an action in the agent. If an action with the same key exists, it will be overwritten.
     * @param action The action instance to add or update.
     * @param key Optional explicit key for the action. If not provided, `action.key` is used.
     * @returns The Agent instance for chaining.
     */
    setAction(action: Action, key?: string): this {
        let actionKey = key ?? action.key;
        this.actions.set(actionKey, { ...action, enabled: action.enabled ?? true });
        return this;
    }

    /**
     * Deletes an action from the agent by its key. Does nothing if the key doesn't exist.
     * @param key The key of the action to delete.
     * @returns The Agent instance for chaining.
     */
    deleteAction(key: string): this {
        this.actions.delete(key);
        return this;
    }

    /**
     * Enables or disables an action.
     * @param key The key of the action to enable/disable.
     * @param enabled The desired state (true for enabled, false for disabled).
     * @returns The Agent instance for chaining.
     * @throws Error if the action key does not exist.
     */
    toggleAction(key: string, enabled: boolean): this {
        const action = this.actions.get(key);
        if (!action) {
            throw new Error(`Action with key "${key}" not found.`);
        }
        action.enabled = enabled;
        this.actions.set(key, action);
        return this;
    }

    // Formats provider content into a string
    private formatProviderContent(content: string, title?: string): string {
        if (title) {
            return `# ${title}\n${content}`;
        }
        return content;
    }

    // Modified executeProviders to filter by actionKey
    private async executeProviders(type: ProviderType, actionKey: string): Promise<string | undefined> {
        const filteredProviders = Array.from(this.providers.values())
            .filter(provider =>
                provider.type === type &&
                (provider.actionKey === actionKey || provider.actionKey === undefined)
            );
        if (filteredProviders.length === 0) {
            return undefined;
        }

        filteredProviders.sort((a, b) => a.order - b.order);

        const results = await Promise.all(
            filteredProviders.map(async (provider) => {
                try {
                    const content = await provider.execute();
                    return this.formatProviderContent(content, provider.title);
                } catch (error) {
                    console.error(`Error executing provider "${provider.title ?? provider.key}":`, error);
                    return undefined;
                }
            })
        );

        return joinWithNewlines(results.filter(result => result !== undefined));
    }

    /**
     * Configures the agent to expect a specific JSON output shape for the 'reply' action.
     * Adds providers to guide the AI model and automatically parses the response.
     * @param shapeDescriptor An object describing the expected JSON structure, types, and descriptions. If not provided, the output shape is removed.
     * @returns The Agent instance for chaining.
     */
    setOutput(shapeDescriptor?: ShapeDescriptor): this {
        const actionKey = 'reply';
        if (!shapeDescriptor) {
            this.deleteProvider('outputShape');
            this.deleteProvider('outputReminder');
            this.outputShape = null;
            return this;
        }
        this.setProvider(outputProvider(shapeDescriptor, 100, actionKey), 'outputShape');
        this.setProvider(outputReminder(shapeDescriptor, 100, actionKey), 'outputReminder');
        this.outputShape = shapeDescriptor;
        return this;
    }

    /**
     * Asynchronously executes 'prompt' type providers for a specific action and formats them into the final user prompt string.
     * @param actionKey The key of the action for which to generate the prompt. Defaults to 'reply'.
     * @returns A promise that resolves to the fully assembled user prompt string.
     */
    async prompt(actionKey: string = 'reply'): Promise<string> {
        const providerContent = await this.executeProviders('prompt', actionKey);
        const prompt = joinWithNewlines([providerContent, this.settings.endPromptString]);
        if (this.settings.debug) {
            console.log(`Prompt (Action: ${actionKey}):`, prompt);
        }
        return prompt;
    }

    /**
     * Asynchronously executes 'system' type providers for a specific action and formats them into the final system instruction string.
     * @param actionKey The key of the action for which to generate the system instructions. Defaults to 'reply'.
     * @returns A promise that resolves to the fully assembled system instruction string, or an empty string if no matching system providers exist.
     */
    async system(actionKey: string = 'reply'): Promise<string> {
        const providerContent = await this.executeProviders('system', actionKey);
        const system = providerContent ?? "";
        if (this.settings.debug) {
            console.log(`System Instruction (Action: ${actionKey}):`, system);
        }
        return system;
    }

    /**
     * Executes all enabled actions sequentially.
     *
     * The specific logic for each action (e.g., calling an LLM, interacting with an API)
     * is defined within the action's `execute` method.
     *
     * @returns A promise that resolves to an object containing the results of each executed action,
     *          keyed by the action's key.
     */
    async execute(): Promise<Record<string, any>> {
        const actionResults: Record<string, any> = {};
        const enabledActions = Array.from(this.actions.values())
            .filter(action => action.enabled)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        for (const action of enabledActions) {
            try {
                const result = await action.execute(this, undefined);
                actionResults[action.key] = result;
            } catch (error) {
                console.error(`Error executing action "${action.title ?? action.key}":`, error);
                actionResults[action.key] = { error: `Action failed: ${error instanceof Error ? error.message : String(error)}` };
            }
        }

        if (this.settings.debug) {
            console.log("Action Results:", actionResults);
        }

        return actionResults;
    }
}