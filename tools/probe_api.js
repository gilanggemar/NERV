const http = require('http');

const paths = [
    '/api/v1/models',
    '/api/models',
    '/models',
    '/v1/system/status',
    '/status',
    '/health',
    '/api/agents',
    '/agents'
];

const options = {
    hostname: '127.0.0.1',
    port: 18789,
    method: 'GET',
    headers: {
        'Authorization': 'Bearer bf373b5a297c6dd2dddb89bf75585ac7dd0f17faa40b07ef',
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

paths.forEach(path => {
    const opts = { ...options, path };
    const req = http.request(opts, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
            const isJson = data.trim().startsWith('{') || data.trim().startsWith('[');
            console.log(`[${res.statusCode}] ${path} -> ${isJson ? 'JSON ✅' : 'HTML/Text ❌'}`);
            if (isJson) console.log(data.substring(0, 100) + '...');
        });
    });
    req.on('error', e => console.error(`${path}: ${e.message}`));
    req.end();
});
