import { AgentBuilder } from '../../agentBuilder';
import { systemProvider, promptSuffixProvider, systemSuffixProvider } from '../../providers';
import { generateResponse } from '../../genai';

// --- Mocking the actual GenAI call --- 
jest.mock('../../genai', () => ({
    generateResponse: jest.fn().mockResolvedValue('Mocked AI Response'),
}));

describe('AgentBuilder Integration Tests', () => {
    it('should initialize, add providers, and generate a response', async () => {
        const agent = new AgentBuilder('Initial prompt content.');

        // Add providers
        agent.addProvider(systemProvider('System instruction content.'));
        agent.addProvider(promptSuffixProvider('Prompt suffix content.'));
        agent.addProvider(systemSuffixProvider('System suffix content.'));

        // Generate response (will use the mock)
        const response = await agent.execute();

        // Assertions
        expect(response).toBe('Mocked AI Response');

        // You could also check if the mock was called with the expected prompt/system instructions
        const mockedGenerateResponse = generateResponse as jest.Mock;
        expect(mockedGenerateResponse).toHaveBeenCalled();
        const [promptArg, modelArg, systemArg] = mockedGenerateResponse.mock.calls[0];

        // Check system instructions (order matters due to index)
        expect(systemArg).toContain('System instruction content.');
        expect(systemArg).toContain('System suffix content.');
        expect(systemArg.indexOf('System instruction content.')).toBeLessThan(systemArg.indexOf('System suffix content.'));

        // Check prompt (order matters due to index)
        expect(promptArg).toContain('Initial prompt content.');
        expect(promptArg).toContain('Prompt suffix content.');
        expect(promptArg.indexOf('Initial prompt content.')).toBeLessThan(promptArg.indexOf('Prompt suffix content.'));
        expect(promptArg).toContain('# OUTPUT');

    });
});