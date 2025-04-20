export type ProviderType = 'system' | 'prompt';

export type Provider = {
    key: string;
    type: ProviderType;
    order: number;
    title?: string;
    execute: () => Promise<string>;
};