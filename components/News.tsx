
import React, { useState, useEffect } from 'react';
// Added Info to the imports from lucide-react
import { Newspaper, Bell, Zap, Calendar, ArrowRight, Sparkles, MessageSquare, Rocket, Trash2, Loader2, X, Share2, Bookmark, Info } from 'lucide-react';
import { dbService, NewsItem } from '../services/firebase';

interface NewsProps {
    isAdmin?: boolean;
}

export const News: React.FC<NewsProps> = ({ isAdmin }) => {
    const [announcements, setAnnouncements] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);

    useEffect(() => {
        const unsub = dbService.subscribeToNews((data) => {
            setAnnouncements(data);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const getIcon = (name: string) => {
        switch(name) {
            case 'Rocket': return Rocket;
            case 'Zap': return Zap;
            case 'Sparkles': return Sparkles;
            default: return Newspaper;
        }
    };

    const renderMarkdown = (text: string) => {
        // Very basic markdown parsing for a premium look
        return text.split('\n').map((line, i) => {
            if (line.startsWith('### ')) return <h3 key={i} className="text-lg font-black text-white mt-6 mb-3 uppercase tracking-wider">{line.replace('### ', '')}</h3>;
            if (line.startsWith('## ')) return <h2 key={i} className="text-xl font-black text-jg-primary mt-8 mb-4 uppercase italic">{line.replace('## ', '')}</h2>;
            if (line.startsWith('# ')) return <h1 key={i} className="text-3xl font-black text-white mt-10 mb-6 uppercase tracking-tight">{line.replace('# ', '')}</h1>;
            if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="text-gray-400 ml-4 mb-2 leading-relaxed">{line.substring(2)}</li>;
            if (line.startsWith('```')) return null; // Simple ignore for now
            if (!line.trim()) return <br key={i} />;
            return <p key={i} className="text-gray-300 leading-relaxed mb-4 text-base">{line}</p>;
        });
    };

    if (loading) {
        return (
            <div className="min-h-screen pt-24 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-jg-primary animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 bg-jg-dark animate-in fade-in duration-500 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 right-[-10%] w-96 h-96 bg-jg-primary/10 rounded-full blur-[120px] pointer-events-none"></div>
            <div className="absolute bottom-1/4 left-[-10%] w-96 h-96 bg-jg-accent/10 rounded-full blur-[120px] pointer-events-none"></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-jg-surface border border-jg-primary/20 text-jg-primary text-[10px] font-bold uppercase tracking-widest mb-6 shadow-sm">
                        <Bell className="w-3 h-3 animate-bounce" /> Official Updates
                    </div>
                    <h2 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight flex items-center justify-center gap-4">
                        <Newspaper className="w-10 h-10 md:w-12 md:h-12 text-jg-primary" />
                        The JG Newsroom
                    </h2>
                    <p className="text-lg text-jg-muted max-w-2xl mx-auto">
                        Stay informed about the latest specifications, features, and community developments in the JulyGod ecosystem.
                    </p>
                </div>

                <div className="space-y-6">
                    {announcements.length === 0 ? (
                        <div className="text-center py-20 border-2 border-dashed border-gray-800 rounded-3xl">
                            <p className="text-gray-600 font-mono text-sm tracking-widest uppercase">No broadcasted updates found.</p>
                        </div>
                    ) : (
                        announcements.map((news, idx) => {
                            const IconComp = getIcon(news.icon);
                            return (
                                <div key={news.id || idx} className="group p-6 md:p-8 rounded-3xl bg-jg-surface/50 border border-white/5 hover:border-jg-primary/30 transition-all duration-300 backdrop-blur-sm relative overflow-hidden">
                                    {isAdmin && (
                                        <button 
                                            onClick={() => dbService.deleteNews(news.id!)}
                                            className="absolute top-4 right-4 p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors z-20"
                                            title="Delete Post"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    )}
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                        <IconComp className="w-24 h-24" />
                                    </div>
                                    
                                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                                        <div className="w-14 h-14 shrink-0 rounded-2xl bg-jg-dark border border-white/5 flex items-center justify-center text-jg-primary shadow-inner">
                                            <IconComp className="w-6 h-6" />
                                        </div>
                                        
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <span className="px-2 py-0.5 rounded-md bg-jg-primary/10 text-jg-primary text-[10px] font-bold uppercase tracking-widest border border-jg-primary/20">
                                                    {news.tag}
                                                </span>
                                                <div className="flex items-center gap-1.5 text-xs text-jg-muted">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {news.date?.toDate?.().toLocaleDateString() || "Recent"}
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-xl md:text-2xl font-bold text-white group-hover:text-jg-primary transition-colors">
                                                {news.title}
                                            </h3>
                                            
                                            <p className="text-jg-muted leading-relaxed line-clamp-2">
                                                {news.description}
                                            </p>
                                            
                                            <button 
                                                onClick={() => setSelectedArticle(news)}
                                                className="pt-2 flex items-center gap-2 text-xs font-bold text-jg-primary hover:text-white transition-colors group/btn"
                                            >
                                                READ ARTICLE <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                <div className="mt-16 p-8 rounded-3xl bg-gradient-to-br from-jg-primary/20 to-jg-accent/20 border border-white/10 text-center relative overflow-hidden">
                    <div className="relative z-10">
                        <MessageSquare className="w-10 h-10 text-jg-primary mx-auto mb-4" />
                        <h4 className="text-xl font-bold text-white mb-2">Want to contribute?</h4>
                        <p className="text-sm text-gray-300 mb-6 max-w-md mx-auto">
                            The JG project is open to proposals for the V1.3 specification. Join our discussion boards to shape the future of readable engineering.
                        </p>
                        <button className="px-6 py-2.5 bg-white text-jg-dark font-black text-xs rounded-full hover:scale-105 transition-transform shadow-xl">
                            JOIN DISCORD
                        </button>
                    </div>
                    {/* Decorative shimmer */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-[-20deg] animate-[pulse_3s_infinite]"></div>
                </div>
            </div>

            {/* Article Reader Modal */}
            {selectedArticle && (
                <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-300">
                    <div className="bg-jg-surface border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[2.5rem] shadow-[0_0_100px_rgba(59,130,246,0.15)] overflow-hidden flex flex-col relative">
                        
                        {/* Modal Header */}
                        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-jg-primary/10 rounded-xl border border-jg-primary/20 text-jg-primary">
                                    {React.createElement(getIcon(selectedArticle.icon), { className: "w-6 h-6" })}
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-jg-primary uppercase tracking-[0.2em]">{selectedArticle.tag}</span>
                                    <h2 className="text-xl font-black text-white italic tracking-tight">{selectedArticle.title}</h2>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-jg-muted transition-all">
                                    <Share2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => setSelectedArticle(null)} className="p-3 bg-white/5 hover:bg-red-500 rounded-xl text-jg-muted hover:text-white transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Article Content */}
                        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                            <div className="max-w-2xl mx-auto">
                                <div className="flex items-center gap-3 mb-10 text-jg-muted border-b border-white/5 pb-4">
                                    <Calendar className="w-4 h-4" />
                                    <span className="text-xs font-mono uppercase tracking-widest">{selectedArticle.date?.toDate?.().toLocaleDateString() || "RECENT RELEASE"}</span>
                                    <span className="mx-2 opacity-20">|</span>
                                    <Bookmark className="w-4 h-4" />
                                    <span className="text-xs font-mono uppercase tracking-widest">OFFICIAL JG TELEMETRY</span>
                                </div>

                                {selectedArticle.fullArticle ? (
                                    <div className="article-body">
                                        {renderMarkdown(selectedArticle.fullArticle)}
                                    </div>
                                ) : (
                                    <div className="py-20 text-center">
                                        {/* Added Info icon which is now imported */}
                                        <Info className="w-16 h-16 text-white/5 mx-auto mb-6" />
                                        <p className="text-xl font-bold text-white mb-4 italic">Extended Telemetry Unavailable</p>
                                        <p className="text-gray-400 max-sm mx-auto leading-relaxed">{selectedArticle.description}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/5 text-center bg-black/20 shrink-0">
                            <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">© JULY GOD LANGUAGE SPECIFICATION BOARD</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
