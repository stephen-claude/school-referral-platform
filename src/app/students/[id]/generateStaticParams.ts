import { notFound } from 'next/navigation';

export function generateStaticParams() {
    // Return empty array for now - pages will be generated on-demand
    return [];
}

export const dynamicParams = true;
