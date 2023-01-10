function descargar(){
	(new Storage).downloadFile(function(res){
		clearInterval(intervalDescarga);
		intervalDescarga = null;
		console.log("---Descargando actualizacion---");
		console.log("Ticket: " + res.ticket);
		ticket = res.ticket;
		intervalDescarga = setInterval(porcentajeDescarga,1000);
	},function(obj){
		console.log(obj.errorText);
		acabado = true;
		validar();
	},
		opcionesDescarga
	);
}
function porcentajeDescarga(){
	(new Storage).getDownloadFileStatus(function(res){
		console.log("Estatus " + res.status);
        let porcentaje = Math.round((Math.round(res.amountReceived/1048576)*100)/Math.round(res.amountTotal/1048576))
     	let etiquetaPorcentaje = document.getElementById('porcentaje');
        console.log("porcentaje de descarga " +porcentaje+'%');
        etiquetaPorcentaje.style = "display:block";
        etiquetaPorcentaje.textContent = porcentaje+'%';
		console.log("Recibido: " + Math.round(res.amountReceived/1048576)+'MB');
		console.log('Total de descarga: '+Math.round(res.amountTotal/1048576)+'MB');
		if(res.status == 'completed'){
			clearInterval(intervalDescarga);
			intervalDescarga = null;
			document.getElementById('estado').textContent="DESCOMPRIMIENDO";
            etiquetaPorcentaje.style = "display:none";
			console.log("---Empezara a descomprimir---");
			descomprimir();
		}else if(res.status =='paused' || res.status =='failed' || res.status=='canceled'){
			clearInterval(intervalDescarga);
			intervalDescarga = null;
			descargar();
			location.reload();
		}
	},function(obj){
		console.log(obj.errorText);
	},{ticket:ticket});
  }


function descomprimir(){
    (new Storage).unzipFile(function(){
		console.log('---Exito al descomprimir---'); 
		console.log("Finalizado");
		storage.readFile(function(res){
			localAppInfo = JSON.parse(res.data);
			console.log('Version Actual: '+localAppInfo.version);
			console.log("Acabo de actualizar y volvera a reiniciar la pantalla");
				location.reload();
				acabado = true;
				playApp();
				validar();
		},function(obj){actualizar()},{path : localJson,position : 0,length : 10240,encoding : 'utf8'});
	},function(obj){
		console.log(obj.errorText)
	},{zipPath: localApp,targetPath: folderApp});
}


//Funciones nuevas
function lista(){
	(new Storage).readFile(function(res){
		console.log('---La lista de videos es la siguiente---')
		console.log(res.data);
	},function(){
		console.log('Fallo de la lista de videos');
	},{path:'file://internal/unzip/gaplessPlaylist.txt'})
}

function contenido(){
	(new Storage).statFile(function(res){
		console.log('---Tamano del contenido actual: '+(res.size/1048576)+' MB');
		console.log('---Fecha de modificacion: '+(res.mtime));
	},function(obj){console.log(obj.errorText)},{path : 'file://internal/zip/app.zip'});
}



