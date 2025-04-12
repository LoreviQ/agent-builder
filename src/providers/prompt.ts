import { Provider } from "../types";

/**
 * Provider that returns the provided prompt, guaranteed to be the first in the prompt.
 */
export const promptProvider = (prompt: string): Provider => ({
    key: "prompt",
    type: 'prompt',
    index: Number.POSITIVE_INFINITY,
    execute: async () => prompt
});

/**
 * Provider that returns the provided system message, guaranteed to be the first in the systemInstructions.
 */
export const systemProvider = (system: string): Provider => ({
    key: "system",
    type: 'system',
    index: Number.POSITIVE_INFINITY,
    execute: async () => system
});

/**
 * Provider that returns the provided suffix, guaranteed to be the last in the prompt.
 */
export const promptSuffixProvider = (suffix: string): Provider => ({
    key: "promptSuffix",
    type: 'prompt',
    index: Number.NEGATIVE_INFINITY,
    execute: async () => suffix
});

/**
 * Provider that returns the provided suffix, guaranteed to be the last in the systemInstructions.
 */
export const systemSuffixProvider = (suffix: string): Provider => ({
    key: "systemSuffix",
    type: 'system',
    index: Number.NEGATIVE_INFINITY,
    execute: async () => suffix
});
