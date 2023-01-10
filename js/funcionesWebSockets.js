//TODO NUEVOS EVENTOS

this.socket.on("connect", () => {
    console.log("----------------------------------Conexion DESDE AL SERVIDOR--------------------------------");

    (new DeviceInfo).getNetworkMacInfo((obj)=>{
        console.log("cbObject : " + JSON.stringify(obj));

        //Mac Adress ethernet
        console.log("wiredInfo.macAddress : " + obj.wiredInfo.macAddress);
        this.infoPlayer.mac_address_ethernet=obj.wiredInfo.macAddress;
        //Mac Adress Wifi
        console.log("wifiInfo.macAddress : " + obj.wifiInfo.macAddress);
        this.infoPlayer.mac_address_wifi = obj.wifiInfo.macAddress;


        //Busqueda de datos de internet
        (new DeviceInfo).getNetworkInfo(function (objNetworkInfo) {
            console.log("[Network Info] : " + JSON.stringify(objNetworkInfo.wifi));
            console.log(objNetworkInfo.wired.ipAddress);
            console.log(objNetworkInfo.wired.state);
            //Valida si esta conectado por WIFI O ETHERNET

            if(objNetworkInfo.wired.state == 'connected'){
                //ETHERNET
                this.infoPlayer.ip_address_ethernet = objNetworkInfo.wired.ipAddress;
                this.infoPlayer.dns_ethernet = objNetworkInfo.wired.dns1;
                this.infoPlayer.gateway_ethernet = objNetworkInfo.wired.gateway;
                this.infoPlayer.ethernet = true;
                this.infoPlayer.wifi = false;
                this.infoPlayer.mac_utilizado = this.infoPlayer.mac_address_ethernet;
            }else{
                //WIFI
                this.infoPlayer.ip_address_wifi = objNetworkInfo.wifi.ip_address;
                this.infoPlayer.dns_wifi = objNetworkInfo.wifi.dns1;
                this.infoPlayer.gateway_wifi = objNetworkInfo.wifi.gateway;
                this.infoPlayer.ethernet = false;
                this.infoPlayer.wifi = true;
                this.infoPlayer.mac_utilizado = this.infoPlayer.mac_address_ethernet;
            }
            this.infoPlayer.conectado = true;
            
            
            

            /*
                infoPlayer = {
                    mac_address_ethernet: '',
                    ip_address_ethernet: '',
                    dns_ethernet: '',
                    gateway_ethernet:'',
                    mac_address_wifi:'',
                    ip_address_wifi: '',
                    dns_wifi: '',
                    gateway_wifi: '',
                    ethernet: false,
                    wifi:false,
                    socket_id: '',
                    sucursal: this.sucursal,
                    departamento: this.departamento,
                    area: this.area,
                    conectado: false
                };
            */




            //Se Envia los datos al servidor
            socket.emit('InicioDeSesionPlayer',this.infoPlayer);
            cargaFunciones();
        },function (cbObject){
            var errorCode = cbObject.errorCode;
            var errorText = cbObject.errorText;
            console.log("Error Code [" + errorCode + "]: " + errorText);
        });
    },(cbObject)=>{
        var errorCode = cbObject.errorCode;
        var errorText = cbObject.errorText;
        console.log("Error Code [" + errorCode + "]: " + errorText);
    });

});

