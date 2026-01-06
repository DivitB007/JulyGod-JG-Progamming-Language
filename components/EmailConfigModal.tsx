import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Save, Trash2, HelpCircle } from 'lucide-react';
import { emailService } from '../services/emailService';

interface EmailConfigModalProps {
    onClose: () => void;
}

export const EmailConfigModal: React.FC<EmailConfigModalProps> = ({ onClose }) => {
    const [serviceId, setServiceId] = useState('');
    const [templateId, setTemplateId] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const config = emailService.getConfig();
        if (config) {
            setServiceId(config.serviceId);
            setTemplateId(config.templateId);
            setPublicKey(config.publicKey);
            setSaved(true);
        }
    }, []);

    const handleSave = () => {
        if (!serviceId || !templateId || !publicKey) return;
        emailService.saveConfig({ serviceId, templateId, publicKey });
        setSaved(true);
    };

    const handleClear = () => {
        emailService.clearConfig();
        setServiceId('');
        setTemplateId('');
        setPublicKey('');
        setSaved(false);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-jg-surface border border-jg-primary/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative">
                
                <div className="p-6 bg-gradient-to-r from-gray-900 to-jg-surface border-b border-gray-700 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <Mail className="w-5 h-5 text-jg-accent" />
                            Email Setup (Free)
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-3 text-xs text-purple-200">
                        <p className="flex items-start gap-2">
                            <HelpCircle className="w-4 h-4 shrink-0" />
                            <span>
                                Get free keys from <strong>EmailJS.com</strong>.
                                <br/>
                                This allows users to send approval emails directly to you without a paid server.
                            </span>
                        </p>
                    </div>

                    <div className="space-y-3">
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Service ID (e.g., service_xyz)</label>
                            <input
                                type="text"
                                value={serviceId}
                                onChange={(e) => { setServiceId(e.target.value); setSaved(false); }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-jg-primary"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Template ID (e.g., template_abc)</label>
                            <input
                                type="text"
                                value={templateId}
                                onChange={(e) => { setTemplateId(e.target.value); setSaved(false); }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-jg-primary"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-medium text-gray-400 mb-1">Public Key (e.g., user_12345)</label>
                            <input
                                type="text"
                                value={publicKey}
                                onChange={(e) => { setPublicKey(e.target.value); setSaved(false); }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-jg-primary"
                            />
                        </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                        {saved && (
                             <button 
                                onClick={handleClear}
                                className="flex-1 py-2 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all text-sm"
                            >
                                <Trash2 className="w-4 h-4" /> Clear
                            </button>
                        )}
                        
                        <button 
                            onClick={handleSave}
                            disabled={!serviceId || !templateId || !publicKey || saved}
                            className={`flex-1 py-2 px-4 font-semibold rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg text-sm ${
                                saved
                                ? 'bg-green-500/20 border border-green-500/50 text-green-400 cursor-default shadow-none' 
                                : 'bg-jg-primary hover:bg-blue-600 text-white shadow-blue-500/20'
                            }`}
                        >
                            {saved ? (
                                <>
                                    <CheckCircle className="w-4 h-4" /> Configured
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" /> Save Config
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};