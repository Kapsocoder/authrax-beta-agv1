"use strict";
// Imports removed to prevent global cold-start crash
// import * as puppeteer from 'puppeteer-core';
// const chromium = require('@sparticuz/chromium');
Object.defineProperty(exports, "__esModule", { value: true });
exports.launchBrowser = void 0;
async function launchBrowser() {
    console.log("Launching browser...");
    // Lazy load dependencies here
    const chromium = require('@sparticuz/chromium');
    const puppeteer = require('puppeteer-core');
    // In strict Cloud Functions env:
    return await puppeteer.launch({
        args: [
            ...chromium.args,
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ],
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });
}
exports.launchBrowser = launchBrowser;
//# sourceMappingURL=browser.js.map