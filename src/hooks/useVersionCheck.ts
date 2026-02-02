'use client';

import { useEffect, useState } from 'react';

const VERSION_CHECK_INTERVAL = 60000; // Check every 60 seconds

export function useVersionCheck() {
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [currentVersion, setCurrentVersion] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        const checkVersion = async () => {
            try {
                const response = await fetch('/version.json?t=' + Date.now(), {
                    cache: 'no-store',
                });
                const data = await response.json();
                const serverVersion = data.version;

                if (!currentVersion) {
                    // First load - store the version
                    setCurrentVersion(serverVersion);
                } else if (serverVersion !== currentVersion) {
                    // Version changed - update available
                    if (mounted) {
                        setUpdateAvailable(true);
                    }
                }
            } catch (error) {
                console.error('Version check failed:', error);
            }
        };

        // Check on mount
        checkVersion();

        // Check periodically
        const interval = setInterval(checkVersion, VERSION_CHECK_INTERVAL);

        return () => {
            mounted = false;
            clearInterval(interval);
        };
    }, [currentVersion]);

    const reload = () => {
        window.location.reload();
    };

    return { updateAvailable, reload };
}
