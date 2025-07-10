import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Create New Album | Albummai',
    description: 'Start creating your personalized photo album with AI-powered design and organization tools',
    keywords: [
        'create photo album',
        'new album',
        'photo album creation',
        'AI album design',
        'custom photo book',
        'album maker',
        'photo collection'
    ],
    openGraph: {
        title: 'Create New Album | Albummai',
        description: 'Start creating your personalized photo album with AI-powered design and organization tools',
        type: 'website',
        images: [
            {
                url: '/images/image-album.jpg',
                width: 1200,
                height: 630,
                alt: 'Create your personalized photo album'
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Create New Album | Albummai',
        description: 'Start creating your personalized photo album with AI-powered design and organization tools',
        images: ['/images/image-album.jpg'],
    },
    robots: {
        index: true,
        follow: true,
    },
};

export default function CreateLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            {children}
        </>
    );
}
