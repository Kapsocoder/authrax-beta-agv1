import mammoth from 'mammoth';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const files = [
    '../data_export/Manus - linkedin_content_strategy_report.docx',
    '../data_export/Manus - LinkedIn_Content_Template_Mapping.docx'
];

async function extractText() {
    for (const file of files) {
        const filePath = join(__dirname, file);
        try {
            console.log(`\n--- extracting ${file} ---`);
            const result = await mammoth.extractRawText({ path: filePath });
            console.log(result.value);
            console.log(`\n--- end of ${file} ---`);
        } catch (error) {
            console.error(`Error reading ${file}:`, error);
        }
    }
}

extractText();
