import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    let targetUrl: URL;
    try { targetUrl = new URL(url); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }

    // Detect platform
    const hostname = targetUrl.hostname;
    const isThreads = hostname.includes('threads.net');

    const res = await fetch(targetUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return NextResponse.json({ error: `Fetch failed: ${res.status}` }, { status: 400 });
    const html = await res.text();

    // Extract OG data
    const ogTitle = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]*)"[^>]*>/i)?.[1] ||
                    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:title"[^>]*>/i)?.[1] || '';
    const ogDesc = html.match(/<meta[^>]*property="og:description"[^>]*content="([^"]*)"[^>]*>/i)?.[1] ||
                   html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:description"[^>]*>/i)?.[1] || '';
    const ogImage = html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]*)"[^>]*>/i)?.[1] ||
                    html.match(/<meta[^>]*content="([^"]*)"[^>]*property="og:image"[^>]*>/i)?.[1] || '';

    // Extract media URLs from Threads
    const mediaUrls: string[] = [];
    if (ogImage) mediaUrls.push(ogImage);

    // Video URLs
    const videoMatches = Array.from(html.matchAll(/"(https:\/\/[^"]*\.mp4[^"]*?)"/gi));
for (const m of videoMatches) { if (!mediaUrls.includes(m[1])) mediaUrls.push(m[1]); }

    // Clean text
    let text = ogDesc || ogTitle;
    text = text.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)));
    text = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"');
    text = text.replace(/\s+/g, ' ').trim();

    if (text.length > 3000) text = text.substring(0, 3000) + '...';

    return NextResponse.json({
      source_text: text,
      title: ogTitle.replace(/\s+/g, ' ').trim(),
      media_urls: mediaUrls.slice(0, 10),
      platform: isThreads ? 'threads' : 'other',
    });
  } catch (err) {
    console.error('Extract error:', err);
    return NextResponse.json({ error: 'Failed to extract content' }, { status: 500 });
  }
}
