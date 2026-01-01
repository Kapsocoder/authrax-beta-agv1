
const axios = require('axios');
const { GoogleAuth } = require('google-auth-library');

async function testImageGen() {
    console.log(`Loading credentials...`);
    const auth = new GoogleAuth({
        keyFile: '../serviceAccountKey.json',
        scopes: ['https://www.googleapis.com/auth/cloud-platform']
    });

    const projectId = await auth.getProjectId();
    const location = 'us-central1';
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    const modelId = 'gemini-2.5-flash-image';

    console.log(`Generating image with ${modelId}...`);

    try {
        const response = await axios.post(
            `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:generateContent`,
            {
                contents: [{
                    role: "user",
                    parts: [{ text: "Generate an image of a futuristic neon city skyline at night." }]
                }]
            },
            {
                headers: {
                    'Authorization': `Bearer ${token.token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        console.log("Response Status:", response.status);
        console.log("Full Response Data:");
        console.dir(response.data, { depth: null });

    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Response:", JSON.stringify(error.response.data, null, 2));
        }
    }
}

testImageGen();
