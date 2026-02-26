import React from 'react';

// 计算中英文混合字符串的视觉宽度 (简单近似: 非 ASCII 算 2 个字符宽度)
function getDisplayWidth(str: string): number {
    let width = 0;
    for (let i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) > 255) {
            width += 2;
        } else {
            width += 1;
        }
    }
    return width;
}

// 补齐空格
function padRight(str: string, targetWidth: number): string {
    const currentWidth = getDisplayWidth(str);
    if (currentWidth >= targetWidth) return str;
    return str + ' '.repeat(targetWidth - currentWidth);
}

/**
 * 将 HTML 表格转换为 Markdown 表格
 */
export function convertHtmlTableToMarkdown(htmlString: string): string | null {
    if (!htmlString.includes('<table')) return null;

    try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const tables = doc.querySelectorAll('table');

        if (tables.length === 0) return null;

        let markdownOutputs = [];

        for (let i = 0; i < tables.length; i++) {
            const table = tables[i];
            const rows = table.querySelectorAll('tr');
            if (rows.length === 0) continue;

            const parsedRows: string[][] = [];
            let maxCols = 0;

            // 解析每一行
            rows.forEach(row => {
                const cells = row.querySelectorAll('th, td');
                const rowData: string[] = [];
                cells.forEach(cell => {
                    // 去除换行和多余空格，避免破坏 markdown 表格结构
                    let text = cell.textContent || '';
                    text = text.replace(/[\r\n]+/g, ' ').trim();
                    rowData.push(text);
                });
                parsedRows.push(rowData);
                if (rowData.length > maxCols) maxCols = rowData.length;
            });

            if (parsedRows.length === 0) continue;

            // 补齐缺失的列
            parsedRows.forEach(row => {
                while (row.length < maxCols) {
                    row.push('');
                }
            });

            // 计算每一列的最大显示宽度，用于对齐
            const colWidths = new Array(maxCols).fill(0);
            parsedRows.forEach(row => {
                row.forEach((cell, colIdx) => {
                    const width = getDisplayWidth(cell);
                    if (width > colWidths[colIdx]) {
                        colWidths[colIdx] = width;
                    }
                });
            });

            // 确保最小列宽为 3 (针对 '---')
            for (let c = 0; c < colWidths.length; c++) {
                if (colWidths[c] < 3) colWidths[c] = 3;
            }

            let mdTable = '';

            // 生成表头 (假设第一行是表头)
            const headerRow = parsedRows[0];
            mdTable += '| ' + headerRow.map((cell, idx) => padRight(cell, colWidths[idx])).join(' | ') + ' |\n';

            // 生成分隔线
            mdTable += '| ' + colWidths.map(w => '-'.repeat(w)).join(' | ') + ' |\n';

            // 生成数据行
            for (let r = 1; r < parsedRows.length; r++) {
                const row = parsedRows[r];
                mdTable += '| ' + row.map((cell, idx) => padRight(cell, colWidths[idx])).join(' | ') + ' |\n';
            }

            markdownOutputs.push(mdTable);
        }

        return markdownOutputs.join('\n\n');

    } catch (e) {
        console.error("Error parsing HTML table to Markdown:", e);
        return null;
    }
}

/**
 * 通用的 Textarea 粘贴事件拦截处理器
 * @param e React Clipboard Event
 * @param textAreaElement DOM 元素
 * @param setValue 设置新值的回调 (用于受控组件)
 */
export function handleHtmlTablePaste(
    e: React.ClipboardEvent<HTMLTextAreaElement>,
    textAreaElement: HTMLTextAreaElement,
    setValue: (val: string) => void
) {
    const htmlData = e.clipboardData.getData('text/html');
    if (!htmlData || !htmlData.includes('<table')) return;

    const markdownTable = convertHtmlTableToMarkdown(htmlData);

    if (markdownTable) {
        // 阻止默认粘贴
        e.preventDefault();

        const currentValue = textAreaElement.value;
        const selectionStart = textAreaElement.selectionStart;
        const selectionEnd = textAreaElement.selectionEnd;

        // 在光标位置插入
        const newValue =
            currentValue.substring(0, selectionStart) +
            markdownTable +
            currentValue.substring(selectionEnd);

        setValue(newValue);

        // 提示：插入后理想情况下应该恢复光标位置到表格之后，
        // 但由于 setValue 通常是异步更新 state，直接设置 selectionStart 可能会失效。
        // 这里采用最简单的受控组件更新方式。
    }
}
