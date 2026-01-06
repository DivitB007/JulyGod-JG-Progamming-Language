
import React, { useState, useEffect } from 'react';
import { 
    Users, Newspaper, Shield, Ban, Unlock, 
    Rocket, Zap, Sparkles, Send, Trash2, 
    Plus, UserCheck, AlertTriangle, Loader2,
    Mail, Calendar, ShieldCheck, CreditCard, CheckCircle, XCircle, Search, RefreshCw, Hash, User as UserIcon,
    Clock, Activity, ChevronRight, Copy, Info, ExternalLink, Globe, Key, Wand2, FileText
} from 'lucide-react';
import { dbService, UserProfile, NewsItem, JGVersion, authService } from '../services/firebase';
import { collection, onSnapshot, query, orderBy, getFirestore } from 'firebase/firestore';
import { GoogleGenAI } from "@google/genai";

// Fix: Defined missing ADMIN_EMAIL constant
const ADMIN_EMAIL = "Divitbansal016@gmail.com";

export const AdminDashboard: React.FC = () => {
    const [tab, setTab] = useState<'users' | 'news' | 'requests'>('users');
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [news, setNews] = useState<NewsItem[]>([]);
    const [requests, setRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [inspectingUser, setInspectingUser] = useState<UserProfile | null>(null);

    // News Form
    const [newsForm, setNewsForm] = useState({ title: '', description: '', tag: 'Update', icon: 'Rocket', fullArticle: '' });
    const [isPosting, setIsPosting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    // Ban State
    const [selectedUserForBan, setSelectedUserForBan] = useState<string | null>(null);
    const [banReason, setBanReason] = useState("");

    useEffect(() => {
        fetchData();
        const unsubNews = dbService.subscribeToNews(setNews);
        
        // Real-time payment requests monitoring
        const db = getFirestore();
        const unsubRequests = onSnapshot(
            query(collection(db, "payment_requests"), orderBy("createdAt", "desc")), 
            (snap) => {
                setRequests(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            },
            (err) => {
                console.error("Dashboard Snapshot Error:", err);
                if (err.code === 'permission-denied') {
                    setError("Security Rules Rejection. Please check Firebase Console.");
                }
            }
        );

        return () => {
            unsubNews();
            unsubRequests();
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const u = await dbService.getAllUsers();
            setUsers(u || []);
        } catch (err: any) {
            console.error("fetchData Error:", err);
            setError(err.message || "Failed to load engineering data.");
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateArticle = async () => {
        if (!newsForm.title || !newsForm.description) {
            alert("Please provide a title and short description first.");
            return;
        }

        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Write a professional, high-density engineering blog post for the JulyGod (JG) Programming Language. 
                
                TITLE: ${newsForm.title}
                SUMMARY: ${newsForm.description}
                CATEGORY: ${newsForm.tag}
                
                REQUIREMENTS:
                1. Tone: Industrial, technical, and forward-thinking.
                2. Structure: Introduction, Technical Deep-Dive, Code Examples (if relevant), and a Conclusion.
                3. Format: Clean Markdown.
                4. Length: 400-600 words.
                5. Use JG nomenclature (e.g., 'Engineers' instead of 'Users', 'Telemetry' instead of 'Analytics').`,
            });
            
            const article = response.text || "Failed to generate content.";
            setNewsForm(prev => ({ ...prev, fullArticle: article }));
        } catch (err: any) {
            console.error("AI Generation Error:", err);
            alert("AI service failed. Check Console or try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleAddNews = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsPosting(true);
        try {
            await dbService.addNews(newsForm);
            setNewsForm({ title: '', description: '', tag: 'Update', icon: 'Rocket', fullArticle: '' });
        } catch (err) {
            console.error(err);
        } finally {
            setIsPosting(false);
        }
    };

    const togglePermission = async (user: UserProfile, version: JGVersion) => {
        const current = user.unlockedVersions || [];
        const updated = current.includes(version) 
            ? current.filter(v => v !== version) 
            : [...current, version];
        
        try {
            await dbService.updateUserPermissions(user.uid, updated);
            // Update local state for immediate feedback
            setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, unlockedVersions: updated } : u));
            if (inspectingUser?.uid === user.uid) setInspectingUser({ ...inspectingUser, unlockedVersions: updated });
        } catch (err) {
            console.error(err);
        }
    };

    const handleBan = async (uid: string) => {
        if (!banReason) return;
        try {
            await dbService.banUser(uid, banReason);
            setSelectedUserForBan(null);
            setBanReason("");
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleProcessPayment = async (requestId: string, targetUid: string, version: JGVersion, action: 'unlock' | 'deny') => {
        try {
            if (action === 'unlock') {
                await dbService.adminUnlockVersion("", targetUid, version);
            } else {
                await dbService.adminDenyVersion("", targetUid, version);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        // Could add a toast here
    };

    const filteredUsers = (users || []).filter(u => {
        if (!u) return false;
        const search = (searchTerm || '').toLowerCase();
        const email = (u.email || '').toLowerCase();
        const name = (u.displayName || '').toLowerCase();
        const uid = (u.uid || '').toLowerCase();
        return email.includes(search) || name.includes(search) || uid.includes(search);
    });

    if (loading) return (
        <div className="min-h-screen pt-24 flex items-center justify-center bg-jg-dark">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-12 h-12 text-jg-accent animate-spin" />
                <p className="text-jg-muted text-sm font-mono animate-pulse">Synchronizing Kernel Data...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-jg-dark">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Unified Dashboard Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-jg-surface p-10 rounded-[2.5rem] border border-jg-accent/20 shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-jg-accent/10 to-transparent opacity-50"></div>
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-20 h-20 bg-jg-accent/10 rounded-3xl flex items-center justify-center border border-jg-accent/30 shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                            <Shield className="w-10 h-10 text-jg-accent" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Control Room</h1>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 text-green-400 text-[10px] font-black uppercase rounded border border-green-500/20">
                                    <Activity className="w-3 h-3 animate-pulse" /> Live Sync
                                </span>
                                <p className="text-jg-muted text-xs font-mono tracking-widest">Authenticated: DivitIndia(Owner)</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 relative z-10">
                        {[
                            { id: 'users', label: 'Engineers', icon: Users, info: `${users.length} Active` },
                            { id: 'requests', label: 'Payments', icon: CreditCard, count: requests.length, info: 'Pending' },
                            { id: 'news', label: 'Broadcasts', icon: Newspaper, info: 'Live Feed' },
                        ].map(item => (
                            <button 
                                key={item.id}
                                onClick={() => setTab(item.id as any)}
                                className={`px-6 py-3 rounded-2xl flex flex-col items-start transition-all relative min-w-[140px] border ${
                                    tab === item.id 
                                    ? 'bg-jg-accent border-jg-accent text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]' 
                                    : 'bg-white/5 border-white/5 text-gray-400 hover:bg-white/10'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <item.icon className={`w-4 h-4 ${tab === item.id ? 'text-white' : 'text-jg-accent'}`} />
                                    <span className="text-[10px] font-black tracking-widest uppercase">{item.label}</span>
                                </div>
                                <span className="text-[9px] font-mono opacity-60">{item.info}</span>
                                {item.count !== undefined && item.count > 0 && (
                                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[11px] font-black shadow-lg animate-bounce border-2 border-jg-dark">
                                        {item.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {tab === 'requests' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3 italic">
                                <CreditCard className="w-8 h-8 text-emerald-400" />
                                LIVE TRANSACTION FEED
                            </h3>
                            <button onClick={fetchData} className="p-2 hover:bg-white/10 rounded-full text-jg-muted transition-all">
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        {requests.length === 0 ? (
                            <div className="p-40 text-center bg-jg-surface/30 rounded-[3rem] border-2 border-dashed border-white/5">
                                <Globe className="w-20 h-20 text-white/5 mx-auto mb-6" />
                                <p className="text-gray-500 font-mono text-sm uppercase tracking-widest italic font-bold">Waiting for incoming telemetry...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {requests.map((req) => (
                                    <div key={req.id} className="bg-jg-surface border border-white/10 p-8 rounded-[2rem] flex flex-col gap-6 group hover:border-jg-primary/50 transition-all shadow-2xl relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full"></div>
                                        
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="flex gap-4">
                                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-jg-primary border border-white/5">
                                                    <UserCheck className="w-7 h-7" />
                                                </div>
                                                <div>
                                                    <h4 className="text-white font-black text-xl leading-none">{req.username}</h4>
                                                    <div className="flex items-center gap-2 mt-2">
                                                        <Clock className="w-3 h-3 text-gray-600" />
                                                        <p className="text-[9px] text-gray-500 font-mono uppercase">
                                                            {req.createdAt?.toDate?.() ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(req.createdAt.toDate()) : 'Recent'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <span className={`px-4 py-1 rounded-full text-[10px] font-black border tracking-widest uppercase shadow-lg ${
                                                    req.version === 'v1.2' ? 'bg-purple-500/20 border-purple-500/50 text-purple-400' :
                                                    req.version === 'v1.1' ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-400' :
                                                    'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                                }`}>
                                                    {req.version}
                                                </span>
                                                <span className="text-[8px] text-gray-600 font-mono">{req.uid.slice(0, 8)}...</span>
                                            </div>
                                        </div>

                                        <div className="space-y-3 relative z-10">
                                            <div className="bg-black/60 p-5 rounded-2xl border border-white/5 flex justify-between items-center">
                                                <div>
                                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">UTR Reference</label>
                                                    <span className="text-white font-mono text-sm tracking-wider select-all">{req.utr}</span>
                                                </div>
                                                <button onClick={() => copyToClipboard(req.utr)} className="p-2 hover:bg-white/10 rounded-lg text-gray-500 transition-all">
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="bg-black/60 p-5 rounded-2xl border border-white/5">
                                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Fee</label>
                                                    <span className="text-emerald-400 font-black text-lg">₹{req.price}</span>
                                                </div>
                                                <div className="bg-black/60 p-5 rounded-2xl border border-white/5">
                                                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest block mb-1">Redeem Code</label>
                                                    <span className="text-jg-primary font-mono text-xs font-bold">{req.redeemCode || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3 relative z-10">
                                            <button 
                                                onClick={() => handleProcessPayment(req.id, req.uid, req.version, 'unlock')}
                                                className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl text-xs font-black tracking-widest transition-all shadow-xl shadow-green-900/30 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <CheckCircle className="w-5 h-5" /> AUTHORIZE
                                            </button>
                                            <button 
                                                onClick={() => handleProcessPayment(req.id, req.uid, req.version, 'deny')}
                                                className="flex-1 py-4 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white rounded-2xl text-xs font-black tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <XCircle className="w-5 h-5" /> REJECT
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {tab === 'users' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex flex-col lg:flex-row justify-between items-center gap-4 px-4">
                            <h3 className="text-2xl font-black text-white flex items-center gap-3 italic w-full">
                                <Users className="w-8 h-8 text-jg-primary" />
                                ENGINEER DIRECTORY
                                <span className="text-[10px] bg-jg-surface border border-white/10 px-4 py-1.5 rounded-full text-jg-muted font-mono uppercase font-black tracking-widest">
                                    {filteredUsers.length} TOTAL REGISTERED
                                </span>
                            </h3>
                            <div className="relative w-full max-w-lg">
                                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                <input 
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search by ID, Name, or Email..."
                                    className="w-full bg-jg-surface border border-white/10 rounded-2xl pl-14 pr-8 py-4 text-sm text-white focus:border-jg-primary outline-none transition-all shadow-inner focus:ring-4 focus:ring-jg-primary/10"
                                />
                            </div>
                        </div>

                        <div className="bg-jg-surface rounded-[3rem] border border-white/10 overflow-hidden shadow-2xl">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-black/50">
                                        <tr className="text-[10px] font-black tracking-[0.3em] text-gray-500 uppercase">
                                            <th className="px-10 py-6">Engineer Identity</th>
                                            <th className="px-10 py-6 text-center">Permissions</th>
                                            <th className="px-10 py-6 text-center">Cloud Status</th>
                                            <th className="px-10 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filteredUsers.map((user) => (
                                            <tr 
                                                key={user.uid} 
                                                className="hover:bg-white/[0.04] transition-all group cursor-pointer"
                                                onClick={() => setInspectingUser(user)}
                                            >
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-14 h-14 rounded-2xl bg-jg-primary/10 flex items-center justify-center border border-jg-primary/20 shadow-inner group-hover:scale-105 transition-transform">
                                                            <UserIcon className="w-7 h-7 text-jg-primary" />
                                                        </div>
                                                        <div>
                                                            <div className="text-lg font-black text-white flex items-center gap-2">
                                                                {user.displayName || "Unknown Engineer"}
                                                                {user.email === ADMIN_EMAIL && <ShieldCheck className="w-4 h-4 text-jg-accent" />}
                                                            </div>
                                                            <div className="text-xs text-gray-500 font-mono tracking-tighter mt-0.5">{user.email || "no-email@julygod.com"}</div>
                                                            <div className="text-[10px] text-gray-700 font-mono mt-1 opacity-60">UID: {user.uid}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex justify-center flex-wrap gap-2 max-w-[280px] mx-auto">
                                                        {(['v0', 'v1.0', 'v1.1', 'v1.2'] as JGVersion[]).map(v => (
                                                            <span 
                                                                key={v}
                                                                className={`text-[9px] font-black px-3 py-1.5 rounded-xl border transition-all ${user.unlockedVersions?.includes(v) ? 'bg-jg-primary/20 border-jg-primary/50 text-jg-primary' : 'bg-white/5 border-white/5 text-gray-700 opacity-40'}`}
                                                            >
                                                                {v.toUpperCase()}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    {user.isBanned ? (
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/40 text-red-400 text-[10px] font-black italic uppercase tracking-widest">
                                                            <Ban className="w-3.5 h-3.5" /> ACCESS SUSPENDED
                                                        </div>
                                                    ) : (
                                                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/40 text-green-400 text-[10px] font-black italic uppercase tracking-widest">
                                                            <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE PROFILE
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex items-center justify-end gap-4">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setInspectingUser(user); }}
                                                            className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-jg-muted transition-all"
                                                        >
                                                            <ChevronRight className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'news' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <form onSubmit={handleAddNews} className="lg:col-span-1 bg-jg-surface p-10 rounded-[3rem] border border-white/10 space-y-6 h-fit shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-jg-primary/5 blur-3xl rounded-full"></div>
                            <h3 className="text-2xl font-black text-white flex items-center gap-3 mb-2 italic">
                                <Plus className="w-8 h-8 text-jg-primary" />
                                NEW BROADCAST
                            </h3>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-2">Subject Title</label>
                                <input 
                                    required
                                    value={newsForm.title}
                                    onChange={e => setNewsForm({...newsForm, title: e.target.value})}
                                    className="w-full bg-black/50 border border-gray-700 rounded-2xl px-5 py-4 text-sm text-white focus:border-jg-primary outline-none transition-all font-bold" 
                                    placeholder="Version 1.3 Draft..."
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-2">Channel</label>
                                    <select 
                                        value={newsForm.tag}
                                        onChange={e => setNewsForm({...newsForm, tag: e.target.value})}
                                        className="w-full bg-black/50 border border-gray-700 rounded-2xl px-5 py-4 text-sm text-white focus:border-jg-primary outline-none font-bold"
                                    >
                                        <option>Release</option>
                                        <option>Feature</option>
                                        <option>Community</option>
                                        <option>Update</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-2">Visual Icon</label>
                                    <div className="flex gap-2">
                                        {['Rocket', 'Zap', 'Sparkles'].map(ico => (
                                            <button 
                                                key={ico}
                                                type="button"
                                                onClick={() => setNewsForm({...newsForm, icon: ico})}
                                                className={`flex-1 p-4 rounded-2xl border transition-all flex items-center justify-center ${newsForm.icon === ico ? 'bg-jg-primary text-white border-jg-primary shadow-xl shadow-jg-primary/30' : 'bg-black/30 border-gray-700 text-gray-500 hover:text-white'}`}
                                            >
                                                {ico === 'Rocket' && <Rocket className="w-5 h-5" />}
                                                {ico === 'Zap' && <Zap className="w-5 h-5" />}
                                                {ico === 'Sparkles' && <Sparkles className="w-5 h-5" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block mb-2">Short Summary</label>
                                <textarea 
                                    required
                                    value={newsForm.description}
                                    onChange={e => setNewsForm({...newsForm, description: e.target.value})}
                                    rows={3}
                                    className="w-full bg-black/50 border border-gray-700 rounded-2xl px-5 py-3 text-sm text-white focus:border-jg-primary outline-none resize-none transition-all leading-relaxed" 
                                    placeholder="Enter a brief teaser..."
                                />
                            </div>
                            
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block">Detailed Article (Markdown)</label>
                                    <button 
                                        type="button"
                                        onClick={handleGenerateArticle}
                                        disabled={isGenerating || !newsForm.title}
                                        className="text-[10px] font-black text-jg-accent hover:text-white flex items-center gap-1.5 transition-colors group"
                                    >
                                        {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3 group-hover:rotate-12 transition-transform" />}
                                        AI EXPAND CONTENT
                                    </button>
                                </div>
                                <textarea 
                                    value={newsForm.fullArticle}
                                    onChange={e => setNewsForm({...newsForm, fullArticle: e.target.value})}
                                    rows={6}
                                    className="w-full bg-black/50 border border-gray-700 rounded-2xl px-5 py-4 text-sm text-white focus:border-jg-primary outline-none resize-none transition-all leading-relaxed font-mono" 
                                    placeholder="Full article content in Markdown..."
                                />
                            </div>

                            <button 
                                type="submit"
                                disabled={isPosting}
                                className="w-full py-5 bg-jg-primary hover:bg-blue-600 text-white font-black tracking-widest uppercase rounded-[1.5rem] transition-all shadow-2xl shadow-jg-primary/40 flex items-center justify-center gap-3 active:scale-95"
                            >
                                {isPosting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                                COMMIT BROADCAST
                            </button>
                        </form>

                        <div className="lg:col-span-2 space-y-6 overflow-y-auto max-h-[800px] pr-2 custom-scrollbar">
                            <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3 italic px-4">
                                <Calendar className="w-8 h-8 text-jg-muted" /> BROADCAST HISTORY
                            </h3>
                            {news.map((item) => (
                                <div key={item.id} className="p-8 bg-jg-surface/40 border border-white/10 rounded-[2.5rem] flex items-center justify-between group hover:bg-jg-surface/60 transition-all shadow-2xl">
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 bg-black/50 rounded-2xl flex items-center justify-center text-jg-primary border border-white/10 shadow-inner">
                                            {item.icon === 'Rocket' && <Rocket className="w-8 h-8" />}
                                            {item.icon === 'Zap' && <Zap className="w-8 h-8" />}
                                            {item.icon === 'Sparkles' && <Sparkles className="w-8 h-8" />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <h4 className="text-white font-black text-2xl">{item.title}</h4>
                                                <span className="text-[9px] font-black px-3 py-1 rounded-full bg-jg-primary/20 text-jg-primary border border-jg-primary/30 uppercase tracking-widest">{item.tag}</span>
                                            </div>
                                            <p className="text-sm text-jg-muted line-clamp-2 max-w-lg leading-relaxed">{item.description}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => dbService.deleteNews(item.id!)}
                                        className="p-4 opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-400 hover:bg-red-500 rounded-2xl hover:text-white transition-all shadow-2xl"
                                    >
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Account Inspector Overlay */}
            {inspectingUser && (
                <div className="fixed inset-0 z-[110] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
                    <div className="bg-jg-surface border-2 border-white/10 rounded-[3.5rem] max-w-3xl w-full shadow-[0_0_100px_rgba(59,130,246,0.15)] relative overflow-hidden flex flex-col max-h-[90vh]">
                        
                        <div className="absolute top-0 right-0 w-64 h-64 bg-jg-primary/5 blur-3xl rounded-full"></div>
                        
                        <div className="p-12 border-b border-white/5 flex justify-between items-start relative z-10">
                            <div className="flex items-center gap-8">
                                <div className="w-24 h-24 rounded-[2.5rem] bg-jg-primary/10 flex items-center justify-center border-2 border-jg-primary/30 shadow-2xl">
                                    <UserIcon className="w-12 h-12 text-jg-primary" />
                                </div>
                                <div>
                                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase italic">{inspectingUser.displayName || 'Unnamed User'}</h2>
                                    <p className="text-jg-muted font-mono text-sm tracking-widest flex items-center gap-2 mt-1">
                                        <Mail className="w-4 h-4" /> {inspectingUser.email}
                                    </p>
                                    <p className="text-gray-700 font-mono text-[10px] mt-2 select-all">UID: {inspectingUser.uid}</p>
                                </div>
                            </div>
                            <button onClick={() => setInspectingUser(null)} className="p-4 bg-white/5 hover:bg-white/10 rounded-3xl text-jg-muted transition-all">
                                <XCircle className="w-8 h-8" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-12 space-y-12 relative z-10 custom-scrollbar">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* Permissions Config */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 border-l-2 border-jg-primary pl-4">Manual Permission Overrides</h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {(['v0', 'v0.1-remastered', 'v1.0', 'v1.1', 'v1.2'] as JGVersion[]).map(v => (
                                            <button 
                                                key={v}
                                                onClick={() => togglePermission(inspectingUser, v)}
                                                className={`p-4 rounded-2xl border-2 flex items-center justify-between group transition-all ${
                                                    inspectingUser.unlockedVersions?.includes(v) 
                                                    ? 'bg-jg-primary/10 border-jg-primary/50 text-white' 
                                                    : 'bg-black/40 border-white/5 text-gray-600 grayscale'
                                                }`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest">{v.replace('-remastered', ' RM')}</span>
                                                {inspectingUser.unlockedVersions?.includes(v) ? <Unlock className="w-4 h-4 text-jg-primary" /> : <Lock className="w-4 h-4 text-gray-800" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Active Trials & Activity */}
                                <div className="space-y-6">
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 border-l-2 border-emerald-500 pl-4">Active Telemetry / Trials</h3>
                                    <div className="space-y-3">
                                        {Object.entries(inspectingUser.trials || {}).length === 0 ? (
                                            <div className="p-8 bg-black/40 border border-white/5 rounded-3xl text-center">
                                                <p className="text-[10px] text-gray-700 font-mono uppercase tracking-widest">No active trials detected</p>
                                            </div>
                                        ) : (
                                            Object.entries(inspectingUser.trials || {}).map(([ver, expiry]) => (
                                                <div key={ver} className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex justify-between items-center">
                                                    <div>
                                                        <span className="text-[10px] font-black text-white uppercase block">{ver} Trial</span>
                                                        <span className="text-[9px] text-emerald-400 font-mono">Expires: {new Date(expiry as string).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="text-[9px] font-black text-emerald-400 uppercase bg-emerald-500/10 px-2 py-1 rounded">Active</div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* System Messages & Notifications */}
                            <div className="space-y-6">
                                <h3 className="text-xs font-black uppercase tracking-[0.4em] text-gray-500 border-l-2 border-jg-accent pl-4">System Notifications Buffer</h3>
                                <div className="bg-black/40 border border-white/5 p-6 rounded-[2rem] flex flex-col gap-6">
                                    {inspectingUser.systemMessage ? (
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-4">
                                                <AlertTriangle className="w-5 h-5 text-jg-accent shrink-0" />
                                                <p className="text-sm text-gray-300 leading-relaxed font-mono italic">"{inspectingUser.systemMessage}"</p>
                                            </div>
                                            <button 
                                                onClick={() => dbService.clearSystemMessage(inspectingUser.uid)}
                                                className="text-[10px] font-black text-red-500 hover:text-white transition-all uppercase tracking-widest"
                                            >
                                                CLEAR MSG
                                            </button>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-gray-700 text-center font-mono">No active system messages waiting for delivery.</p>
                                    )}
                                </div>
                            </div>

                            {/* Critical Controls */}
                            <div className="pt-8 border-t border-white/5 flex gap-4">
                                {inspectingUser.isBanned ? (
                                    <button 
                                        onClick={() => dbService.unbanUser(inspectingUser.uid)}
                                        className="flex-1 py-5 bg-jg-primary hover:bg-blue-600 text-white font-black text-xs rounded-3xl uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40"
                                    >
                                        Lift Suspension
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => setSelectedUserForBan(inspectingUser.uid)}
                                        className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-3xl uppercase tracking-widest transition-all shadow-xl shadow-red-900/40"
                                    >
                                        Suspend Engineer Account
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Ban Confirmation Modal */}
            {selectedUserForBan && (
                <div className="fixed inset-0 z-[150] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6">
                    <div className="bg-jg-surface border-2 border-red-500/50 p-12 rounded-[3.5rem] max-w-md w-full shadow-[0_0_100px_rgba(239,68,68,0.3)] animate-in zoom-in-95 duration-200">
                        <div className="flex items-center gap-5 text-red-500 mb-8">
                            <AlertTriangle className="w-12 h-12 animate-pulse" />
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter">RESTRICT PROFILE</h3>
                        </div>
                        <p className="text-gray-400 text-sm mb-8 leading-relaxed font-medium">Enter a mandatory reason for restricting this account. This will be visible to the user before they are locked out.</p>
                        <textarea 
                            value={banReason}
                            onChange={e => setBanReason(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-3xl p-6 text-white text-sm focus:border-red-500 outline-none mb-8 h-44 resize-none font-mono"
                            placeholder="Type reason here..."
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setSelectedUserForBan(null)} className="flex-1 py-5 bg-gray-900 text-white font-black rounded-3xl tracking-widest text-[10px] uppercase hover:bg-gray-800 transition-all border border-white/5">Cancel</button>
                            <button onClick={() => handleBan(selectedUserForBan)} className="flex-1 py-5 bg-red-600 hover:bg-red-500 text-white font-black rounded-3xl tracking-widest text-[10px] uppercase shadow-2xl shadow-red-900/50 transition-all active:scale-95">Suspend Account</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
