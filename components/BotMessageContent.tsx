
import React from 'react';

const BotMessageContent: React.FC<{ content: string }> = ({ content }) => {
    // Check for confirmation message
    const confirmationMatch = content.match(/✅\s*\*\*(.*?)\*\*\s*✅\s*\n([\s\S]*)/);
    if (confirmationMatch) {
        return (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-800 p-4 my-2 rounded-r-lg">
                <h4 className="font-bold text-green-900">✅ {confirmationMatch[1]}</h4>
                <p>{confirmationMatch[2].trim()}</p>
            </div>
        );
    }
    
    const renderInline = (text: string) => {
        const parts = text.split(/(\*\*.*?\*\*|_.*?_)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) return <strong key={i}>{part.slice(2, -2)}</strong>;
            if (part.startsWith('_') && part.endsWith('_')) return <em key={i}>{part.slice(1, -1)}</em>;
            return part;
        });
    };

    const renderTextPart = (text: string, partIndex: number) => {
        const blocks = text.trim().split(/\n\s*\n/);
        return (
            <div key={partIndex}>
                {blocks.map((block, blockIndex) => {
                    const lines = block.trim().split('\n');
                    const isUl = lines.every(line => /^\s*[-*+]\s/.test(line));
                    if (isUl) {
                        return (
                            <ul key={blockIndex} className="list-disc list-inside my-2 space-y-1">
                                {lines.map((line, i) => <li key={i}>{renderInline(line.replace(/^\s*[-*+]\s/, ''))}</li>)}
                            </ul>
                        );
                    }
                    const isOl = lines.every(line => /^\s*\d+\.\s/.test(line));
                    if (isOl) {
                         return (
                            <ol key={blockIndex} className="list-decimal list-inside my-2 space-y-1">
                                {lines.map((line, i) => <li key={i}>{renderInline(line.replace(/^\s*\d+\.\s/, ''))}</li>)}
                            </ol>
                        );
                    }
                    return <p key={blockIndex} className="my-2 whitespace-pre-wrap">{renderInline(block)}</p>;
                })}
            </div>
        );
    };

    const lines = content.split('\n');
    const parts: (string | string[][])[] = [];
    let currentText = '';
    let inTable = false;
    let table: string[][] = [];

    lines.forEach(line => {
        if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
            if (!inTable) {
                if (currentText.trim()) parts.push(currentText);
                currentText = '';
                inTable = true;
                table = [];
            }
            const cells = line.trim().split('|').slice(1, -1).map(cell => cell.trim());
            if (!cells.every(cell => cell.replace(/-/g, '').trim() === '')) {
                table.push(cells);
            }
        } else {
            if (inTable) {
                parts.push(table);
                inTable = false;
            }
            currentText += line + '\n';
        }
    });
    if (inTable) parts.push(table);
    else if (currentText.trim()) parts.push(currentText);

    return (
        <div className="text-slate-800">
            {parts.map((part, index) => {
                if (typeof part === 'string') return renderTextPart(part, index);
                
                if (part.length === 0) return null;
                const headers = part[0];
                const rows = part.slice(1);
                return (
                    <div key={index} className="my-4 overflow-x-auto">
                        <table className="w-full text-sm text-left text-gray-600 border-collapse">
                            <thead className="text-xs text-white uppercase bg-teal-700">
                                <tr>{headers.map((h, i) => <th key={i} className="px-4 py-3">{h}</th>)}</tr>
                            </thead>
                            <tbody>
                                {rows.map((row, i) => (
                                    <tr key={i} className="bg-white border-b hover:bg-gray-50">
                                        {row.map((cell, j) => <td key={j} className="px-4 py-3">{renderInline(cell)}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            })}
        </div>
    );
};

export default BotMessageContent;
