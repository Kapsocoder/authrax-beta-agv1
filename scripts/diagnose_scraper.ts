
import puppeteer from 'puppeteer';

const TARGET_URL = 'https://www.linkedin.com/in/ksabharwal/';

async function runDiagnosis() {
    console.log("Starting Diagnosis...");
    console.log(`Target URL: ${TARGET_URL}`);

    const browser = await puppeteer.launch({
        headless: true, // Set to false to see it opening
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();

        // 1. Block Resources (Same as optimization)
        await page.setRequestInterception(true);
        page.on('request', (req) => {
            if (['image', 'stylesheet', 'font', 'media'].includes(req.resourceType())) {
                req.abort();
            } else {
                req.continue();
            }
        });

        // 2. Stealth User Agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
        });

        console.log("Navigating...");
        const startTime = Date.now();

        // 3. Navigation Strategy
        try {
            await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        } catch (e) {
            console.log("Goto timeout (expected if waiting for networkidle), continuing...");
        }

        console.log(`Page loaded in ${(Date.now() - startTime) / 1000}s. Waiting 5s for hydration...`);
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 4. Extraction
        console.log("Extracting data...");
        const title = await page.title();
        console.log(`Page Title: ${title}`);

        const result = await page.evaluate(() => {
            const h1 = document.querySelector('h1')?.textContent?.trim();

            // Meta tags strategy
            const metaDesc = document.querySelector('meta[property="og:description"]')?.content;
            const metaTitle = document.querySelector('meta[property="og:title"]')?.content;

            return { h1, metaDesc, metaTitle };
        });

        console.log("Extraction Result:", JSON.stringify(result, null, 2));

        if (title.includes("Sign Up") || title.includes("Log In")) {
            console.log("WARNING: Hit Auth Wall / Login Page.");
        } else {
            console.log("SUCCESS: Accessed public profile page.");
        }

    } catch (error) {
        console.error("Diagnosis Failed:", error);
    } finally {
        await browser.close();
        console.log("Diagnosis Complete.");
    }
}

runDiagnosis();
