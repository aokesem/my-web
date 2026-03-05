"use client";

import React from 'react';
import { ReactFlowProvider } from 'reactflow';
import { MindMapBoard } from '../components/MindMapBoard';

export default function MindMapPage() {
    return (
        <ReactFlowProvider>
            <MindMapBoard />
        </ReactFlowProvider>
    );
}
