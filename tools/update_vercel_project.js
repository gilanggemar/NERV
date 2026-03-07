const https = require('https');

const TOKEN = process.env.VERCEL_TOKEN || 'YOUR_VERCEL_TOKEN';
const PROJECT_ID = 'prj_umn49c6DV16uFohzLD0dYzJ0An71';
const TEAM_ID = 'team_DFjfeII8DrgoxxKvET5Teksh';

async function updateProject() {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({
            framework: "nextjs",
            rootDirectory: "dashboard"
        });

        const options = {
            hostname: 'api.vercel.com',
            path: '/v9/projects/' + PROJECT_ID + '?teamId=' + TEAM_ID,
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + TOKEN,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log(`✓ Successfully updated project settings!`);
                } else {
                    console.log(`x Failed to update. Status: ${res.statusCode}, Resp: ${data}`);
                }
                resolve();
            });
        });

        req.on('error', (e) => reject(e));
        req.write(body);
        req.end();
    });
}

updateProject();
