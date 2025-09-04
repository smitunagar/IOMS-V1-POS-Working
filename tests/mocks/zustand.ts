import { act } from '@testing-library/react';
import { StateCreator } from 'zustand';

// Mock Zustand store
export const setupZustandTests = () => {
  let store: any = {};

  const createStore = (stateCreator: StateCreator<any>) => {
    const initialState = stateCreator(() => {}, () => store, { setState: () => {}, getState: () => store });
    store = { ...initialState };
    
    return {
      getState: () => store,
      setState: (partial: any) => {
        act(() => {
          store = { ...store, ...partial };
        });
      },
      subscribe: jest.fn(),
      destroy: jest.fn(),
    };
  };

  // Mock the create function from zustand
  jest.doMock('zustand', () => ({
    create: createStore,
  }));

  // Helper to reset store state
  const resetStore = () => {
    store = {};
  };

  return { resetStore };
};
