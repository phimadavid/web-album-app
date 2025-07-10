import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Album Cover Design | Albummai',
    description: 'Generate and customize beautiful album templates with AI-powered design suggestions based on your photos and preferences',
    keywords: [
        'album cover',
        'template design',
        'AI template generation',
        'album design',
        'photo book templates',
        'custom album design',
        'automatic template creation',
        'design templates library'
    ],
    openGraph: {
        title: 'Album Template Design | Albummai',
        description: 'Generate and customize beautiful album templates with AI-powered design suggestions based on your photos and preferences',
        type: 'website',
        images: [
            {
                url: '/images/image-album.jpg',
                width: 1200,
                height: 630,
                alt: 'AI-powered album template design and generation'
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Album Template Design | Albummai',
        description: 'Generate and customize beautiful album templates with AI-powered design suggestions based on your photos and preferences',
        images: ['/images/image-album.jpg'],
    },
    robots: {
        index: false, // Template design pages typically shouldn't be indexed
        follow: true,
    },
};

export default function AlbumTemplateDesignLayout({
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
