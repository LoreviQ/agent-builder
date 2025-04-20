export function wrapInJsonBlock(string: string): string {
    return `\`\`\`json\n${string}\n\`\`\``;
}

export function joinWithNewlines(strings: (string | undefined)[]): string {
    return strings.filter(s => s).join('\n\n');
}