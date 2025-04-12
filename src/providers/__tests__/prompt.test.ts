import { promptProvider, promptSuffixProvider, systemProvider, systemSuffixProvider } from "../prompt";

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

describe("systemProvider", () => {
    it("should return a provider object with the correct type and index", () => {
        const provider = systemProvider("test system");
        expect(provider.type).toBe("system");
        expect(provider.index).toBe(Number.POSITIVE_INFINITY);
    });

    it("should return a provider object whose execute function returns the system message", async () => {
        const testSystem = "This is a test system message";
        const provider = systemProvider(testSystem);
        const result = await provider.execute();
        expect(result).toBe(testSystem);
    });
});

describe("promptSuffixProvider", () => {
    it("should return a provider object with the correct type and index", () => {
        const provider = promptSuffixProvider("test suffix");
        expect(provider.type).toBe("prompt");
        expect(provider.index).toBe(Number.NEGATIVE_INFINITY);
    });

    it("should return a provider object whose execute function returns the suffix", async () => {
        const testSuffix = "This is a test suffix";
        const provider = promptSuffixProvider(testSuffix);
        const result = await provider.execute();
        expect(result).toBe(testSuffix);
    });
});

describe("systemSuffixProvider", () => {
    it("should return a provider object with the correct type and index", () => {
        const provider = systemSuffixProvider("test system suffix");
        expect(provider.type).toBe("system");
        expect(provider.index).toBe(Number.NEGATIVE_INFINITY);
    });

    it("should return a provider object whose execute function returns the system suffix", async () => {
        const testSystemSuffix = "This is a test system suffix";
        const provider = systemSuffixProvider(testSystemSuffix);
        const result = await provider.execute();
        expect(result).toBe(testSystemSuffix);
    });
}); 