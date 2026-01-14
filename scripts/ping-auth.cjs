const http = require('http');

const options = {
    hostname: 'localhost',
    port: 9099,
    path: '/',
    method: 'GET',
    timeout: 2000
};

const req = http.request(options, (res) => {
    console.log(`Auth Emulator Status: ${res.statusCode}`);
    res.on('data', d => { });
});

req.on('error', (error) => {
    console.error(`Auth Emulator Connection Error: ${error.message}`);
});

req.end();
