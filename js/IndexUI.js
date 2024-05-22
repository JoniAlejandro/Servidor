
class IndexUI{
    constructor(reset = false) {
        if(reset) {
            this.ip = document.querySelector("#ip")
            this.view = document.querySelector("#view")
            this.altas = document.querySelector("#altas")
            this.titulo = document.querySelector("#titulo")
            this.cambios =  document.querySelector("#cambios")
            this.cancelar =  document.querySelector("#cancelar")
            this.alert = document.querySelector("#alert")
            this.id = document.querySelector("#id")
            this.nombre =  document.querySelector("#nombre")
            this.nacionalidad =  document.querySelector("#nacionalidad")
            this.edad =  document.querySelector("#edad")
            this.listaPersonas = document.querySelector("#listaPersonas")
            this.pantallaUno = document.querySelector("#cuerpo-pantalla-uno")
            this.pantallaDos = document.querySelector("#cuerpo-pantalla-dos")
            this.puerto = document.querySelector("#puerto")
            this.cloud =  document.querySelector("#icono-cloud")
            this.light = document.querySelector("#icono-light")
            this.servidor =  document.querySelector("#servidor")
            this.servicios = document.querySelector("#servicios")
            this.altas.addEventListener("click", this.altas_click)
            this.cambios.addEventListener("click", this.cambios_click)
            this.cancelar.addEventListener("click", this.cancelar_click)
            this.servidor.addEventListener("click", this.pantallaServidor)
            this.servicios.addEventListener("click", this.pantallaServicios)
            this.porcentaje = document.querySelector("#porcentaje-analogico")
            this.cloud.addEventListener("click", this.toogleCloud)
            this.light.addEventListener("click", this.toogleLight)
            
        }
    }

    pantallaServidor(){
        if (!UI.servidor.classList.contains('item-isSeleted')) {
            UI.pantallaDos.classList.add('oculto')
            UI.pantallaUno.classList.remove('oculto')
            UI.alert.classList.add('oculto')
            UI.servicios.classList.remove('item-isSeleted')
            UI.servidor.classList.add('item-isSeleted')
        }
    }

    pantallaServicios(){
        if (!UI.servicios.classList.contains('item-isSeleted')) {
            UI.pantallaUno.classList.add('oculto')
            UI.pantallaDos.classList.remove('oculto')
            UI.servidor.classList.remove('item-isSeleted')
            UI.servicios.classList.add('item-isSeleted')
            self.CONSULTAS({"op": "CONSULTAS"})
        }
    }

    toogleCloud(){
        let ip = UI.ip.value
        let puerto = UI.puerto.value
        if(ip != "" && puerto != ""){
            self.setSocketUrl(ip)
            self.setHttpUrl(ip)
            if(self.socketStatus()){
                self.onClose()
                UI.cloud.classList.replace("cloud-onn", "cloud-off")
                UI.light.classList.replace("light-onn", "light-off")
                UI.porcentaje.textContent = "0%"
            }else{
                self.onConnect(`COM${puerto}`)
            }
        }else UI.showAlert("Ingresar datos")
    }
    showAlert(mensaje){
        alert(mensaje)
    }
    showMessage(datos){
        UI.porcentaje.textContent = datos + "%"
    }

    toogleLight(){
        if(self.socketStatus()){
            const lightOnn = UI.light.classList.contains("light-onn")
            if (!lightOnn) {
                UI.light.classList.replace("light-off", "light-onn")
            } else {
                UI.light.classList.replace("light-onn", "light-off")
            }
            const mensaje = lightOnn ? '0' : '1'
            self.sendMessage(mensaje)
        }
    }

    expandida(e){
        if (e.target.classList.contains("update")) {
            let datos = e.target.closest(".item-persona").data
            UI.nombre.value = datos.nombre
            UI.nacionalidad.value = datos.nacionalidad
            UI.edad.value = datos.edad
            UI.id.value = datos.id
            UI.alert.classList.remove('oculto')
            UI.titulo.textContent = "Editar Persona"
        }else if(e.target.classList.contains("delete")){
            e.target.closest(".item-persona").remove()
            let datos = e.target.closest(".item-persona").data
            self.BAJAS({"op": "BAJAS", "args": {id : datos.id }}) 

        }else{
            e.target.closest(".item-persona").querySelector(".gestion").classList.toggle("oculto")
        }
        
    }
    cancelar_click(){
        UI.alert.classList.add('oculto')
    }

    altas_click(e){
        UI.id.value = ""
        UI.titulo.textContent = "Agregar Persona"
        UI.alert.classList.remove('oculto')
    }

    cambios_click(e){
        if(UI.id.value == ""){
            let datos = {"op": "ID", "args": UI.recuperar("ALTAS")}
            self.ALTAS(datos) 
            UI.alert.classList.add('oculto')
        }else{
            let datos = {"op": "CAMBIOS", "args": UI.recuperar("CAMBIOS")}
            self.CAMBIOS(datos)
            UI.alert.classList.add('oculto')
        }
    }

    showConsulta(data){
        UI.view.innerHTML = ""
		if(data.length > 0){
            UI.view.classList.remove("view")
			for (const persona of data){
				let itemPersona = document.createElement("div")
                itemPersona.data = persona
                itemPersona.onclick = UI.expandida
                let infoPersona = document.createElement("div")
                let gestion = document.createElement("div")
                let icon = document.createElement("img")
                let iconDelete = document.createElement("img")
                let iconUpdate = document.createElement("img")
                let nombre = document.createElement("span")
                let nacionalidad = document.createElement("span")
                gestion.className = "gestion oculto"
                infoPersona.className = "info-user"
                iconDelete.className = "icono-nav delete"
                iconUpdate.className = "icono-nav update"
                iconDelete.src = "../img/delete.png"
                iconUpdate.src = "../img/update.png"
                icon.className = "user-icon"
                icon.src = "../img/user.png"
                itemPersona.className = "item-persona"
                itemPersona.id = "itemPersona"
                nombre.textContent = `Nombre: ${persona.nombre}`
                nacionalidad.textContent = `Nacionalidad: ${persona.nacionalidad}`
                infoPersona.appendChild(nombre)
                infoPersona.appendChild(nacionalidad)
                gestion.appendChild(iconDelete)
                gestion.appendChild(iconUpdate)
                infoPersona.appendChild(gestion)
                itemPersona.appendChild(icon)
                itemPersona.appendChild(infoPersona)
    			UI.view.appendChild(itemPersona)
			}
		}else{
            let aviso = document.createElement("span")
            aviso.textContent = "Sin registros"
            UI.view.classList.add("view")
            UI.view.appendChild(aviso)
		}
	}

    recuperar(servicio) {
        let datos = {}
        if(servicio == "ALTAS" || servicio == "CAMBIOS"){
			datos.nombre = UI.nombre.value
            datos.nacionalidad = UI.nacionalidad.value
            datos.edad = UI.edad.value
			if(servicio == "CAMBIOS"){
				datos.id = 	UI.id.value
			}
		}
        return datos
    }

}
