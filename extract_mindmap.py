import os

source_file = r'd:\代码_my-web\src\app\library\mindmap\[category]\page.tsx'
dest_file = r'd:\代码_my-web\src\app\library\mindmap\components\MindMapBoard.tsx'

with open(source_file, 'r', encoding='utf-8') as f:
    lines = f.readlines()

board_start = 0
board_end = 0

for i, line in enumerate(lines):
    if 'const MindMapBoard = () => {' in line:
        board_start = i
    if 'export default function MindMapPage() {' in line:
        board_end = i - 1
        break

board_code = lines[board_start:board_end]

imports = """\"use client\";

import React, { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import ReactFlow, {
    Background, Controls, Panel, addEdge, MarkerType, BackgroundVariant,
    Connection, Edge, Node, useReactFlow, useUpdateNodeInternals
} from 'reactflow';
import 'reactflow/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft, Share2, Hand, BoxSelect, ArrowRightCircle,
    StickyNote, Frame, Palette, Type, Bold,
    GitGraph, Route, Plus, Trash2, RotateCcw, RotateCw, Save, Loader2
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dagre from 'dagre';
import { toPng } from 'html-to-image';
import { toast } from 'sonner';

import { supabase } from '@/lib/supabaseClient';
import { STYLE_PRESETS } from '../constants';
import { calculateNodeSize } from '../utils';
import { useHistory } from '../hooks/useHistory';
import { RoughNode } from './RoughNode';
import { RoughGroup } from './RoughGroup';
import { RoughEdge } from './RoughEdge';

const nodeTypes = {
    rough: RoughNode,
    roughGroup: RoughGroup,
};

const edgeTypes = {
    rough: RoughEdge,
};

"""

with open(dest_file, 'w', encoding='utf-8') as f:
    f.write(imports)
    f.write('export ')
    f.writelines(board_code)

print(f'Successfully extracted MindMapBoard (lines: {len(board_code)})')
