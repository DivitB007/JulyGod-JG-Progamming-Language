import React from 'react';

export const Footer: React.FC = () => {
    return (
        <footer className="bg-jg-surface border-t border-gray-800 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
                <div className="mb-4 md:mb-0">
                    <span className="text-xl font-bold text-white">JulyGod</span>
                    <p className="text-sm text-gray-500 mt-1">Readable first. Powerful always.</p>
                </div>
                <div className="flex flex-col items-end">
                    <p className="text-sm text-gray-500">&copy; {new Date().getFullYear()} JG Language Project.</p>
                    <p className="text-xs text-gray-600 mt-1">Version 0 Specification</p>
                </div>
            </div>
        </footer>
    );
};