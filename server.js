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

    let socketBuffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
        try {
            socketBuffer = Buffer.concat([socketBuffer, chunk]);

            while (socketBuffer.length >= 2) {
                const secondByte = socketBuffer[1];
                const isMasked = (secondByte & 0x80) !== 0;
                let payloadLength = secondByte & 0x7f;
                let headerSize = 2;

                if (payloadLength === 126) {
                    if (socketBuffer.length < 4) break;
                    payloadLength = socketBuffer.readUInt16BE(2);
                    headerSize = 4;
                } else if (payloadLength === 127) {
                    if (socketBuffer.length < 10) break;
                    payloadLength = Number(socketBuffer.readBigUInt64BE(2));
                    headerSize = 10;
                }

                if (isMasked) headerSize += 4;
                const totalFrameSize = headerSize + payloadLength;

                if (socketBuffer.length < totalFrameSize) {
                    // Frame not completely received yet, wait for next data chunk
                    break;
                }

                let maskKey = null;
                const maskOffset = headerSize - (isMasked ? 4 : 0);
                if (isMasked) {
                    maskKey = socketBuffer.slice(maskOffset, maskOffset + 4);
                }

                const payload = Buffer.alloc(payloadLength);
                const dataStart = headerSize;
                for (let i = 0; i < payloadLength; i++) {
                    payload[i] = isMasked ? socketBuffer[dataStart + i] ^ maskKey[i % 4] : socketBuffer[dataStart + i];
                }

                // Slice out the processed frame from buffer
                socketBuffer = socketBuffer.slice(totalFrameSize);

                const msg = payload.toString('utf8');
                const outFrame = encodeWebSocketFrame(msg);

                // Retransmit to all other connected clients
                for (const client of clients) {
                    if (client !== socket && client.writable) {
                        client.write(outFrame);
                    }
                }
            }
        } catch (err) {
            console.warn('WebSocket data processing error:', err);
            socketBuffer = Buffer.alloc(0);
        }
    });

    socket.on('close', () => clients.delete(socket));
    socket.on('error', () => clients.delete(socket));
});

function encodeWebSocketFrame(str) {
    const payload = Buffer.from(str, 'utf8');
    const len = payload.length;
    let header;

    if (len < 126) {
        header = Buffer.alloc(2);
        header[0] = 0x81; // Text frame
        header[1] = len;
    } else if (len <= 65535) {
        header = Buffer.alloc(4);
        header[0] = 0x81;
        header[1] = 126;
        header.writeUInt16BE(len, 2);
    } else {
        header = Buffer.alloc(10);
        header[0] = 0x81;
        header[1] = 127;
        header.writeBigUInt64BE(BigInt(len), 2);
    }

    return Buffer.concat([header, payload]);
}

server.listen(PORT, () => {
    console.log(`=============================================================`);
    console.log(`⚡ Servidor Quantum Motors (WebSocket + HTTP) activo en:`);
    console.log(`👉 http://localhost:${PORT}`);
    console.log(`=============================================================`);
});