function cargaFunciones(){
    //TODO Funciones para forzarDescarga
    this.socket.on(`ForzarDescargaPagina${infoPlayer.mac_utilizado}`,(info)=>{
        console.log('Se descargará el nuevo contenido');
        opciones={
            action: 'start',
            source: serverApp,
            ticket: null,
            destination : localApp,
            httpOption : {
                maxRedirection: 5
            }};
        (new this.Storage).downloadFile(function(res){
                clearInterval(intervalDescarga);
                intervalDescarga = null;
                console.log("---Descargando actualizacion---");
                console.log("Ticket: " + res.ticket);
                ticket = res.ticket;
                intervalDescarga = setInterval(porcentajeDescargaContenido,1000);
            },function(obj){
                console.log(obj.errorText);
                acabado = true;
                validar();
            },
            opciones
        );
    
        function porcentajeDescargaContenido(){
            (new this.Storage).getDownloadFileStatus(function(res){
                let datosPorcentaje ={
                    porcentaje:Math.round((Math.round(res.amountReceived/1048576)*100)/Math.round(res.amountTotal/1048576)),
                    estatus:res.status,
                    recibido: Math.round(res.amountReceived/1048576),
                    total: Math.round(res.amountTotal/1048576),
                    mac_utilizado:this.infoPlayer.mac_address_ethernet
                };
    
                console.log("Estatus " + datosPorcentaje.estatus);
                console.log("porcentaje de descarga " +datosPorcentaje.porcentaje+'%');
                console.log("Recibido: " + datosPorcentaje.recibido+'MB');
                console.log('Total de descarga: '+datosPorcentaje.total);
    
                this.socket.emit('PorcentajeDescargaContenidoPlayer',datosPorcentaje);
                if(res.status == 'completed'){
                    clearInterval(intervalDescarga);
                    intervalDescarga = null;
                    console.log("---Empezara a descomprimir---");
                    this.socket.emit('DescomprimirDescargaContenidoPlayer',datosPorcentaje);
                    descomprimirDescargaContenido(datosPorcentaje);
                    //
                }else if(res.status =='paused' || res.status =='failed' || res.status=='canceled'){
                    clearInterval(intervalDescarga);
                    intervalDescarga = null;
    
                    descargar();
                    //location.reload();
                }
            },function(obj){
                console.log(obj.errorText);
            },{ticket:ticket});
        }
    
    });
    
    function descomprimirDescargaContenido(){
        (new this.Storage).unzipFile(function(){
            console.log('exito descomprimir')
            let datos = {
                mac_utilizado:this.infoPlayer.mac_address_ethernet
            }
            this.socket.emit('FinalizoDescargaContenidoPlayer',datos);
            location.reload();
        },function(obj){
            console.log(obj.errorText)
        },{zipPath: localApp,targetPath: folderApp});
    
    }
    
    //TODO Funciones para Captura de Pantalla
    this.socket.on(`CapturaPantallaPagina${infoPlayer.mac_utilizado}`,(player)=>{
        (new this.Signage).captureScreen(
            (cbObject) =>{
                var size = cbObject.size;
                var encoding = cbObject.encoding;
                var data = cbObject.data;
         
                console.log("Got Data size:" + size);
                console.log("Got Data encoding :" + encoding);
                console.log("Got Data :" + data);
         
                console.log('exito captura')
            let datos = {
                mac_utilizado:this.infoPlayer.mac_address_ethernet,
                img64: data
            }
            this.socket.emit('FinalizadoCapturaPantallaPlayer',datos);
            },
            (cbObject)=> {
                var errorCode = cbObject.errorCode;
                var errorText = cbObject.errorText;
         
                console.log("Error Code [" + errorCode + "]: " + errorText);
            },
            {
                save : false,
                thumbnail : false,
                imgResolution : 'HD'
                //FHD Es Full HD resolution
            }
        )
    
    }); 

    //TODO Funciones para Temporizadores
    this.socket.on(`CrearTemporizadorPagina${infoPlayer.mac_utilizado}`,(player)=>{
        //CREAR TEMPORIZADOR APAGADO
        (new this.Power).addOffTimer(
            (obj)=>{
                console.log(obj,'SE AGREGO UN TEMPORIZADOR APAGDO');
                //CREAR TEMPORIZADOR ENCENDIDO
                (new this.Power).addOnTimer(
                    (obj)=>{
                        console.log(obj,'SE AGREGO UN TEMPORIZADOR ENCENDIDO');
                        this.socket.emit('TemporizadorCreadoPlayer',player);
                    },
                    (obj)=>{
                        var errorCode = obj.errorCode;
                        var errorText = obj.errorText;
                        console.log ("Error Code [" + errorCode + "]: " + errorText);
                    },
                    {
                        hour : player.hora_encendido,
                        minute : player.minuto_encendido,
                        week : player.dias_encendido, //DIA MIERCOLES
                        inputSource : "ext://hdmi:1"
                    }
                );
            
            },
            (obj)=>{
                var errorCode = obj.errorCode;
                var errorText = obj.errorText;
             
                console.log ("Error Code [" + errorCode + "]: " + errorText);
            },
            {
                hour : player.hora_apagado,
                minute : player.minuto_apagado,
                week : player.dias_apagado, //DIA MIERCOLES
                inputSource : "ext://hdmi:1"
            }
        );

    
    });

    this.socket.on(`ObtenerTemporizadoresPagina${infoPlayer.mac_utilizado}`,(player) => {
        let datos = {
            temporizadores_apagados: [],
            temporizadores_encendidos: [],
            mac_utilizado: infoPlayer.mac_utilizado
        };
        //OBTENER TEMPORIZADOR ENCENDIDO
        (new this.Power).getOnTimerList(
            (obj)=>{
                datos.temporizadores_encendidos = obj.timerList;
                (new this.Power).getOffTimerList(
                    (obj)=>{
                        datos.temporizadores_apagados = obj.timerList;
                        socket.emit('DatosObtenidosTemporizadoresPlayer',datos);
                    },
                    (obj)=>{
                        var errorCode = obj.errorCode;
                        var errorText = obj.errorText;
                        console.log ("Error Code [" + errorCode + "]: " + errorText);
                    }
                );
            },
            (obj)=>{
                var errorCode = obj.errorCode;
                var errorText = obj.errorText;
                 
                console.log ("Error Code [" + errorCode + "]: " + errorText);
            }
        );
    });

    this.socket.on(`EliminarTemporizadorApagadoPagina${infoPlayer.mac_utilizado}`,(player)=>{
        (new this.Power).deleteOffTimer(
            (obj)=>{
                console.log(obj,'SE ELIMINO UN TEMPORIZADOR APAGADO');
                let datos = {
                    temporizadores_apagados: [],
                    temporizadores_encendidos: [],
                    mac_utilizado: infoPlayer.mac_utilizado
                };
                //OBTENER TEMPORIZADOR ENCENDIDO
                (new this.Power).getOnTimerList(
                    (obj)=>{
                        datos.temporizadores_encendidos = obj.timerList;
                        (new this.Power).getOffTimerList(
                            (obj)=>{
                                datos.temporizadores_apagados = obj.timerList;
                                socket.emit('DatosObtenidosTemporizadoresEliminadosPlayer',datos);
                            },
                            (obj)=>{
                                var errorCode = obj.errorCode;
                                var errorText = obj.errorText;
                                console.log ("Error Code [" + errorCode + "]: " + errorText);
                            }
                        );
                    },
                    (obj)=>{
                        var errorCode = obj.errorCode;
                        var errorText = obj.errorText;
                         
                        console.log ("Error Code [" + errorCode + "]: " + errorText);
                    }
                );
            },
            (obj)=>{
                var errorCode = obj.errorCode;
                var errorText = obj.errorText;
                console.log ("Error Code [" + errorCode + "]: " + errorText);
            },
            {
                hour : player.hour,
                minute : player.minute,
                week : player.week,
            }
        )
    
    });

    this.socket.on(`EliminarTemporizadorEncendidoPagina${infoPlayer.mac_utilizado}`,(player)=>{
        (new this.Power).deleteOnTimer(
            (obj)=>{
                console.log(obj,'SE ELIMINO UN TEMPORIZADOR ENCENDIDO');
                let datos = {
                    temporizadores_apagados: [],
                    temporizadores_encendidos: [],
                    mac_utilizado: infoPlayer.mac_utilizado
                };
                //OBTENER TEMPORIZADOR ENCENDIDO
                (new this.Power).getOnTimerList(
                    (obj)=>{
                        datos.temporizadores_encendidos = obj.timerList;
                        (new this.Power).getOffTimerList(
                            (obj)=>{
                                datos.temporizadores_apagados = obj.timerList;
                                socket.emit('DatosObtenidosTemporizadoresEliminadosPlayer',datos);
                            },
                            (obj)=>{
                                var errorCode = obj.errorCode;
                                var errorText = obj.errorText;
                                console.log ("Error Code [" + errorCode + "]: " + errorText);
                            }
                        );
                    },
                    (obj)=>{
                        var errorCode = obj.errorCode;
                        var errorText = obj.errorText;
                         
                        console.log ("Error Code [" + errorCode + "]: " + errorText);
                    }
                );
            },
            (obj)=>{
                var errorCode = obj.errorCode;
                var errorText = obj.errorText;
                console.log ("Error Code [" + errorCode + "]: " + errorText);
            },
            {
                hour : player.hour,
                minute : player.minute,
                week : player.week,
            }
        )
    
    });

    //TODO Funciones para Reiniciar Player
    this.socket.on(`ReiniciarPlayerPagina${infoPlayer.mac_utilizado}`,(player)=>{
        let datos = {
            reiniciando : true,
            mac_utilizado: infoPlayer.mac_utilizado
        };
        (new this.Power).executePowerCommand((obj)=>{
            console.log('reiniciado');
            socket.emit('ReiniciandoPlayerPlayer',datos);
        },(obj)=>{
            var errorCode = cbObject.errorCode;
            var errorText = cbObject.errorText;
            console.log ("Error Code [" + errorCode + "]: " + errorText);
        },{
            powerCommand: 'reboot' 
        });
    });

    this.socket.on(`ComprobarConexionPagina${infoPlayer.mac_utilizado}`,(player) => {
        (new DeviceInfo).getNetworkMacInfo((obj)=>{
            console.log("cbObject : " + JSON.stringify(obj));
            //Mac Adress ethernet
            console.log("wiredInfo.macAddress : " + obj.wiredInfo.macAddress);
            this.infoPlayer.mac_address_ethernet=obj.wiredInfo.macAddress;
            //Mac Adress Wifi
            console.log("wifiInfo.macAddress : " + obj.wifiInfo.macAddress);
            this.infoPlayer.mac_address_wifi = obj.wifiInfo.macAddress;
            //Busqueda de datos de internet
            (new DeviceInfo).getNetworkInfo(function (objNetworkInfo) {
                console.log("[Network Info] : " + JSON.stringify(objNetworkInfo.wifi));
                console.log(objNetworkInfo.wired.ipAddress);
                console.log(objNetworkInfo.wired.state);
                //Valida si esta conectado por WIFI O ETHERNET
                if(objNetworkInfo.wired.state == 'connected'){
                    //ETHERNET
                    this.infoPlayer.ip_address_ethernet = objNetworkInfo.wired.ipAddress;
                    this.infoPlayer.dns_ethernet = objNetworkInfo.wired.dns1;
                    this.infoPlayer.gateway_ethernet = objNetworkInfo.wired.gateway;
                    this.infoPlayer.ethernet = true;
                    this.infoPlayer.wifi = false;
                    this.infoPlayer.mac_utilizado = this.infoPlayer.mac_address_ethernet;
                }else{
                    //WIFI
                    this.infoPlayer.ip_address_wifi = objNetworkInfo.wifi.ip_address;
                    this.infoPlayer.dns_wifi = objNetworkInfo.wifi.dns1;
                    this.infoPlayer.gateway_wifi = objNetworkInfo.wifi.gateway;
                    this.infoPlayer.ethernet = false;
                    this.infoPlayer.wifi = true;
                    this.infoPlayer.mac_utilizado = this.infoPlayer.mac_address_ethernet;
                }
                this.infoPlayer.conectado = true;
                //Se Envia los datos al servidor
                socket.emit('DatosComprobadosPlayer',this.infoPlayer);
            },function (cbObject){
                var errorCode = cbObject.errorCode;
                var errorText = cbObject.errorText;
                console.log("Error Code [" + errorCode + "]: " + errorText);
            });
        },(cbObject)=>{
            var errorCode = cbObject.errorCode;
            var errorText = cbObject.errorText;
            console.log("Error Code [" + errorCode + "]: " + errorText);
        });
    });
}












