export type ProviderType = 'system' | 'prompt';

export type Provider = {
    key: string;
    type: ProviderType;
    order: number;
    actionKey?: string; // Added: Link provider to a specific action
    title?: string;
    execute: () => Promise<string>;
};