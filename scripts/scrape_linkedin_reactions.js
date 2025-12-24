
import puppeteer from 'puppeteer';

// To run this script:
// 1. npm install puppeteer
// 2. node scripts/scrape_linkedin_reactions.js

async function scrapeLinkedInReactions(googleNewsUrl) {
    console.log(`Starting scrape for: ${googleNewsUrl.substring(0, 50)}...`);

    let browser;
    try {
        browser = await puppeteer.launch({
            headless: "new", // Use new headless mode
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        // Set a realistic User Agent to avoid immediate blocking
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Navigate to the Google News URL
        console.log("Navigating to Google News URL...");
        await page.goto(googleNewsUrl, { waitUntil: 'networkidle0', timeout: 30000 });

        console.log("Checking current URL...");
        let currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);

        if (currentUrl.includes("news.google.com")) {
            console.log("Still on Google News. Looking for redirect link...");
            try {
                await page.waitForNavigation({ timeout: 10000 }).catch(() => console.log("No further navigation happened automatically."));
            } catch (e) { }

            currentUrl = page.url();
        }

        if (currentUrl.includes("linkedin.com")) {
            console.log("Successfully reached LinkedIn!");

            // Wait for content to load
            try {
                await page.waitForSelector('main, h1', { timeout: 5000 });
            } catch (e) { }

            const title = await page.title();
            console.log(`Page Title: ${title}`);

            const html = await page.content();

            // 1. Try Regex on HTML (fastest)
            let reactionMatch = html.match(/urn:li:activity:(\d+).*?"numLikes":(\d+)/) || html.match(/"numLikes":(\d+)/);
            let commentMatch = html.match(/"numComments":(\d+)/);

            // 2. Try JSON-LD (Structured Data)
            try {
                const jsonLds = await page.$$eval('script[type="application/ld+json"]', scripts => scripts.map(s => JSON.parse(s.innerText)));
                console.log("Found JSON-LD blocks:", jsonLds.length);
                jsonLds.forEach(data => {
                    if (data.interactionStatistic) {
                        data.interactionStatistic.forEach(stat => {
                            if (stat.interactionType?.includes("LikeAction")) {
                                reactionMatch = [null, null, stat.userInteractionCount];
                            }
                            if (stat.interactionType?.includes("CommentAction")) {
                                commentMatch = [null, stat.userInteractionCount];
                            }
                        });
                    }
                });
            } catch (e) {
                console.log("Error parsing JSON-LD:", e.message);
            }

            const reactions = reactionMatch ? reactionMatch[2] || reactionMatch[1] : null;
            const comments = commentMatch ? commentMatch[1] : null;

            console.log("\n--- Scraping Results ---");
            console.log(`Post URL: ${currentUrl}`);
            console.log(`Reactions: ${reactions || "Not found"}`);
            console.log(`Comments: ${comments || "Not found"}`);

            return { reactions, comments };
        } else {
            console.log("Failed to resolve to a LinkedIn URL.");
            console.log("Final URL was:", currentUrl);
            return null;
        }

    } catch (error) {
        console.error("Scraping failed:", error);
    } finally {
        if (browser) await browser.close();
    }
}

// Example usage with a known Google News -> LinkedIn link
// Note: URLs expire, so this might need a fresh one from the detailed log of the previous command
const testUrl = "https://news.google.com/rss/articles/CBMiogFBVV95cUxOQ0pKa3FvRnRqdkh5TG15R2VNMXRmRDJnOWVFaWhjbnJJOW5odkZPNHhoaVEtdEI5V3NzbjB0b3RpN2NvcmRNZThEZHZMYjZQeG1HQUdWU2lRTHJpMG53c0VsZkgyQ09rNzEzeTBRYl9LNlBkYnRVUnJSVm56YlprUDBVWVRVaWxNTzJyS25QSEFOejk2ekp2Z0Y4NVduLUktR0E?oc=5";

scrapeLinkedInReactions(testUrl);
