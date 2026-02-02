import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function useRequireAuth(allowedRoles?: string[]) {
    const { user, userProfile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/auth/login');
        }

        if (!loading && user && userProfile && allowedRoles) {
            if (!allowedRoles.includes(userProfile.role)) {
                router.push('/dashboard');
            }
        }
    }, [user, userProfile, loading, router, allowedRoles]);

    return { user, userProfile, loading };
}
