import { useState, useCallback } from 'react';

export function useUndoRedo(initialState) {
    const [history, setHistory] = useState([initialState]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const currentState = history[currentIndex];

    const setState = useCallback((newState) => {
        // Remove any future history if we're not at the end
        const newHistory = history.slice(0, currentIndex + 1);
        newHistory.push(newState);
        
        // Limit history size to 50 states
        if (newHistory.length > 50) {
            newHistory.shift();
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
        } else {
            setHistory(newHistory);
            setCurrentIndex(newHistory.length - 1);
        }
    }, [history, currentIndex]);

    const undo = useCallback(() => {
        if (currentIndex > 0) {
            setCurrentIndex(currentIndex - 1);
            return history[currentIndex - 1];
        }
        return null;
    }, [currentIndex, history]);

    const redo = useCallback(() => {
        if (currentIndex < history.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return history[currentIndex + 1];
        }
        return null;
    }, [currentIndex, history]);

    const canUndo = currentIndex > 0;
    const canRedo = currentIndex < history.length - 1;

    return {
        currentState,
        setState,
        undo,
        redo,
        canUndo,
        canRedo
    };
}

