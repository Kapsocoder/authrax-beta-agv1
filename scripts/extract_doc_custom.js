import mammoth from 'mammoth';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function extractText() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Please provide a file path.");
        process.exit(1);
    }

    const targetFile = args[0];
    const filePath = resolve(process.cwd(), targetFile);

    try {
        console.log(`\n--- extracting ${targetFile} ---`);
        const result = await mammoth.extractRawText({ path: filePath });
        console.log(result.value);
        console.log(`\n--- end of ${targetFile} ---`);
    } catch (error) {
        console.error(`Error reading ${targetFile}:`, error);
    }
}

extractText();
