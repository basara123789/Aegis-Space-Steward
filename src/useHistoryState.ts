import { useState, useCallback, useMemo } from 'react';

export function useHistoryState<T>(initialState: T) {
    const [history, setHistory] = useState<T[]>([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const state = useMemo(() => history[currentIndex], [history, currentIndex]);

    const setState = useCallback((newState: T | ((prev: T) => T), options: { addToHistory?: boolean } = { addToHistory: true }) => {
        setHistory(prev => {
            const current = prev[currentIndex];
            const next = typeof newState === 'function'
                ? (newState as (prev: T) => T)(current)
                : newState;

            if (options.addToHistory === false) {
                const newHistory = [...prev];
                newHistory[currentIndex] = next;
                return newHistory;
            }

            const newHistory = prev.slice(0, currentIndex + 1);
            return [...newHistory, next];
        });
        if (options.addToHistory !== false) {
            setCurrentIndex(prev => prev + 1);
        }
    }, [currentIndex]);

    const undo = useCallback(() => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    }, []);

    const redo = useCallback(() => {
        setCurrentIndex(prev => Math.min(history.length - 1, prev + 1));
    }, [history.length]);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    return {
        state,
        setState,
        undo,
        redo,
        canUndo,
        canRedo
    };
}
