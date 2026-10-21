/**
 * server.js - Servidor WebSocket + HTTP Estático Cero-Dependencias para Quantum Crew
 * Permite jugar en red local (LAN) hasta 6 jugadores por sala sin instalar paquetes npm.
 *
 * Uso opcional para juego en red entre varias computadoras:
 *   node server.js
 * Luego abre http://localhost:8080 en hasta 6 navegadores.
 * (Nota: También puedes abrir index.html directamente sin ejecutar este servidor).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    const filePath = path.join(__dirname, reqPath);
    const ext = path.extname(filePath).toLowerCase();

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('404 - Archivo no encontrado');
            return;
        }
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(content);
    });
});

// Clientes WebSocket conectados
const clients = new Set();

server.on('upgrade', (req, socket) => {
    if (req.headers['upgrade'] !== 'websocket') {
        socket.end('HTTP/1.1 400 Bad Request');
        return;
    }

    const acceptKey = req.headers['sec-websocket-key'];
    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const hash = crypto.createHash('sha1').update(acceptKey + GUID).digest('base64');

    const responseHeaders = [
        'HTTP/1.1 101 Switching Protocols',
        'Upgrade: websocket',
        'Connection: Upgrade',
        `Sec-WebSocket-Accept: ${hash}`,
        '\r\n'
    ];

    socket.write(responseHeaders.join('\r\n'));
    clients.add(socket);

    socket.on('data', (buffer) => {
        const msg = decodeWebSocketFrame(buffer);
        if (!msg) return;

        // Retransmitir a todos los demás jugadores conectados (máx 6 por sala gestionado en cliente/sala)
        const outFrame = encodeWebSocketFrame(msg);
        for (const client of clients) {
            if (client !== socket && client.writable) {
                client.write(outFrame);
            }
        }
    });

    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
});

function decodeWebSocketFrame(buffer) {
    if (buffer.length < 2) return null;
    const secondByte = buffer[1];
    const isMasked = (secondByte & 0x80) !== 0;
    let payloadLength = secondByte & 0x7f;
    let offset = 2;

    if (payloadLength === 126) {
        payloadLength = buffer.readUInt16BE(2);
        offset = 4;
    } else if (payloadLength === 127) {
        return null; // Ignorar tramas gigantes
    }

    let maskKey = null;
    if (isMasked) {
        maskKey = buffer.slice(offset, offset + 4);
        offset += 4;
    }

    const payload = Buffer.alloc(payloadLength);
    for (let i = 0; i < payloadLength && offset + i < buffer.length; i++) {
        payload[i] = isMasked ? buffer[offset + i] ^ maskKey[i % 4] : buffer[offset + i];
    }

    return payload.toString('utf8');
}

function encodeWebSocketFrame(str) {
    const payload = Buffer.from(str, 'utf8');
    const len = payload.length;
    let header;

    if (len < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81; // Text frame
        header[1] = len;
    } else {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    }

    return Buffer.concat([header, payload]);
}

server.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`⚡ Servidor Quantum Motors (WebSocket + HTTP) activo en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`=============================================================`);
});
