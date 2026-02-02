import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
    children: ReactNode;
    className?: string;
    hover?: boolean;
    gradient?: boolean;
}

export function Card({ children, className, hover = false, gradient = false }: CardProps) {
    return (
        <div
            className={cn(
                'rounded-2xl bg-white shadow-md border border-gray-100',
                gradient && 'bg-gradient-to-br from-white to-gray-50',
                hover && 'transition-all hover:shadow-lg hover:-translate-y-0.5',
                className
            )}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className

}: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-5 border-b border-gray-100', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
    return <h3 className={cn('text-2xl font-bold text-gray-900', className)}>{children}</h3>;
}

export function CardDescription({ children, className }: { children: ReactNode; className?: string }) {
    return <p className={cn('text-sm text-gray-600 mt-1', className)}>{children}</p>;
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-5', className)}>{children}</div>;
}

export function CardFooter({ children, className }: { children: ReactNode; className?: string }) {
    return <div className={cn('px-6 py-4 bg-gray-50 rounded-b-2xl', className)}>{children}</div>;
}
