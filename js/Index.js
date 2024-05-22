import {WebSocketClient} from './WebSocketClient.js';

class Index{
    constructor(reset = false) {
		if(reset) {
			window.self = new Index()
            window.ajax = new Ajax()
			window.UI = new IndexUI(true)
            window.socket = new WebSocketClient(self.onMessage.bind(self))
		}
	}

    setSocketUrl(url){
        socket.setUrl(`wss://${url}`)
    }

    setHttpUrl(ip){
        ajax.setListener(`https://${ip}`)
    }

    async CONSULTAS(data) {
		let r = await ajax.post(data) // Solicito el ID
		r = JSON.parse(r)
        UI.showConsulta(r)
	}

    async BAJAS(data) {
		let r = await ajax.post(data) // Solicito el ID
		r = JSON.parse(r) 
        self.CONSULTAS({"op": "CONSULTAS"})
	}

    async CAMBIOS(data) {
		if(self.validar(data)){
			let r = await ajax.post(data) // Solicito el ID
			r = JSON.parse(r)
            self.CONSULTAS({"op": "CONSULTAS"})
		}
    }
	
    async ALTAS(data) {
		try {
			let r = await ajax.post(data)
			r = JSON.parse(r)
			r.op = "ALTAS"
			r = await ajax.post(r)
			r = JSON.parse(r)
            self.CONSULTAS({"op": "CONSULTAS"})
            
		}catch (error) {
			throw error
	  	}
	}

    onConnect(puerto){
        socket.onConnect()
        .then(() => {
            self.sendMessage(puerto)
            UI.cloud.classList.replace("cloud-off", "cloud-onn")
        })
        .catch((error) => {
            UI.cloud.classList.replace("cloud-onn", "cloud-off")
        })
    }

    onClose(){
        socket.onClose()
    }

    socketStatus(){
        return socket.isConnect()
    }

    onMessage(datos){
        datos = self.map(parseFloat(datos), 0, 4095, 0, 100).toFixed(1)
        UI.showMessage(datos)
    }
    sendMessage(mensaje){
        socket.cliente.send(mensaje)
        console.log(mensaje)
    }
    map(valor, valorMinimo1, valorMaximo1, valorMinimo2, valorMaximo2) {
        return valorMinimo2 + (valor - valorMinimo1) * (valorMaximo2 - valorMinimo2) / (valorMaximo1 - valorMinimo1);
    }

    validar(datos) {
		datos = datos.args
		let bandera = true
		if(datos.hasOwnProperty("nombre")){
			if(datos.nombre == "")
				bandera = false
		}
		if(datos.hasOwnProperty("nacionalidad")){
			if(datos.nacionalidad == "")
				bandera = false
			
		} 
		if(datos.hasOwnProperty("edad")){
			if(datos.edad == "")
				bandera = false
			
		}
		if(!bandera) alert("Error en los datos")
		return bandera
	}
}

window.onload = () => new Index(true)
