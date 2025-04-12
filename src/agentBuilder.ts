import { Provider } from "./types";
import { AgentBuilderSettings } from "./types/agentBuilder";

const defaultSettings: AgentBuilderSettings = {
    endPromptString: "**OUTPUT**"
};

export class AgentBuilder {
    private providers: Provider[] = [];
    private settings: AgentBuilderSettings;

    constructor(settings: AgentBuilderSettings) {
        this.settings = { ...defaultSettings, ...settings };
    }

    addProvider(provider: Provider): this {
        this.providers.push(provider);
        return this;
    }
}