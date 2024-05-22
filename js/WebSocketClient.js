
export class WebSocketClient {
    constructor(onMessage) {
        this.url = null
        this.cliente = null
        this.conectado = false
        this.sendMessage = onMessage
    }

    setUrl(url){
        this.url = url
    }
    onClose(){
        if (this.cliente) {
            this.cliente.close()
            console.log("Desconexión exitosa.")
            this.conectado = false
        } else {
            console.error("No hay una conexión WebSocket para desconectar.")
        }
    }
    onConnect() {
        return new Promise((resolve, reject) => {
            this.cliente = new WebSocket(this.url)
            this.cliente.onopen = () => {
                this.conectado = true
                console.log("Conexion exitosa")
                resolve(this.cliente)
            }

            this.cliente.onmessage = (event) => {
                if (this.sendMessage) {
                    this.sendMessage(event.data)
                }
            }

            this.cliente.onerror = (error) => {
                this.conectado = false
                reject(error)
            }

            this.cliente.onclose = () => {
                this.conectado = false
            }
        })
    }
    isConnect(){
        return this.conectado
    }

    enviarMensaje(mensaje) {
        // Método para enviar mensajes al servidor
        if (this.cliente.readyState === WebSocket.OPEN) {
            this.cliente.send(mensaje)
        } else {
            console.error("La conexión no está abierta.")
        }
    }

    
}