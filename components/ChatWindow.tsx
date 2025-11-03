import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Chat } from '@google/genai';
import { PatientDetails, Message } from '../types';
import { initializeChat, fileToGenerativePart } from '../services/geminiService';
import { saveConsultationRecord, getChatSession, saveChatSession, clearChatSession } from '../services/dataService';
import ImageViewerModal from './ImageViewerModal';
import BotMessageContent from './BotMessageContent';

interface ChatWindowProps {
    patientDetails: PatientDetails;
    onBack: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ patientDetails, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);
    const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const [modalImageUrl, setModalImageUrl] = useState<string | null>(null);

    const chatRef = useRef<Chat | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimerRef = useRef<number | null>(null);

    useEffect(() => {
        const initChat = async () => {
            setIsLoading(true);
            try {
                chatRef.current = initializeChat(patientDetails);
                const sessionMessages = getChatSession();
                if (sessionMessages) {
                    setMessages(sessionMessages);
                } else {
                    const response = await chatRef.current.sendMessage({ message: "Start conversation" });
                    const botMessage = response.text;
                    const jsonLogRegex = /```json\s*([\s\S]*?)\s*```/;
                    const patientFacingMessage = botMessage.replace(jsonLogRegex, '').trim();
                    setMessages([{ id: Date.now(), sender: 'bot', content: patientFacingMessage }]);
                }
            } catch (error) {
                console.error("Chat initialization failed:", error);
                let userErrorMessage = "စကားပြောခန်းကို စတင်နိုင်ခြင်းမရှိပါ။ ကျေးဇူးပြု၍ ခဏစောင့်ပြီး စာမျက်နှာကို ပြန်ဖွင့်စမ်းကြည့်ပါ။ (Could not start the chat. Please wait and refresh the page.)";
                if (error instanceof Error && error.message.toLowerCase().includes('failed to fetch')) {
                    userErrorMessage = "သင်၏အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။ (Please check your internet connection and try again.)";
                }
                setMessages([{ id: Date.now(), sender: 'bot', content: userErrorMessage }]);
            } finally {
                setIsLoading(false);
            }
        };
        initChat();
        
        return () => {
            clearChatSession();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [patientDetails]);
    
    useEffect(() => {
        saveChatSession(messages);
    }, [messages]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, showTyping]);

    useEffect(() => {
        if (isLoading) {
            typingTimerRef.current = window.setTimeout(() => setShowTyping(true), 500);
        } else {
            if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
            setShowTyping(false);
        }
        return () => { if (typingTimerRef.current) clearTimeout(typingTimerRef.current) };
    }, [isLoading]);

    const handleSendMessage = useCallback(async () => {
        if ((!inputValue.trim() && !attachment) || isLoading || !chatRef.current) return;

        const userMessage: Message = { id: Date.now(), sender: 'user', content: inputValue, imageUrl: attachmentPreview || undefined };
        setMessages(prev => [...prev, userMessage]);

        const messageToSend = inputValue;
        const attachmentToSend = attachment;
        setInputValue('');
        setAttachment(null);
        setAttachmentPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setIsLoading(true);

        try {
            let response;
            if (attachmentToSend) {
                const imagePart = await fileToGenerativePart(attachmentToSend);
                response = await chatRef.current.sendMessage({ message: [{ text: messageToSend }, imagePart] });
            } else {
                response = await chatRef.current.sendMessage({ message: messageToSend });
            }

            let botText = response.text;

            const jsonLogRegex = /```json\s*([\s\S]*?)\s*```/;
            const jsonMatch = botText.match(jsonLogRegex);
            const patientFacingMessage = botText.replace(jsonLogRegex, '').trim();

            if (jsonMatch && jsonMatch[1]) {
                try {
                    const record = JSON.parse(jsonMatch[1]);
                    saveConsultationRecord(record);
                } catch (e) {
                    console.error("Failed to parse or save JSON log:", e);
                }
            }

            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', content: patientFacingMessage }]);
        } catch (error) {
            console.error("Failed to send message:", error);
            let userErrorMessage = "တောင်းပန်ပါသည်။ မက်ဆေ့ချ်ပို့ရာတွင် အမှားအယွင်းတစ်ခု ဖြစ်ပွားခဲ့သည်။ ကျေးဇူးပြု၍ နောက်တစ်ကြိမ် ထပ်ကြိုးစားကြည့်ပါ။ (Sorry, an error occurred while sending your message. Please try again.)";
            
            if (error instanceof Error) {
                if (error.message.toLowerCase().includes('failed to fetch')) {
                    userErrorMessage = "သင်၏အင်တာနက်ချိတ်ဆက်မှုကို စစ်ဆေးပြီး ထပ်ကြိုးစားပါ။ (Please check your internet connection and try again.)";
                } else if (error.message.includes('429')) { // Specific check for rate limiting
                    userErrorMessage = "တောင်းဆိုမှုများလွန်းနေပါသည်။ ကျေးဇူးပြု၍ ခဏစောင့်ပြီးမှ ထပ်ကြိုးစားပါ။ (Too many requests. Please wait a moment and try again.)";
                }
            }
            
            setMessages(prev => [...prev, { id: Date.now() + 1, sender: 'bot', content: userErrorMessage }]);
        } finally {
            setIsLoading(false);
        }
    }, [inputValue, attachment, isLoading, attachmentPreview]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setAttachment(file);
            const reader = new FileReader();
            reader.onloadend = () => setAttachmentPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <header className="bg-gradient-to-r from-teal-700 to-teal-600 text-white p-4 text-center text-xl font-bold flex-shrink-0 flex items-center justify-between">
                <button onClick={onBack} className="text-2xl hover:text-teal-200 transition-colors">&larr;</button>
                <span>Thukha GP Virtual Assistant</span>
                <div className="w-8"></div>
            </header>
            <main className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex flex-col max-w-xs md:max-w-md ${msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'}`}>
                        <div className={`p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-lime-200 rounded-br-lg' : 'bg-gray-200 rounded-bl-lg'}`}>
                            {msg.imageUrl && <img src={msg.imageUrl} alt="Attachment" className="max-w-full rounded-lg mb-2 cursor-pointer" onClick={() => setModalImageUrl(msg.imageUrl!)} />}
                            {msg.sender === 'bot' ? <BotMessageContent content={msg.content} /> : <p className="text-slate-800 whitespace-pre-wrap">{msg.content}</p>}
                        </div>
                    </div>
                ))}
                {showTyping && (
                    <div className="flex items-start max-w-xs md:max-w-md">
                        <div className="p-3 rounded-2xl bg-gray-200 rounded-bl-lg flex items-center space-x-2">
                             <span className="text-sm text-gray-500 italic">စာရိုက်နေပါသည်...</span>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>
            <footer className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
                {attachmentPreview && (
                    <div className="relative inline-block mb-2">
                        <img src={attachmentPreview} alt="Preview" className="w-16 h-16 rounded-md object-cover" />
                        <button onClick={() => { setAttachment(null); setAttachmentPreview(null); }} className="absolute -top-2 -right-2 bg-gray-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs">&times;</button>
                    </div>
                )}
                <div className="flex items-center space-x-2">
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                    <button onClick={() => fileInputRef.current?.click()} className="w-12 h-12 flex-shrink-0 bg-gray-500 text-white rounded-full flex items-center justify-center text-2xl hover:bg-gray-600 transition-colors">📎</button>
                    <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="မက်ဆေ့ချ် ပို့ပါ..." disabled={isLoading} className="flex-grow border border-gray-300 rounded-full px-5 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    <button onClick={handleSendMessage} disabled={isLoading || (!inputValue.trim() && !attachment)} className="w-12 h-12 flex-shrink-0 bg-teal-700 text-white rounded-full flex items-center justify-center text-2xl hover:bg-teal-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">&#10148;</button>
                </div>
            </footer>
            {modalImageUrl && <ImageViewerModal src={modalImageUrl} onClose={() => setModalImageUrl(null)} />}
        </>
    );
};

export default ChatWindow;