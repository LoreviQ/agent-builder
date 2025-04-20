import type { Action } from '../types';
import { generateResponse } from '../genai';
import { processOutput } from '../processing/output';

/**
 * The default action that generates a response from the LLM based on the agent's current state.
 */
export const replyAction: Action = {
    key: 'reply',
    title: 'Reply to User',
    enabled: true, 
    order: 0,
    execute: async (agent, params?: any) => {
        // TODO: Use params to potentially override model, etc.

        const systemInstruction = await agent.system();
        const userPrompt = await agent.prompt();
        const rawResponse = await generateResponse(userPrompt, agent.settings.model!, systemInstruction);

        if (!agent.outputShape) {
            return rawResponse;
        }
        try {
            return processOutput(agent.outputShape, rawResponse);
        } catch (error) {
            console.error("Error processing LLM output in replyAction:", error);
            // Fallback to raw response if processing fails
            return rawResponse;
        }
    },
};
