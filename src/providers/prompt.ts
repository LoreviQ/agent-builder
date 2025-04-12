import { Provider } from "../types";

export const promptProvider = (prompt: string): Provider => ({
    type: 'prompt',
    index: Number.POSITIVE_INFINITY,
    execute: async () => prompt
});