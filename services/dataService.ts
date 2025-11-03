
import { GOOGLE_SHEET_WEB_APP_URL, LOCAL_STORAGE_CHAT_KEY, LOCAL_STORAGE_HISTORY_KEY } from '../constants';
import { HistoryRecord, Message } from '../types';

// --- Local Storage Service ---

export const getChatSession = (): Message[] | null => {
    const savedHistory = localStorage.getItem(LOCAL_STORAGE_CHAT_KEY);
    return savedHistory ? JSON.parse(savedHistory) : null;
};

export const saveChatSession = (messages: Message[]) => {
    if (messages.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_CHAT_KEY, JSON.stringify(messages));
    }
};

export const clearChatSession = () => {
    localStorage.removeItem(LOCAL_STORAGE_CHAT_KEY);
};

export const getHistoryRecords = (): HistoryRecord[] => {
    try {
        const historyJSON = localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY);
        const storedHistory = historyJSON ? JSON.parse(historyJSON) : [];
        if (Array.isArray(storedHistory)) {
            storedHistory.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            return storedHistory;
        }
    } catch (error) {
        console.error("Failed to load history from localStorage:", error);
    }
    return [];
};

const saveRecordLocally = (record: HistoryRecord) => {
    try {
        const history = getHistoryRecords();
        history.unshift(record); // Add to the beginning
        localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
        console.error("Failed to save record to localStorage:", error);
    }
};

// --- Google Sheet Service ---

const saveRecordToGoogleSheet = async (record: HistoryRecord) => {
    if (!GOOGLE_SHEET_WEB_APP_URL) {
        console.warn('Google Sheet Web App URL is not configured. Skipping record save.');
        return;
    }
    try {
        await fetch(GOOGLE_SHEET_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(record),
        });
        console.log('Dispatched record to Google Sheet.');
    } catch (error) {
        console.error('Error sending record to Google Sheet:', error);
    }
};

// --- Combined Save Service ---

export const saveConsultationRecord = (record: Omit<HistoryRecord, 'timestamp'>) => {
    const recordWithTimestamp: HistoryRecord = {
        ...record,
        timestamp: new Date().toISOString(),
    };
    saveRecordToGoogleSheet(recordWithTimestamp);
    saveRecordLocally(recordWithTimestamp);
};
