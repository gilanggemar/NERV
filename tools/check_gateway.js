const http = require('http');

const options = {
    hostname: '127.0.0.1',
    port: 18789,
    path: '/v1/models',
    method: 'GET',
    headers: {
        'Authorization': 'Bearer bf373b5a297c6dd2dddb89bf75585ac7dd0f17faa40b07ef',
        'Content-Type': 'application/json'
    }
};

console.log(`Pinging Gateway at http://${options.hostname}:${options.port}${options.path}...`);

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('BODY:', data);
        try {
            const json = JSON.parse(data);
            console.log('✅ Gateway Connection Verified!');
            console.log(`Found ${json.data ? json.data.length : 'unknown'} models.`);
        } catch (e) {
            console.log('⚠️ Response is not JSON:', data);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ Connection Failed: ${e.message}`);
    if (e.code) console.error(`Code: ${e.code}`);
    console.dir(e);
});

req.end();
