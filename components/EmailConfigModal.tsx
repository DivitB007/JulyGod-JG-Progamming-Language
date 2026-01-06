import React, { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Save, Trash2, AlertTriangle, Send, FileText, ExternalLink, Loader2, Info } from 'lucide-react';
import { emailService } from '../services/emailService';

interface EmailConfigModalProps {
    onClose: () => void;
}

export const EmailConfigModal: React.FC<EmailConfigModalProps> = ({ onClose }) => {
    const [serviceId, setServiceId] = useState('service_g7d8eur');
    const [templateId, setTemplateId] = useState('');
    const [publicKey, setPublicKey] = useState('');
    const [saved, setSaved] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);
    const [testErrorMsg, setTestErrorMsg] = useState('');

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
        if (!templateId || !publicKey) return;
        emailService.saveConfig({ serviceId, templateId, publicKey });
        setSaved(true);
        setTestResult(null);
    };

    const handleClear = () => {
        emailService.clearConfig();
        setServiceId('service_g7d8eur');
        setTemplateId('');
        setPublicKey('');
        setSaved(false);
        setTestResult(null);
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        try {
            await emailService.sendTestEmail();
            setTestResult('success');
        } catch (e: any) {
            setTestResult('error');
            setTestErrorMsg(e.message);
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-jg-surface border border-jg-primary/30 rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-6 bg-gradient-to-r from-gray-900 to-jg-surface border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Mail className="w-5 h-5 text-jg-accent" />
                        Email Connectivity
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                        <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                            <Info className="w-4 h-4" /> Setup Required
                        </h4>
                        <p className="text-xs text-blue-200 leading-relaxed">
                            To receive payment alerts, link your <strong>EmailJS</strong> account. 
                            Go to your EmailJS dashboard and copy the IDs below.
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] text-gray-500 uppercase font-bold mb-1 tracking-widest">1. Service ID</label>
                            <input
                                type="text"
                                value={serviceId}
                                onChange={(e) => { setServiceId(e.target.value); setSaved(false); }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm font-mono focus:ring-1 focus:ring-jg-primary"
                                placeholder="service_xxxxxx"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">2. Template ID</label>
                                <span className="text-[9px] text-jg-muted">Found in 'Email Templates'</span>
                            </div>
                            <input
                                type="text"
                                value={templateId}
                                onChange={(e) => { setTemplateId(e.target.value); setSaved(false); }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm font-mono focus:ring-1 focus:ring-jg-primary"
                                placeholder="template_xxxxxx"
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <label className="block text-[10px] text-gray-500 uppercase font-bold tracking-widest">3. Public Key</label>
                                <span className="text-[9px] text-jg-muted">Found in 'Account' -> 'API Keys'</span>
                            </div>
                            <input
                                type="text"
                                value={publicKey}
                                onChange={(e) => { setPublicKey(e.target.value); setSaved(false); }}
                                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 text-white text-sm font-mono focus:ring-1 focus:ring-jg-primary"
                                placeholder="user_xxxxxxxxxxxx"
                            />
                        </div>
                    </div>

                    <div className="space-y-3 pt-2">
                        <div className="flex gap-2">
                            {saved && (
                                <button 
                                    onClick={handleClear}
                                    className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                            <button 
                                onClick={handleSave}
                                disabled={!templateId || !publicKey || saved}
                                className={`flex-1 py-3 font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${
                                    saved
                                    ? 'bg-green-500/20 border border-green-500/50 text-green-400' 
                                    : 'bg-jg-primary hover:bg-blue-600 text-white shadow-lg'
                                }`}
                            >
                                {saved ? <><CheckCircle className="w-5 h-5" /> Saved & Active</> : <><Save className="w-5 h-5" /> Save Configuration</>}
                            </button>
                        </div>

                        {saved && (
                            <button 
                                onClick={handleTest}
                                disabled={testing}
                                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 border border-gray-600"
                            >
                                {testing ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Send className="w-4 h-4" /> Send Test Email</>}
                            </button>
                        )}

                        {testResult === 'success' && (
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-green-400 text-xs font-bold text-center">
                                Success! Test email sent to divitbansal016@gmail.com
                            </div>
                        )}

                        {testResult === 'error' && (
                            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-left">
                                <div className="font-bold flex items-center gap-2 mb-1 uppercase tracking-tighter"><AlertTriangle className="w-3 h-3"/> Error</div>
                                {testErrorMsg}
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-black/40 border-t border-gray-800 text-center">
                    <a 
                        href="https://dashboard.emailjs.com/" 
                        target="_blank" 
                        className="text-[10px] text-jg-muted hover:text-white flex items-center justify-center gap-2"
                    >
                        Go to EmailJS Dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                </div>
            </div>
        </div>
    );
};