import { useState, useCallback } from 'react';
import { Node, Edge, useNodesState, useEdgesState } from 'reactflow';

export const useHistory = (initialNodes: Node[], initialEdges: Edge[]) => {
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [history, setHistory] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);
    const [redoStack, setRedoStack] = useState<{ nodes: Node[], edges: Edge[] }[]>([]);

    const saveToHistory = useCallback(() => {
        setHistory(prev => [...prev.slice(-49), { nodes, edges }]);
        setRedoStack([]);
    }, [nodes, edges]);

    const undo = useCallback(() => {
        if (history.length === 0) return;
        const prevState = history[history.length - 1];
        setRedoStack(prev => [...prev, { nodes, edges }]);
        setNodes(prevState.nodes);
        setEdges(prevState.edges);
        setHistory(prev => prev.slice(0, -1));
    }, [history, nodes, edges, setNodes, setEdges]);

    const redo = useCallback(() => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[redoStack.length - 1];
        setHistory(prev => [...prev, { nodes, edges }]);
        setNodes(nextState.nodes);
        setEdges(nextState.edges);
        setRedoStack(prev => prev.slice(0, -1));
    }, [redoStack, nodes, edges, setNodes, setEdges, setHistory]);

    return {
        nodes, setNodes, onNodesChange,
        edges, setEdges, onEdgesChange,
        undo, redo, saveToHistory,
        history,
        canUndo: history.length > 0,
        canRedo: redoStack.length > 0
    };
};
