import type { Agent } from '../agentBuilder';

/**
 * Defines the structure for an action that an agent can perform.
 */
export type Action = {
    /** A unique key identifying the action. */
    key: string;
    /** An optional descriptive title for the action. */
    title?: string;
    /** Whether the action is currently enabled for execution. Defaults to true. */
    enabled?: boolean;
    /**
     * The function to execute when the action is triggered.
     * @param agent The current Agent instance.
     * @param params Optional parameters passed to the action, determined by an evaluation step (future).
     * @returns A promise that resolves with the result of the action.
     */
    execute: (agent: Agent, params?: any) => Promise<any>;
};
