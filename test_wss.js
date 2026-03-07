const ws = new WebSocket('wss://srv1335911.tailececae.ts.net/', {
    headers: {
        origin: 'https://nerv-phi.vercel.app' // Vercel dashboard origin
    }
});

ws.addEventListener('open', () => {
    console.log('Connected directly to WSS successfully even with Origin header!');
    ws.close();
});

ws.addEventListener('error', (event) => {
    console.error('WebSocket Error:', event.message || event);
});

ws.addEventListener('close', (event) => {
    console.log(`Connection closed with code ${event.code}, reason: ${event.reason}`);
});
