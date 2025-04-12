# Agent Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript package for easily creating flexible and customizable AI agents to integrate into your own projects.

## Core Concepts

Agent Builder structures AI agents around four key components:

1.  **State:** Internal information held by the agent. This can include conversation history, goals, mood, memories, or any other data relevant to the agent's operation.
2.  **Providers:** Supply information *to* the agent's context window. This includes external data sources (APIs, databases, time of day), descriptions of the agent's role or capabilities, and potentially filtered parts of the agent's **State**. Careful management of Providers is crucial for controlling the context sent to the underlying language model.
3.  **Evaluators:** Represent the agent's reasoning, decision-making, and processing steps. Evaluators analyze the information from **Providers** and can modify the agent's **State** (e.g., updating goals, marking tasks complete) or decide to trigger **Actions**.
4.  **Actions:** Define the concrete capabilities of the agent – the things it can *do*. This could involve calling external APIs, sending messages, interacting with a file system, etc. Knowledge of available actions is typically given via a **Provider**, and the decision to execute an action comes from an **Evaluator**.

These components are designed to be modular, allowing developers to define and combine custom implementations for each part.

## Installation

This package is intended to be used as a dependency in your own projects.

1.  **Install:**
    ```bash
    npm install <your-package-name> 
    # Or: yarn add <your-package-name>
    # (Replace <your-package-name> with the actual published name)
    ```
    *Note: If you are developing locally, you might link the package or install it directly from its path.*

2.  **Build (if developing locally):**
    The package includes a build script:
    ```bash
    npm run build 
    ```
    This will compile the TypeScript code into the `dist` directory.

## Basic Usage (Conceptual)

```typescript
import { AgentBuilder } from 'agent-builder'; // Adjust import path as needed
import { myCustomStateProvider, myApiProvider, myGoalEvaluator, mySendMessageAction } from './myAgentComponents';

// 1. Initialize with a base prompt and model
const agent = new AgentBuilder(
    "You are a helpful assistant.", 
    "gemini-2.0-flash" // Or another supported model
);

// 2. Add providers (State, APIs, etc.)
agent.addProvider(myCustomStateProvider);
agent.addProvider(myApiProvider); 
// ... add more providers

// 3. Add evaluators (Decision making) - *Roadmap Feature*
// agent.addEvaluator(myGoalEvaluator); 

// 4. Add actions (Agent capabilities) - *Roadmap Feature*
// agent.addAction(mySendMessageAction);

// 5. Generate a response
async function runAgent() {
    try {
        const response = await agent.generateResponse();
        console.log("Agent Response:", response);

        // Future: Trigger evaluations and actions based on response/state
        // const evaluationResult = await agent.evaluate();
        // if (evaluationResult.actionToExecute) {
        //     await agent.executeAction(evaluationResult.actionToExecute);
        // }

    } catch (error) {
        console.error("Error running agent:", error);
    }
}

runAgent();
```

## Configuration

### Environment Variables

Certain functionalities, particularly those involving specific AI model providers, require environment variables to be set in the project *using* this package.

*   **`GEMINI_API_KEY`**: Required **only** when using Google Gemini models (e.g., `gemini-2.0-flash`, `gemini-2.5-pro-exp-03-25`). The agent will throw an error during response generation if a Google model is selected and this key is not found.

*Future model providers (e.g., Claude, OpenAI) will require their own respective API keys.*

You can manage environment variables using a `.env` file (with a library like `dotenv`) or by setting them directly in your deployment environment.

**.env example:**
```
GEMINI_API_KEY=your_google_api_key_here 
```

## Current Status & Roadmap

*   **Implemented:**
    *   Core `AgentBuilder` class structure.
    *   Provider system (`addProvider`, `setProvider`).
    *   Basic prompt generation (`prompt()`, `system()`).
    *   Response generation (`generateResponse()`) using Google Gemini models (requires `GEMINI_API_KEY`).
*   **Roadmap:**
    *   [ ] Implement **Evaluator** system.
    *   [ ] Implement **Action** system.
    *   [ ] Develop more sophisticated **State** management options.
    *   [ ] Add support for additional LLM providers (e.g., Anthropic Claude, OpenAI GPT).
    *   [ ] Implement more built-in Providers, Evaluators, and Actions.
    *   [ ] Add comprehensive testing.
    *   [ ] Publish to npm.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details (though a LICENSE file doesn't exist yet, this indicates the intent).

## Contributing

Contributions are welcome! Please feel free to open issues or submit pull requests. (Add contribution guidelines later). 