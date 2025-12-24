
async function testNative() {
    const query = encodeURIComponent('site:linkedin.com/posts AI');
    // Using Google News RSS search
    const url = `https://news.google.com/rss/search?q=${query}&hl=en-US&gl=US&ceid=US:en`;
    console.log(`Fetching ${url}...`);
    try {
        const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const text = await res.text();
        const itemCount = (text.match(/<item>/g) || []).length;
        console.log(`Found items: ${itemCount}`);
        if (itemCount === 0) console.log("Response Preview:", text.substring(0, 500));

        // Also try just "LinkedIn" + Topic to see if standard news picks it up
        const query2 = encodeURIComponent('LinkedIn "AI"');
        const url2 = `https://news.google.com/rss/search?q=${query2}&hl=en-US&gl=US&ceid=US:en`;
        console.log(`\nFetching ${url2}...`);
        const res2 = await fetch(url2, { headers: { 'User-Agent': 'Mozilla/5.0' } });
        const text2 = await res2.text();
        const itemCount2 = (text2.match(/<item>/g) || []).length;
        console.log(`Found items for query 2: ${itemCount2}`);

    } catch (e) { console.error(e); }
}

testNative();
