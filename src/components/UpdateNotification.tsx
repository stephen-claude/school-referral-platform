'use client';

import { useVersionCheck } from '@/hooks/useVersionCheck';
import { useEffect, useState } from 'react';

export function UpdateNotification() {
    const { updateAvailable, reload } = useVersionCheck();
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (updateAvailable) {
            setShow(true);
        }
    }, [updateAvailable]);

    if (!show) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-blue-600 text-white px-4 py-3 shadow-lg">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">A new version is available!</span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={reload}
                        className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                    >
                        Update Now
                    </button>
                    <button
                        onClick={() => setShow(false)}
                        className="text-white hover:text-blue-100 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
