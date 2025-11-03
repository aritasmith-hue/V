
import React, { useState } from 'react';
import PatientForm from './components/PatientForm';
import ChatWindow from './components/ChatWindow';
import HistoryViewer from './components/HistoryViewer';
import { PatientDetails } from './types';

const App: React.FC = () => {
    const [view, setView] = useState<'form' | 'chat' | 'history'>('form');
    const [patientDetails, setPatientDetails] = useState<PatientDetails | null>(null);

    const handleStartChat = (details: PatientDetails) => {
        setPatientDetails(details);
        setView('chat');
    };

    const handleViewHistory = () => {
        setView('history');
    };
    
    const handleBackToForm = () => {
        setView('form');
        setPatientDetails(null);
    };

    const renderView = () => {
        switch (view) {
            case 'chat':
                return patientDetails && <ChatWindow patientDetails={patientDetails} onBack={handleBackToForm} />;
            case 'history':
                return <HistoryViewer onClose={handleBackToForm} />;
            case 'form':
            default:
                return <PatientForm onStartChat={handleStartChat} onViewHistory={handleViewHistory} />;
        }
    };

    return (
        <div className="bg-sky-100 flex justify-center items-center h-screen w-screen">
            <div className="w-full max-w-3xl h-full md:h-[90vh] md:max-h-[800px] bg-white rounded-none md:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {renderView()}
            </div>
        </div>
    );
};

export default App;
