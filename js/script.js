//WP400
var serverJson = 'http://suburbia.noip.me:'+servidor+sucursal+'/'+departamento+'/appinfo.json',
	serverApp = 'http://suburbia.noip.me:'+servidor+sucursal+'/'+departamento+'/scap.zip',
	downloadProgress = {status : "StandBy",	progress : 0},
	newlocalJson = 'file://internal/zip/infoapp.json',
	localJson = 'file://internal/unzip/appinfo.json',
	localApp = 'file://internal/zip/app.zip',
	folderApp = 'file://internal/unzip/',
	folderPre = 'file://internal/pre/',
	folderOld = 'file://internal/zip/',
	storage = new Storage(),
	serverAppInfo = null,
	localAppInfo = null,
	intervalTime = 250,
	interval = null,
	Timeout = null,
	gapless = null,
	totalSize = 0,
	localSize = 0,
	localTemp = 0,
	acabado = true,
	time = 1800000,
	ticket=null,
	intervalDescarga=null,
	opcionesDescarga={
		action: 'start',
		source: serverApp,
		ticket: null,
		destination : localApp,
		httpOption : {
			 maxRedirection: 5
		}
	},
	socket = io('http://192.168.100.79:3000'),
	obj = {mac : '',status:'',ipAddress:''}
	infoPlayer = {
		mac_address_ethernet: '',
		ip_address_ethernet: '',
		dns_ethernet: '',
		gateway_ethernet:'',
		mac_address_wifi:'',
		ip_address_wifi: '',
		dns_wifi: '',
		gateway_wifi: '',
		mac_utilizado: '',
		ethernet: false,
		wifi:false,
		socket_id: '',
		sucursal: this.sucursal,
		departamento: this.departamento,
		area: this.area,
		conectado: false
	},
	macAddress='';

function playApp(){
	gapless = new GaplessPlayback('gaplessPlayer', 'gaplessPlaylist');
	gapless.setContentPath('ipk');
	for(i=0;i<localAppInfo.videos;i++){
		gapless.addContent('content/unzip/'+i.toString()+'.mp4', 500);
	}
	gapless.setObjectFit('fill');
	gapless.play();
	console.log('lista() -> Ayuda a ver el contenido de los videos');
	console.log('contenido() -> Ayuda a ver el peso en MB del contenido y la fecha de modificacion');
	console.log('descargar() -> Ayuda a Forzar la descargar del contenido');
	setInterval(function(){
		console.log("entro a setInterval y pasara a validar");
		validar();
   }, time);
	
}

function updateProgress() {
	localTemp = localSize;
	if(totalSize === 0){
		totalSize = serverAppInfo.size;
	}
	storage.statFile(function(res){
		localSize = res.size;
		downloadProgress.progress = parseInt((localSize / totalSize) * 100);
		if (localSize >= totalSize) {downloadProgress.status = 'Completo';}
		if (downloadProgress.status === 'Completo'){downloadProgress.status = '';}
		else if(downloadProgress.status != ''){
			document.getElementById('progress').innerHTML = downloadProgress.progress + " %";
		}
	},function(){},{path : localApp});
}

function empieza(){
	storage.exists(function(res){
		if(res.exists){
			console.log('Aplicacion de '+area+': '+departamento+' Sucursal de '+sucursal);
			storage.readFile(function(res){
				localAppInfo = JSON.parse(res.data);
				console.log('Version Actual: '+localAppInfo.version);
				if(localAppInfo.hasOwnProperty('videos')){
					playApp();
					validar();
				}else{
					actualizar();
				}
			},function(obj){actualizar()},{path : localJson,position : 0,length : 10240,encoding : 'utf8'});
		}else{
			console.log('Descargando Aplicacion');
			descargar();
		}
	},function(obj){error(obj.errorText)},{path:localJson});
}

function validar(){
	
	storage.copyFile(function(){
		storage.readFile(function(res){
			if(localAppInfo.hasOwnProperty('videos')){
				serverAppInfo = JSON.parse(res.data);
				var versionLocal = localAppInfo.version.split('.');
				var versionServer = serverAppInfo.version.split('.');
				if(parseInt(versionLocal[0])<=parseInt(versionServer[0])){
					if(parseInt(versionLocal[1])<parseInt(versionServer[1]) && acabado == true){
	    				console.log('Actualizando a la ultima version');
	    				console.log("Entro a validar y pasara a actualizar");
	    				acabado = false;
	    				actualizar();
	    			}else{
	    				error('Aplicacion con la ultima version');
	    			}
				}else{
					console.log('Aplicacion actualizada');
				}
			}else{
				actualizar();
			}
		},function(obj){error(obj.errorText)},{path : newlocalJson,position : 0,length : 10240,encoding : 'utf8'});
	},function(obj){error(obj.errorText)},{source : serverJson,destination : newlocalJson});
}


function actualizar(){
	storage.removeFile(function(){
		storage.copyFile(function(){
			storage.readFile(function(res){
				serverAppInfo = JSON.parse(res.data);
				downloadProgress.status ="StandBy";
				if(serverAppInfo){interval = setInterval(updateProgress, intervalTime);}
				descargar();
			},function(obj){error(obj.errorText)},{path : localJson,position : 0,length : 10240,encoding : 'utf8'});
		},function(obj){error(obj.errorText+' JSON')},{source : serverJson,destination : localJson});
	},function(obj){},{file: folderOld,recursive: true});
}

function error(msg){
	clearInterval(Timeout);
	clearInterval(interval);
	console.log(msg+' se intentara nuevamente en '+(time/60000)+' min');
	//Timeout = setTimeout(function(){ validar(); }, 3600000);
}
  //----------------------------------------------------------------PRUEBAS----------------------------------------------------------------
