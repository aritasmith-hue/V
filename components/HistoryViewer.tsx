
import React, { useState, useEffect, useMemo } from 'react';
import { getHistoryRecords } from '../services/dataService';
import { HistoryRecord } from '../types';
import BotMessageContent from './BotMessageContent';

interface HistoryViewerProps {
    onClose: () => void;
}

const HistoryViewer: React.FC<HistoryViewerProps> = ({ onClose }) => {
    const [allHistory, setAllHistory] = useState<HistoryRecord[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        setAllHistory(getHistoryRecords());
    }, []);

    const filteredHistory = useMemo(() => {
        if (!searchQuery) return allHistory;
        const lowercasedQuery = searchQuery.toLowerCase();
        return allHistory.filter(record => 
            Object.values(record).some(value => 
                String(value).toLowerCase().includes(lowercasedQuery)
            )
        );
    }, [searchQuery, allHistory]);

    return (
        <div className="flex flex-col h-full">
            <header className="flex-shrink-0 p-4 border-b-2 border-teal-700 bg-white flex items-center gap-4">
                <h2 className="text-xl font-bold text-teal-700">မှတ်တမ်းများ (History)</h2>
                <input
                    type="text"
                    placeholder="ရက်စွဲ (သို့) စာလုံးဖြင့်ရှာရန်"
                    className="flex-grow px-4 py-2 text-base border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-teal-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={onClose} className="px-4 py-2 bg-teal-700 text-white font-bold rounded-full hover:bg-teal-800 transition-colors">← နောက်သို့</button>
            </header>
            <main className="flex-grow overflow-y-auto p-4 bg-sky-50">
                {allHistory.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8 text-lg">မှတ်တမ်းများမရှိပါ။ (No past records found.)</p>
                ) : filteredHistory.length === 0 ? (
                    <p className="text-center text-gray-500 mt-8 text-lg">"{searchQuery}" အတွက် ရှာမတွေ့ပါ။ (No records found.)</p>
                ) : (
                    <div className="space-y-4">
                        {filteredHistory.map((record, index) => (
                            <div key={index} className="bg-white rounded-xl p-6 shadow-md border-l-4 border-teal-600">
                                <h3 className="text-lg font-bold text-teal-700 pb-2 mb-4 border-b">{new Date(record.timestamp).toLocaleString()}</h3>
                                <div className="space-y-3 text-sm text-slate-700">
                                    <p><strong>လူနာအမည် (Name):</strong> {record.name}</p>
                                    {record.phone && <p><strong>ဖုန်းနံပါတ် (Phone):</strong> {record.phone}</p>}
                                    {record.address && <p><strong>လိပ်စာ (Address):</strong> {record.address}</p>}
                                    <p><strong>ရောဂါလက္ခဏာများ (Symptoms):</strong> {record.symptoms}</p>
                                    <p><strong>ရောဂါသုံးသပ်ချက် (Diagnosis):</strong> {record.diagnosis}</p>
                                    <div>
                                        <strong className="block mb-1">ညွှန်ကြားခဲ့သောဆေးများ (Prescription):</strong>
                                        <BotMessageContent content={record.prescription} />
                                    </div>
                                    <div>
                                        <strong>လူနာအကြံပြုချက် (Advice):</strong>
                                        <p>{record.advice_mm.replace("🗣 လူနာအကြံပြုချက် –", "").trim()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryViewer;