export type ProviderType = 'system' | 'prompt';

export type Provider = {
    key: string;
    type: ProviderType;
    index: number;
    title?: string;
    execute: () => Promise<string>;
};