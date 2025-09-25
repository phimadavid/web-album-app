import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { imageUrl } = await request.json();

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'Image URL is required' },
                { status: 400 }
            );
        }

        // Validate URL format
        let url: URL;
        try {
            url = new URL(imageUrl);
        } catch (error) {
            return NextResponse.json(
                { error: 'Invalid URL format' },
                { status: 400 }
            );
        }

        // Security: Only allow certain domains or protocols
        const allowedProtocols = ['http:', 'https:'];
        if (!allowedProtocols.includes(url.protocol)) {
            return NextResponse.json(
                { error: 'Invalid protocol. Only HTTP and HTTPS are allowed.' },
                { status: 400 }
            );
        }

        // Optional: Add domain whitelist for additional security
        // const allowedDomains = ['images.unsplash.com', 'your-trusted-domain.com'];
        // if (!allowedDomains.includes(url.hostname)) {
        //     return NextResponse.json(
        //         { error: 'Domain not allowed' },
        //         { status: 403 }
        //     );
        // }

        // Fetch the image with proper headers
        const response = await fetch(imageUrl, {
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ImageProxy/1.0)',
                'Accept': 'image/*,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
            },
            // Set a reasonable timeout
            signal: AbortSignal.timeout(30000), // 30 seconds
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        // Check if the response is actually an image
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
            return NextResponse.json(
                { error: 'Response is not an image' },
                { status: 400 }
            );
        }

        // Check file size (limit to 10MB)
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
            return NextResponse.json(
                { error: 'Image too large (max 10MB)' },
                { status: 413 }
            );
        }

        // Get the image data
        const imageBuffer = await response.arrayBuffer();

        // Return the image with proper CORS headers
        return new NextResponse(imageBuffer, {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Length': imageBuffer.byteLength.toString(),
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
            },
        });

    } catch (error) {
        console.error('Image proxy error:', error);
        
        if (error instanceof Error) {
            if (error.name === 'AbortError') {
                return NextResponse.json(
                    { error: 'Request timeout' },
                    { status: 408 }
                );
            }
            
            return NextResponse.json(
                { error: `Proxy error: ${error.message}` },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { error: 'Unknown proxy error' },
            { status: 500 }
        );
    }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
}
