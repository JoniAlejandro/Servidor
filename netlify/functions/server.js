import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { handler as serverlessHandler } from 'serverless-http';
import { Procesos } from '../../src/js/Procesos.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const procesos = new Procesos();

const httpServer = createServer((req, res) => {
  if (req.method === "GET") {
    const url = req.url === '/' ? '/index.html' : req.url;
    const filePath = path.join(__dirname, '../../', url);

    if (fs.existsSync(filePath)) {
      const fileStream = fs.createReadStream(filePath);

      if (url.match(/.html$/)) res.writeHead(200, { 'Content-Type': 'text/html; charset=UTF-8' });
      else if (url.match(/.css$/)) res.writeHead(200, { 'Content-Type': 'text/css; charset=UTF-8' });
      else if (url.match(/.js$/)) res.writeHead(200, { 'Content-Type': 'text/javascript; charset=UTF-8' });
      else if (url.match(/.ico$/)) res.writeHead(200, { 'Content-Type': 'image/x-icon' });
      else if (url.match(/.png$/)) res.writeHead(200, { 'Content-Type': 'image/png' });
      else if (url.match(/.jpg$/) || url.match(/.jpeg$/)) res.writeHead(200, { 'Content-Type': 'image/jpeg' });

      fileStream.pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=UTF-8' });
      res.end("404 Error: Archivo no encontrado");
    }
  } else if (req.method === "POST") {
    let data = "";
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try {
        data = JSON.parse(data);
      } catch (error) {
        console.log("Formato obligatorio es JSON");
      }
      if (procesos[data.op]) {
        if (!procesos.status) {
          res.end(JSON.stringify("BD sin conexion"));
          procesos.connectDatabase();
        } else {
          if (data.hasOwnProperty("args")) {
            procesos[data.op](data).then((r) => {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
              res.end(JSON.stringify(r));
            }).catch((error) => {
              console.error("Ocurrió un error", error);
            });
          } else {
            procesos[data.op]().then((r) => {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' });
              res.end(JSON.stringify(r));
            }).catch((error) => {
              console.error("Ocurrió un error", error);
            });
          }
        }
      } else {
        res.end("Solicitud rechazada");
      }
    });
  }
});

const webSocketServer = new WebSocketServer({ server: httpServer });
const clients = {};

webSocketServer.on('connection', (socketWebCliente, req) => {
  let clientType = req.headers['client-type'];
  socketWebCliente.id = uuidv4();
  socketWebCliente.clientType = clientType && clientType.includes("Arduino") ? "Arduino" : "Movil";

  clients[socketWebCliente.id] = socketWebCliente;

  socketWebCliente.on('message', (data) => {
    data = new TextDecoder().decode(data).trim();
    if (socketWebCliente.clientType === "Movil") {
      for (const clientId in clients) {
        const client = clients[clientId];
        if (client.clientType === "Arduino" && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    } else if (socketWebCliente.clientType === "Arduino") {
      for (const clientId in clients) {
        const client = clients[clientId];
        if (client.clientType === "Movil" && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      }
    }
  });

  socketWebCliente.on('close', () => {
    console.log(`Cliente ${socketWebCliente.clientType} desconectado con ID: ${socketWebCliente.id}`);
    delete clients[socketWebCliente.id];
  });
});

export const handler = serverlessHandler(httpServer);