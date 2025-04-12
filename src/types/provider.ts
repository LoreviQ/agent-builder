export type ProviderType = 'system' | 'prompt';

export type Provider = {
    type: ProviderType;
    title: string;
    execute: () => Promise<string>;
};