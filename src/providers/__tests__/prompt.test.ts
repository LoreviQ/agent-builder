import { promptProvider } from "../prompt";

describe("promptProvider", () => {
    it("should return a provider object with the correct type and index", () => {
        const provider = promptProvider("test prompt");
        expect(provider.type).toBe("prompt");
        expect(provider.index).toBe(Number.POSITIVE_INFINITY);
    });

    it("should return a provider object whose execute function returns the prompt", async () => {
        const testPrompt = "This is a test prompt";
        const provider = promptProvider(testPrompt);
        const result = await provider.execute();
        expect(result).toBe(testPrompt);
    });
}); 