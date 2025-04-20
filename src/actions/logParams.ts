import type { Action } from '../types';

/**
 * An action that logs the parameters to the console.
 */
export const logParamsAction: Action = {
    key: 'logParams',
    title: 'Log Parameters',
    enabled: true,
    order: 0,
    execute: async (agent, params?: any) => {
        console.log('Agent Parameters:', params);
        return true; // Indicate success
    },
};