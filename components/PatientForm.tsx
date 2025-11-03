
import React, { useState } from 'react';
import { PREDEFINED_SYMPTOMS } from '../constants';
import { PatientDetails } from '../types';

interface PatientFormProps {
    onStartChat: (details: PatientDetails) => void;
    onViewHistory: () => void;
}

const PatientForm: React.FC<PatientFormProps> = ({ onStartChat, onViewHistory }) => {
    const [details, setDetails] = useState({ name: '', patientId: '', age: '', sex: '', phone: '', address: '' });
    const [errors, setErrors] = useState({ name: '', age: '', sex: '', phone: '' });
    const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
    const [otherSymptom, setOtherSymptom] = useState('');
    const [showOtherInput, setShowOtherInput] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setDetails(prev => ({ ...prev, [name]: value }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleSymptomToggle = (symptom: string) => {
        setSelectedSymptoms(prev =>
            prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]
        );
    };

    const handleOtherToggle = () => {
        setShowOtherInput(prev => {
            if (prev) setOtherSymptom('');
            return !prev;
        });
    };

    const validateForm = () => {
        const newErrors = { name: '', age: '', sex: '', phone: '' };
        let isValid = true;
        if (!details.name.trim()) {
            newErrors.name = 'အမည်ဖြည့်ရန်လိုအပ်ပါသည်။';
            isValid = false;
        }
        if (!details.age) {
            newErrors.age = 'အသက်ဖြည့်ရန်လိုအပ်ပါသည်။';
            isValid = false;
        } else if (isNaN(Number(details.age)) || Number(details.age) <= 0) {
            newErrors.age = 'အသက်သည် ၀ ထက်ကြီးသော ကိန်းဂဏန်းဖြစ်ရပါမည်။';
            isValid = false;
        }
        if (!details.sex) {
            newErrors.sex = 'ကျား/မ ရွေးချယ်ရန်လိုအပ်ပါသည်။';
            isValid = false;
        }
        if (!details.phone.trim()) {
            newErrors.phone = 'ဖုန်းနံပါတ် ဖြည့်ရန်လိုအပ်ပါသည်။';
            isValid = false;
        } else if (!/^\d+$/.test(details.phone.trim())) {
            newErrors.phone = 'ဖုန်းနံပါတ်သည် ကိန်းဂဏန်းများသာ ဖြစ်ရပါမည်။';
            isValid = false;
        }
        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            const allSymptoms = [...selectedSymptoms, otherSymptom.trim()].filter(Boolean).join(', ');
            onStartChat({ ...details, symptoms: allSymptoms });
        }
    };

    return (
        <div className="flex flex-col justify-center items-center p-4 md:p-8 h-full text-center overflow-y-auto">
            <h2 className="text-3xl font-bold text-teal-700 mb-4">⚕️ လူနာမှတ်ပုံတင်ခြင်း (Patient Registration)</h2>
            <p className="text-slate-600 mb-6 max-w-md">သင်၏ကျန်းမာရေးရာကိစ္စများ စတင်ဆွေးနွေးရန်အတွက် အောက်ပါပုံစံကိုဖြည့်၍ မှတ်ပုံတင်ပါ။ သင်၏အချက်အလက်များကို လျှို့ဝှက်ထားပါမည်။</p>
            <form onSubmit={handleSubmit} noValidate className="w-full max-w-sm flex flex-col gap-4">
                <div>
                    <input type="text" name="name" placeholder="အမည် (Name)" value={details.name} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    {errors.name && <p className="text-red-600 text-sm text-left mt-1">{errors.name}</p>}
                </div>
                <input type="text" name="patientId" placeholder="ရှိပြီးသားလူနာ ID (Existing Patient ID - Optional)" value={details.patientId} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <div>
                    <input type="number" name="age" placeholder="အသက် (Age)" value={details.age} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    {errors.age && <p className="text-red-600 text-sm text-left mt-1">{errors.age}</p>}
                </div>
                 <div>
                    <input type="tel" name="phone" placeholder="ဖုန်းနံပါတ် (Phone Number)" value={details.phone} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    {errors.phone && <p className="text-red-600 text-sm text-left mt-1">{errors.phone}</p>}
                </div>
                 <input type="text" name="address" placeholder="နေရပ်လိပ်စာ (Address - Optional)" value={details.address} onChange={handleInputChange} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <div>
                    <select name="sex" value={details.sex} onChange={handleInputChange} required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white">
                        <option value="" disabled>ကျား/မ ရွေးပါ (Select Sex)</option>
                        <option value="Male">ကျား (Male)</option>
                        <option value="Female">မ (Female)</option>
                    </select>
                    {errors.sex && <p className="text-red-600 text-sm text-left mt-1">{errors.sex}</p>}
                </div>
                <div className="text-left">
                    <label className="block mb-2 text-slate-800 font-bold">အဓိကခံစားနေရသော ရောဂါလက္ခဏာများ</label>
                    <div className="flex flex-wrap gap-2">
                        {PREDEFINED_SYMPTOMS.map(s => (
                            <button type="button" key={s.en} onClick={() => handleSymptomToggle(s.en)} className={`px-4 py-2 border rounded-full text-sm transition-colors ${selectedSymptoms.includes(s.en) ? 'bg-teal-700 text-white border-teal-700' : 'bg-transparent text-teal-700 border-teal-700 hover:bg-teal-50'}`}>
                                {s.my}
                            </button>
                        ))}
                        <button type="button" onClick={handleOtherToggle} className={`px-4 py-2 border rounded-full text-sm transition-colors ${showOtherInput ? 'bg-teal-700 text-white border-teal-700' : 'bg-transparent text-teal-700 border-teal-700 hover:bg-teal-50'}`}>
                            အခြား (Other)
                        </button>
                    </div>
                    {showOtherInput && (
                        <input type="text" placeholder="အခြား ရောဂါလက္ခဏာကို ဖြည့်ပါ" value={otherSymptom} onChange={(e) => setOtherSymptom(e.target.value)} className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    )}
                </div>
                <button type="submit" className="w-full bg-teal-700 text-white font-bold py-3 px-4 rounded-full hover:bg-teal-800 transition-colors mt-4">
                    စတင်ဆွေးနွေးမည် (Start Chat)
                </button>
            </form>
            <button type="button" onClick={onViewHistory} className="w-full max-w-sm mt-3 bg-transparent text-teal-700 font-bold py-3 px-4 rounded-full border border-teal-700 hover:bg-teal-700 hover:text-white transition-colors">
                မှတ်တမ်းများကြည့်ရန် (View History)
            </button>
        </div>
    );
};

export default PatientForm;