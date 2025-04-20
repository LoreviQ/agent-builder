import { Provider } from "../types";

/**
 * Provider that returns the provided prompt, guaranteed to be the first in the prompt.
 */
export const promptProvider = (prompt: string, actionKey: string = 'reply'): Provider => ({
    key: "prompt",
    type: 'prompt',
    order: Number.NEGATIVE_INFINITY,
    actionKey,
    execute: async () => prompt
});

/**
 * Provider that returns the provided system message, guaranteed to be the first in the systemInstructions.
 */
export const systemProvider = (system: string, actionKey: string = 'reply'): Provider => ({
    key: "system",
    type: 'system',
    order: Number.NEGATIVE_INFINITY,
    actionKey,
    execute: async () => system
});

/**
 * Provider that returns the provided suffix, guaranteed to be the last in the prompt.
 */
export const promptSuffixProvider = (suffix: string, actionKey: string = 'reply'): Provider => ({
    key: "promptSuffix",
    type: 'prompt',
    order: Number.POSITIVE_INFINITY,
    actionKey,
    execute: async () => suffix
});

/**
 * Provider that returns the provided suffix, guaranteed to be the last in the systemInstructions.
 */
export const systemSuffixProvider = (suffix: string, actionKey: string = 'reply'): Provider => ({
    key: "systemSuffix",
    type: 'system',
    order: Number.POSITIVE_INFINITY,
    actionKey,
    execute: async () => suffix
});
