/**
 * @fileoverview useUndoRedo Hook - Undo/Redo Functionality
 * 
 * Custom React hook that provides undo/redo functionality for state management.
 * Maintains a history of states with a maximum limit of 50 states.
 * 
 * @param {*} initialState - Initial state value
 * @returns {Object} Undo/Redo API
 * @returns {*} returns.currentState - Current state
 * @returns {Function} returns.setState - Function to set new state (adds to history)
 * @returns {Function} returns.undo - Function to undo (returns previous state)
 * @returns {Function} returns.redo - Function to redo (returns next state)
 * @returns {boolean} returns.canUndo - Whether undo is possible
 * @returns {boolean} returns.canRedo - Whether redo is possible
 * 
 * @example
 * const { currentState, setState, undo, redo, canUndo, canRedo } = useUndoRedo([]);
 * setState([1, 2, 3]); // Add to history
 * undo(); // Go back to []
 * redo(); // Go forward to [1, 2, 3]
 */

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

