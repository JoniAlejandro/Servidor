import { DelimiterParser, SerialPort } from "serialport"
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { Procesos } from './js/Procesos.js'
import fs from 'fs'
import {createReadStream, existsSync } from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'

/////////////////////////Se configura el Web Socket/////////////////////////////////////////////////////////////
const webSocketServer = new WebSocketServer({ port: 8080 }) // Creamos el servidor WebSocket en el puerto 80
///////////////////////////se configura el SERIAL//////////////////////////////////////////////////////////////
let puerto, procesos, statusPuerto = false
let parser
///////////////Se crea la instancia de la clase encargada de la conexion/////////
procesos = new Procesos()

// Servidor lanzado
webSocketServer.on('listening', () => {
  console.log('WebSocket escuchando en el puerto 80')
}
)
///////Se crea el servidor http-////////////
createServer((req, res) => {
  if(req.method == "GET") {
		const url = req.url == '/' ? './index.html' : req.url
		const archivo = fileURLToPath(import.meta.url) // Archivo meta (el que se está ejecutando)
		const directorio = path.dirname(archivo) // Recupero mi directorio base
		const ruta = path.join(directorio, url) // Ruta absoluta del recurso solicitado

		if(existsSync(ruta)) {
			const fileStream = createReadStream(ruta, 'UTF-8')

			if(url.match(/.html$/)) res.writeHead(200, {'Content-Type': 'text/html; charset=UTF-8'})
			else if(url.match(/.css$/)) res.writeHead(200, {'Content-Type': 'text/css; charset=UTF-8'})
			else if(url.match(/.js$/)) res.writeHead(200, {'Content-Type': 'text/javascript; charset=UTF-8'})
			else if(url.match(/.ico$/)) res.writeHead(200, {'Content-Type': 'image/x-icon'})
			else if(url.match(/.png$/)){
				res.writeHead(200, {'Content-Type': 'image/png'})
				var img = fs.readFileSync(ruta)
				res.end(img, 'binary')
			}
			else if(url.match(/.jpg$/) || url.match(/.jpeg$/)){
				res.writeHead(200, {'Content-Type': 'image/jpeg'})
				var img = fs.readFileSync(ruta)
				res.end(img, 'binary')
			}
			fileStream.pipe(res) // Respuesta fragmentada al cliente (chunk)
		}
		else {
			console.log("No existe: ", ruta)
			res.writeHead(404, {'Content-Type': 'text/plain; charset=UTF-8'})
			res.end("404 Error: Archivo no encontrado")
		}
	}
  if (req.method == "POST") {
    let data = ""
    req.on('data', chunk => data += chunk) // Armando la data
    req.on('end', () => { // La data está armanda
      try {
        data = JSON.parse(data) // Asumo que la data es un json
      } catch (error) {
        console.log("Formato obliogatorio es JSON")
      }
      if (procesos[data.op]) { // Verifico que sea una solicitud legal
        // Determino si hay ejecución con parámetros o sin parámetros.
        // En r va a quedar la respuesta del método que se invoque del objeto procesos
        //r = data.hasOwnProperty("args") ? procesos[data.op](data) : procesos[data.op]()
        if (!procesos.status) {
          res.end(JSON.stringify("BD sin conexion"))
          procesos.connectDatabase() // Reconectar a la base de datos
        } else {
          if (data.hasOwnProperty("args")) {
            procesos[data.op](data).then((r) => {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' })
              // Convierto a JSON para retornar la respuesta
              res.end(JSON.stringify(r))
            })
              .catch((error) => {
                console.error("Ocurrio un error", error)
              })
          } else {
            procesos[data.op]().then((r) => {
              res.writeHead(200, { 'Content-Type': 'application/json; charset=UTF-8' })
              res.end(JSON.stringify(r))
            })
              .catch((error) => {
                console.error("Ocurrio un error", error)
              })
          }
        }
      }
      else res.end("Solicitud rechazada") // Servicio desconocido (solicitud no legal)
    })
  }
}).listen(80, '0.0.0.0', () => {
  console.log("Servidor web a la escucha")
})



webSocketServer.on('connection', socketWebCliente => {
  console.log('Cliente conectado')
  // Manejamos los datos recibidos del app
  socketWebCliente.on('message', data => {
    let mensaje = data.toString('utf8').trim()
    if (mensaje.startsWith("COM")) {
      console.log(mensaje)
      let puertoSeleccionado = mensaje
    if (puerto && puerto.isOpen) {
        console.log("Ya había  puerto abierto, se cerrará")
        puerto.close(() => {
            newPuerto(puertoSeleccionado)
        })
    }else {
      console.log("Puerto nuevo: ", mensaje)
      newPuerto(puertoSeleccionado)
    }
    } else {
      if (puerto) {
        console.log(`Mensaje recibido del cliente: ${mensaje}`)

        // Pasamos los datos al Arduino por el puerto serial
        puerto.write(mensaje, err => {
          if (err) {
            console.error('Error al enviar datos al puerto serial:', err)
          } else {
            console.info('Datos enviados a Arduino:', mensaje)
          }
        })

      } else {
        console.log(`Mensaje recibido del cliente: ${mensaje}`)
        console.error('No se ha seleccionado un puerto COM')
      }

    }
  })
  // Notificamos cuando se desconecta el cliente
  socketWebCliente.on('close', () => {
    console.log('Cliente desconectado')
    if (statusPuerto) {
      puerto.close()
    }
  })
})

function newPuerto(puertoSeleccionado) {
  puerto = new SerialPort({ path: puertoSeleccionado, baudRate: 115200 })
  parser = puerto.pipe(new DelimiterParser({ delimiter: '\n' }))

  puerto.on('open', () => {
      console.log('Puerto abierto con éxito')
      statusPuerto = true
  })

  puerto.on('close', () => {
      console.log('Puerto cerrado con éxito')
  })

  puerto.on('error', (err) => {
      if (err.message == "Opening COM5: File not found") {
          console.error('No se detectó el puerto:', err.message)
          statusPuerto = false
      }
  })

  parser.on('data', (data) => {
      let datos = new TextDecoder().decode(data).trim()
      // Se recibe la información del Arduino y se envía al app
      webSocketServer.clients.forEach((cliente) => {
          if (cliente.readyState === WebSocket.OPEN) {
              cliente.send(datos)
          }
      })
  })
}

