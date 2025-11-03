
export type Sender = 'user' | 'bot';

export interface Message {
    id: number;
    sender: Sender;
    content: string;
    imageUrl?: string;
}

export interface PatientDetails {
    name: string;
    patientId: string;
    age: string;
    sex: string;
    symptoms: string;
    phone: string;
    address: string;
}

export interface HistoryRecord extends PatientDetails {
    timestamp: string;
    diagnosis: string;
    prescription: string;
    advice_mm: string;
    payment_status: string;
    vitals: string;
}