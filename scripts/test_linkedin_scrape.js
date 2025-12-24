
async function testScrape() {
    // Example Google News Redirect URL (from previous output)
    const googleUrl = "https://news.google.com/rss/articles/CBMiogFBVV95cUxOQ0pKa3FvRnRqdkh5TG15R2VNMXRmRDJnOWVFaWhjbnJJOW5odkZPNHhoaVEtdEI5V3NzbjB0b3RpN2NvcmRNZThEZHZMYjZQeG1HQUdWU2lRTHJpMG53c0VsZkgyQ09rNzEzeTBRYl9LNlBkYnRVUnJSVm56YlprUDBVWVRVaWxNTzJyS25QSEFOejk2ekp2Z0Y4NVduLUktR0E?oc=5";

    console.log("Fetching Google Redirect URL...");
    try {
        const response = await fetch(googleUrl, {
            redirect: 'follow',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        console.log("Final URL:", response.url);

        if (response.url.includes("linkedin.com")) {
            console.log("reached LinkedIn. Fetching content...");
            const html = await response.text();

            // Check for specific markers
            const reactionMatch = html.match(/"numLikes":(\d+)/) || html.match(/data-num-likes="(\d+)"/);
            const commentMatch = html.match(/"numComments":(\d+)/) || html.match(/data-num-comments="(\d+)"/);

            console.log("Reaction Match:", reactionMatch ? reactionMatch[1] : "None");
            console.log("Comment Match:", commentMatch ? commentMatch[1] : "None");
        } else {
            console.log("Did not resolve to LinkedIn URL. Current URL:", response.url);
            const html = await response.text();
            console.log("HTML First 1000 chars:", html.substring(0, 1000));

            // Try to find the real link
            const urlMatch = html.match(/<a[^>]+href="([^"]+)"[^>]*>Opening/i) || html.match(/(https:\/\/[^"]+linkedin\.com[^"]+)/);
            if (urlMatch) {
                console.log("Found potential target URL:", urlMatch[1]);
            }
        }

    } catch (e) {
        console.error("Error:", e);
    }
}

testScrape();
