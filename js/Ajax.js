class Ajax {
	
	setListener(listener){
		this.listener = listener
	}

	post(datos) {
		return new Promise((resolve, reject) => {
			let xhttp = new XMLHttpRequest()

			if(!Object.entries(datos).length || !datos.hasOwnProperty("op"))
				reject(new Error("Datos inválidos para POST"))
			
			xhttp.onreadystatechange = function() {
				if (this.readyState == 4 && this.status == 200)
					resolve(this.responseText)
			}
			xhttp.open("POST", this.listener, true)
			xhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded")
			xhttp.send(JSON.stringify(datos))
		})
	}
}