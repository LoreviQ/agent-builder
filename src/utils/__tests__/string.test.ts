import { wrapInJsonBlock, joinWithNewlines } from '../string';

describe('string utils', () => {
    describe('wrapInJsonBlock', () => {
        it('should wrap a string in json code block', () => {
            const input = '{\"key\": \"value\"}';
            const expected = '```json\n{\"key\": \"value\"}\n```';
            expect(wrapInJsonBlock(input)).toEqual(expected);
        });
    });

    describe('joinWithNewlines', () => {
        it('should join strings with double newlines, filtering undefined', () => {
            const input = ['first', undefined, 'second', 'third'];
            const expected = 'first\n\nsecond\n\nthird';
            expect(joinWithNewlines(input)).toEqual(expected);
        });

        it('should return an empty string for empty or all undefined input', () => {
            expect(joinWithNewlines([])).toEqual('');
            expect(joinWithNewlines([undefined, undefined])).toEqual('');
        });
    });
}); 