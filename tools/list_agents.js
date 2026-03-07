const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 18789,
    path: '/v1/agents',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer bf373b5a297c6dd2dddb89bf75585ac7dd0f17faa40b07ef',
        'Content-Type': 'application/json'
    }
};

console.log(`Listing Agents from http://${options.hostname}:${options.port}${options.path}...`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            console.log('✅ Agents Retrieved:');
            console.dir(json, { depth: null, colors: true });
        } catch (e) {
            console.log('⚠️ Response is not JSON:', data);
            console.log('BODY:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Connection Failed: ${e.message}`);
    if (e.code) console.error(`Code: ${e.code}`);
});

req.end();
