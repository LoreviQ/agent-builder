import { Agent } from '../../agentBuilder';
import { generateResponse } from '../../genai';

// Mock the generateResponse function
jest.mock('../../genai', () => ({
    generateResponse: jest.fn().mockResolvedValue('Mocked AI Response'),
}));

describe('AgentBuilder Integration Tests', () => {
    test('should initialize, add providers, and generate a response via the reply action', async () => {
        const agent = new Agent('You are a test bot.');

        // Add a system provider
        agent.addProvider({
            key: 'role',
            type: 'system',
            index: 1,
            title: 'Role',
            execute: async () => 'Act as a helpful assistant.',
        });

        // Add a prompt provider
        agent.addProvider({
            key: 'task',
            type: 'prompt',
            index: 1,
            title: 'Task',
            execute: async () => 'Explain the concept of integration testing.',
        });

        // Execute the agent (which runs the default 'reply' action)
        const results = await agent.execute();

        // Get the reply action's result
        const response = results['reply'];

        // Assertions
        expect(response).toBe('Mocked AI Response');

        // Verify the mock was called with expected parameters
        const mockedGenerateResponse = generateResponse as jest.Mock;
        expect(mockedGenerateResponse).toHaveBeenCalledWith(
            expect.stringContaining('Explain the concept of integration testing.'),
            expect.any(String),
            expect.stringContaining('Act as a helpful assistant.')
        );
    });
});