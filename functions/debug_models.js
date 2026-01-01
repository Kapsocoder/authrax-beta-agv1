
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

async function testModels() {
    console.log(`Loading credentials...`);
    const auth = new GoogleAuth({
        keyFile: '../serviceAccountKey.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const projectId = await auth.getProjectId();
    const creds = await auth.getCredentials();
    console.log(`Authenticated for Project ID: ${projectId}`);
    console.log(`Service Account Email: ${creds.client_email}`);

    const location = 'us-central1';
    const client = await auth.getClient();
    const token = await client.getAccessToken();

    const candidates = [
        'gemini-1.5-flash',
        'gemini-2.5-flash-image',
        'gemini-2.5-flash-image-preview',
        'imagegeneration@006' // Imagen 2 checks
    ];

    console.log(`\nTesting models in ${location}...\n`);

    for (const modelId of candidates) {
        console.log(`--- Testing ${modelId} ---`);

        let endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`;
        let payload = {
            contents: [{
                role: "user",
                parts: [{ text: "Explain this." }] // Simple prompt
            }]
        };

        // Special handling for Imagen 2 (uses predict)
        if (modelId.startsWith('imagegeneration')) {
            endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`;
            payload = {
                instances: [{ prompt: "A drawing of a cat" }],
                parameters: { sampleCount: 1, aspectRatio: "1:1" }
            };
        }

        try {
            const response = await axios.post(
                endpoint,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${token.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            console.log(`✅ SUCCESS: ${modelId} is available (Status: ${response.status})`);
        } catch (error) {
            const status = error.response?.status;
            const msg = error.response?.data?.error?.message || error.message;
            console.log(`❌ FAILED: ${modelId} (Status: ${status}) - ${msg}`);
        }
    }
}

testModels();
