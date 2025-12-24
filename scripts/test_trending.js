
async function testTrending() {
    const url = 'https://us-central1-authrax-beta-lv1.cloudfunctions.net/fetchTrending';

    console.log(`Calling ${url}...`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                data: {
                    topics: ['Machine Learning'],
                    type: 'all',
                    timeframe: '7d'
                }
            })
        });

        const text = await response.text();
        console.log('Status:', response.status);
        console.log('Raw Response:', text);

        if (response.ok) {
            try {
                const json = JSON.parse(text);
                const result = json.result || json.data || json; // Handle wrapped responses

                console.log(`\n--- Trending News (${result.news?.length || 0}) ---`);
                (result.news || []).slice(0, 3).forEach(n => console.log(`[${n.source}] ${n.title}`));

                console.log(`\n--- Trending Posts (${result.posts?.length || 0}) ---`);
                (result.posts || []).slice(0, 10).forEach(p => {
                    console.log(`[${p.subreddit || p.source_name || '?'}] ${p.title} \n   -> ${p.url}`);
                });
                console.log(`-------------------------------\n`);
            } catch (e) {
                console.log("Could not parse JSON", e);
                console.log("Raw:", text.substring(0, 500));
            }
        }
    } catch (error) {
        console.error('Error fetching:', error);
    }
}

testTrending();
