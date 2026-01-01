
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';

async function listModels() {
    const projectId = 'authrax-beta-lv1'; // Hardcoded for this debug script
    const location = 'us-central1';

    console.log(`Authenticating for project ${projectId}...`);
    const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    console.log(`Listing models in ${location}...`);

    try {
        const response = await axios.get(
            `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models`,
            {
                headers: {
                    'Authorization': `Bearer ${token.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const models = response.data.models || [];
        console.log(`Found ${models.length} models.`);

        const relevantModels = models.filter((m: any) =>
            m.name.includes('gemini') || m.name.includes('image') || m.name.includes('flash')
        );

        console.log("\n--- RELEVANT MODELS FOUND ---");
        relevantModels.forEach((m: any) => {
            const modelId = m.name.split('/').pop();
            console.log(`ID: ${modelId}`);
            console.log(`Name: ${m.name}`);
            console.log(`Version: ${m.versionId}`);
            console.log(`Description: ${m.versionDescription || 'N/A'}`);
            console.log("---------------------------------------------------");
        });

    } catch (error: any) {
        console.error("Error listing models:", error.response?.data || error.message);
    }
}

listModels();
