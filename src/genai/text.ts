import { GoogleGenAI } from "@google/genai";

// Module-level variable to hold the singleton instance
let googleClientSingleton: GoogleGenAI | null = null;
const googleClientInstance = () => {
    if (!googleClientSingleton) {
        // Check if the API key is set
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY environment variable is not set. Set GEMINI_API_KEY or use a different provider.");
        }
        // Initialize the singleton instance
        googleClientSingleton = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return googleClientSingleton;
}

// map of models to providers
const models_to_provider: Record<string, string> = {
    "gemini-2.0-flash": "google",
    "gemini-2.5-pro-exp-03-25": "google",
    // TODO: Add more models and providers
}

// adapter pattern for different providers and models
export async function generateResponse(prompt: string, model: string, systemInstruction: string = "") {
    let generatedContent: string;
    console.log(`Generating response for model: ${model}`);
    switch (models_to_provider[model]) {
        case "google":
            generatedContent = await googleGenerate(prompt, model, systemInstruction);
            break;
        default:
            throw new Error(`Unsupported model: ${model}`);
    }

    return generatedContent;
}

// uses google genai to generate a response
async function googleGenerate(prompt: string, model: string, systemInstruction: string = ""): Promise<string> {
    try {
        console.log(`Obtaining singleton instance of GoogleGenAI`);
        // Use the singleton instance
        const googleClient = googleClientInstance();
        const response = await googleClient.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction,
            },
        });
        console.log(`Response from Google GenAI: ${JSON.stringify(response)}`);
        if (!response.text) {
            throw new Error("No response from Google GenAI");
        }
        return response.text;
    } catch (error) {
        console.error("Error generating content:", error);
        throw error;
    }
} 