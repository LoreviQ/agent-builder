export type ProviderType = 'system' | 'prompt';

export type Provider = {
    type: ProviderType;
    index: number;
    title?: string;
    execute: () => Promise<string>;
};