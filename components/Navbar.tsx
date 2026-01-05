import React from 'react';
import { Terminal, Code2, Book, Menu, X, ChevronDown, Lock, Unlock, Layers, LogIn, User, LogOut } from 'lucide-react';
import { JGVersion } from '../App';
import { authService } from '../services/firebase';

interface NavbarProps {
    currentView: 'home' | 'playground' | 'docs';
    setView: (view: 'home' | 'playground' | 'docs') => void;
    jgVersion: JGVersion;
    setJgVersion: (v: JGVersion) => void;
    unlockedVersions: JGVersion[];
    user: any; // Firebase User object
    onOpenAuth: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, setView, jgVersion, setJgVersion, unlockedVersions, user, onOpenAuth }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);

    const navItems = [
        { id: 'home', label: 'Home', icon: Terminal },
        { id: 'playground', label: 'Playground', icon: Code2 },
        { id: 'docs', label: 'Specification', icon: Book },
    ] as const;

    const getDisplayVersion = (v: JGVersion) => {
        switch(v) {
            case 'v0': return 'V0 Legacy';
            case 'v0.1-remastered': return 'V0.1 RM';
            case 'v1.0': return 'V1.0 Stable';
            case 'v1.1': return 'V1.1 Input';
            case 'v1.2': return 'V1.2 Final';
        }
    };

    const isLocked = (v: JGVersion) => {
        if (v === 'v1.0') return false; 
        return !unlockedVersions.includes(v);
    };

    const handleLogout = async () => {
        await authService.signOut();
        setIsMenuOpen(false);
        // Refresh page or state update handled by App.tsx subscription
    };

    const VersionOption = ({ v, label, price }: { v: JGVersion, label: string, price: string }) => {
        const locked = isLocked(v);
        const active = jgVersion === v;
        return (
            <button 
                onClick={() => {
                    setJgVersion(v);
                    setIsMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between group transition-colors ${
                    active ? 'bg-gray-800' : 'hover:bg-gray-700 bg-transparent'
                }`}
            >
                <div className="flex flex-col">
                    <span className={`font-medium ${
                        v === 'v1.2' ? 'text-purple-500' :
                        v === 'v1.1' ? 'text-indigo-400' : 
                        v === 'v1.0' ? 'text-blue-400' : 
                        v === 'v0.1-remastered' ? 'text-green-400' : 'text-gray-300'
                    }`}>
                        {label}
                    </span>
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">{price}</span>
                </div>
                
                {locked ? (
                    <Lock className="w-4 h-4 text-gray-500 group-hover:text-red-400 transition-colors" />
                ) : (
                    active && <Unlock className="w-4 h-4 text-jg-primary" />
                )}
            </button>
        );
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-jg-dark/95 backdrop-blur-xl border-b border-jg-surface">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <div 
                        className="flex-shrink-0 flex items-center cursor-pointer group select-none"
                        onClick={() => setView('home')}
                    >
                        <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-jg-primary to-jg-accent rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-xl shadow-lg group-hover:scale-105 transition-transform duration-200">
                            JG
                        </div>
                        <span className="ml-3 text-lg md:text-xl font-bold tracking-tight text-white group-hover:text-jg-primary transition-colors">
                            JulyGod
                        </span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="flex items-baseline space-x-2">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => setView(item.id)}
                                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                        currentView === item.id
                                            ? 'bg-jg-surface text-jg-primary shadow-sm'
                                            : 'text-jg-muted hover:text-white hover:bg-jg-surface/50'
                                    }`}
                                >
                                    <item.icon className="w-4 h-4 mr-2" />
                                    {item.label}
                                </button>
                            ))}
                        </div>

                        {/* Desktop Version Selector */}
                        <div className="relative group ml-4">
                            <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-3 py-1.5 rounded-full text-xs font-mono border border-gray-600 transition-colors">
                                <span className={
                                    jgVersion === 'v1.2' ? 'text-purple-500' :
                                    jgVersion === 'v1.1' ? 'text-indigo-400' :
                                    jgVersion === 'v1.0' ? 'text-blue-400' : 
                                    (jgVersion === 'v0.1-remastered' ? 'text-green-400' : 'text-gray-400')
                                }>
                                    {getDisplayVersion(jgVersion)}
                                </span>
                                <ChevronDown className="w-3 h-3 text-gray-400" />
                            </button>
                            <div className="absolute right-0 mt-2 w-64 bg-jg-surface border border-gray-700 rounded-md shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-right ring-1 ring-black ring-opacity-5 z-50">
                                <VersionOption v="v1.2" label="V1.2 Final (Types)" price="₹1400 Flagship" />
                                <VersionOption v="v1.1" label="V1.1 Interactive" price="₹800" />
                                <VersionOption v="v1.0" label="V1.0 Stable" price="3 Free/Day" />
                                <VersionOption v="v0.1-remastered" label="V0.1 Remastered" price="Free" />
                                <VersionOption v="v0" label="Version 0 Legacy" price="₹20" />
                            </div>
                        </div>

                        {/* Auth Button (Desktop) */}
                        <div className="ml-2 pl-2 border-l border-gray-700">
                             {user ? (
                                <div className="group relative">
                                    <button className="flex items-center gap-2 text-sm text-gray-300 hover:text-white">
                                        <div className="w-8 h-8 rounded-full bg-jg-primary/20 flex items-center justify-center border border-jg-primary/50">
                                            <User className="w-4 h-4 text-jg-primary" />
                                        </div>
                                    </button>
                                    <div className="absolute right-0 mt-2 w-48 bg-jg-surface border border-gray-700 rounded-md shadow-xl overflow-hidden opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 p-2">
                                        <div className="px-2 py-1 mb-2 border-b border-gray-800">
                                            <p className="text-xs text-white font-bold truncate">{user.displayName || 'User'}</p>
                                            <p className="text-[10px] text-gray-500 truncate">{user.email}</p>
                                        </div>
                                        <button onClick={handleLogout} className="w-full text-left px-2 py-1.5 text-xs text-red-400 hover:bg-gray-800 rounded flex items-center gap-2">
                                            <LogOut className="w-3 h-3" /> Sign Out
                                        </button>
                                    </div>
                                </div>
                             ) : (
                                <button 
                                    onClick={onOpenAuth}
                                    className="flex items-center px-4 py-1.5 rounded-full bg-jg-primary hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/20"
                                >
                                    <LogIn className="w-3 h-3 mr-1.5" /> Sign In
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Mobile Menu Toggle */}
                    <div className="md:hidden flex items-center space-x-3">
                         <div className="text-[10px] font-mono bg-gray-800 px-2 py-1 rounded border border-gray-700 text-gray-400">
                            {getDisplayVersion(jgVersion)}
                        </div>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="inline-flex items-center justify-center p-2 rounded-md text-jg-muted hover:text-white hover:bg-jg-surface focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-jg-dark/95 backdrop-blur-xl border-b border-gray-800 absolute w-full z-50 animate-in slide-in-from-top-2 duration-200">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {/* Nav Links */}
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setView(item.id);
                                    setIsMenuOpen(false);
                                }}
                                className={`flex items-center w-full px-4 py-3 rounded-md text-base font-medium ${
                                    currentView === item.id
                                        ? 'bg-jg-surface text-jg-primary border border-gray-700'
                                        : 'text-jg-muted hover:text-white hover:bg-jg-surface'
                                }`}
                            >
                                <item.icon className="w-5 h-5 mr-3" />
                                {item.label}
                            </button>
                        ))}
                    </div>
                    
                    {/* Mobile Auth */}
                    <div className="px-4 py-3 border-t border-gray-800">
                        {user ? (
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                     <div className="w-8 h-8 rounded-full bg-jg-primary/20 flex items-center justify-center">
                                        <User className="w-4 h-4 text-jg-primary" />
                                    </div>
                                    <span className="text-sm text-white">{user.displayName}</span>
                                </div>
                                <button onClick={handleLogout} className="text-xs text-red-400 border border-red-900/50 px-2 py-1 rounded bg-red-900/10">Sign Out</button>
                            </div>
                        ) : (
                             <button 
                                onClick={() => { setIsMenuOpen(false); onOpenAuth(); }}
                                className="w-full py-2 bg-jg-primary text-white rounded font-bold text-sm flex items-center justify-center gap-2"
                            >
                                <LogIn className="w-4 h-4" /> Sign In / Sign Up
                            </button>
                        )}
                    </div>

                    {/* Mobile Version Selector */}
                    <div className="border-t border-gray-800 p-2">
                        <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-3 h-3" /> Select Version
                        </div>
                        <div className="space-y-1">
                            <VersionOption v="v1.2" label="V1.2 Final" price="₹1400 Flagship" />
                            <VersionOption v="v1.1" label="V1.1 Interactive" price="₹800" />
                            <VersionOption v="v1.0" label="V1.0 Stable" price="3 Free/Day" />
                            <VersionOption v="v0.1-remastered" label="V0.1 Remastered" price="Free" />
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};