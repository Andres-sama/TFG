/* eslint-disable comma-dangle */
/* eslint-disable no-trailing-spaces */
/* eslint-disable max-len */

// Required constants and variables
const Lti = require('ltijs').Provider;
const path = require('path');
var request = require('request');
var bodyParser = require('body-parser');
const {Observable} = require('rxjs');
require('dotenv').config();
var engine = require('ejs-mate');

// Global variables
var userId = '';
var profesorId = '';
var segundoApellido = '';
var nombreUser = '';
var Cuestionarios = '';
var alumno = '';
var Juegos = '';
var nameUser = '';
var passUser = '';
var miRegisteredUser = false;
var JuegosDeCuestionario, miAvatar, miAvatarRoot, idUserMoodle;
var alumnoJuegoDeCuestionario = [];
var miNota = 0;
var server = 'http://localhost:3000';
// var server = 'http://147.83.118.92:3000';

// Get the userId by the name and username of the login
function getUser(Name, Surname) {
  const userIdObservable = new Observable(obs => {
    let userId = '';
    request.get(server + '/api/Alumnos?filter[where][Nombre]=' +
      // eslint-disable-next-line max-len
      Name + '&filter[where][PrimerApellido]=' + Surname, {json: true}, (error, response) => {
        userId = response.body[0].id;
        segundoApellido = response.body[0].SegundoApellido;
        profesorId = response.body[0].profesorId;
        miAvatar = server + '/api/imagenes/imagenAlumno/download/' + response.body[0].ImagenPerfil;
        miAvatarRoot = response.body[0].ImagenPerfil;
        request.get(miAvatar, function(error, response, body) {
          console.error('response.statusCode:', response.statusCode);
          if (response.statusCode == 404) {
            miAvatar = server + '/api/imagenes/imagenAlumno/download/UsuarioAlumno.jpg';
          }
        });
        console.log('111 My user body is: ',  response.body);
        console.log('111 My user info is: ',  userId);
        obs.next(userId);
      });
  });
  return userIdObservable;
}
// Get Quiz information
function getCuestionario(idCuestionario, idGrupo, idJuegoDeCuestionario, idJuegoDeCuestionarioAlumno, idAlumno) {
  const CuestionarioObservable = new Observable(obs => {
    let pregCuestInfo = [];
    let preguntasyCuestionario = [];
    let pregunta = [];
    let cuestionario = [];
    let preguntasCuestionarioList = [];
    // Realizamos una consulta para obtener los datos que queremos mostrar a partir del id anterior
    request.get(server  + '/api/PreguntasDelCuestionario?filter[where][cuestionarioId]=' + idCuestionario,
    {json: true}, (error, response, body) => {
      preguntasyCuestionario = body;
      // BUSCAMOS EL CUESTIONARIO
      // Recogemos valores del body
      let uri = '';
      let size = Object.keys(body).length;
      let filterone2 = preguntasyCuestionario[0].cuestionarioId;
      uri = server  + '/api/Cuestionarios?filter[where][or][0][id]=' + filterone2;
      if (size > 1) {
        for (let k = 1; k < size; k ++) {
          if (preguntasyCuestionario[k - 1].cuestionarioId != preguntasyCuestionario[k].cuestionarioId) {
            uri += '&filter[where][or]' + '[' + k + ']' + '[id]=' + preguntasyCuestionario[k].cuestionarioId;
            console.log('MY URI IN %s is: ' + uri, k);
          }
        }
      }
      // BUSCAMOS LAS PREGUNTAS
      // Recogemos valores del body
      let uri2 = '';
      console.log('preguntasyCuestionario 00000000 L body: ', size); // saber la longitud del body (cuantos elementos tenemos)
      console.log('preguntasyCuestionario 000000000 body: ', body);
      let filterone = preguntasyCuestionario[0].preguntaId;
      uri2 = server  + '/api/Preguntas?filter[where][or][0][id]=' + filterone;
      if (size > 1) {
        for (let i = 1; i < size; i++) {
          uri2 += '&filter[where][or]' + '[' + i + ']' + '[id]=' + preguntasyCuestionario[i].preguntaId;
          console.log('MY URI IN %s is: ' + uri2, i);
        }
      }
      request.get(uri, {json: true}, (error, response, body2) => {
        console.log('cuestionario body: ', body2);
        cuestionario = body2;
        // Recogemos valores del body
        let sizeCuestionario = body2.length;
        console.log('sizeCuestionario L body: ', sizeCuestionario); // saber la longitud del body (cuantos elementos tenemos)
        // BUSCAMOS LAS PREGUNTAS
        request.get(uri2, {json: true}, (error, response, body3) => {
          // Recogemos valores del body
          pregunta = body3;
          let sizePreguntas = body3.length;
          console.log('sizePreguntas L body: ', sizePreguntas); // saber la longitud del body (cuantos elementos tenemos)
          console.log('pregunta body: ', body3);
          let preguntaIndiv = [];
          if (sizeCuestionario > 0) {
            for (let l = 0; l < sizeCuestionario; l++) {
              if (sizePreguntas > 0) {
                for (let j = 0; j < sizePreguntas; j++) {
                  console.log('L IS %s: ' + cuestionario[l].Titulo, l);
                  console.log('J IS %s : ' + pregunta[j].Titulo, j);
                  // preguntaIndiv.push({T: pregunta[j].Titulo, P: pregunta[j].Pregunta});
                  preguntaIndiv.push({TituloP: pregunta[j].Titulo, Pregunta: pregunta[j].Pregunta, Tema: pregunta[j].Tematica,
                    RespuestaCorrecta: pregunta[j].RespuestaCorrecta, RespuestaIncorrecta1: pregunta[j].RespuestaIncorrecta1,
                    RespuestaIncorrecta2: pregunta[j].RespuestaIncorrecta2, RespuestaIncorrecta3: pregunta[j].RespuestaIncorrecta3,
                    FeedbackCorrecto: pregunta[j].FeedbackCorrecto, FeedbackIncorrecto: pregunta[j].FeedbackIncorrecto,
                    profesorId: pregunta[j].profesorId, idPregunta: pregunta[j].id});
                }
              }
              pregCuestInfo.push({TituloC: [cuestionario[l].Titulo], DescripcionC: [cuestionario[l].Descripcion],
                idCuestionarioC: [cuestionario[l].id], profesorIdC: [cuestionario[l].profesorId], Preguntas: preguntaIndiv, GrupoId: [idGrupo],
                JuegoDeCuestionarioId: [idJuegoDeCuestionario], JuegoDeCuestionarioAlumnoId: [idJuegoDeCuestionarioAlumno],
                idAlumno: [idAlumno]});
            }
          }
          console.log('1 MY pregCuestInfo IS: ' + JSON.stringify(pregCuestInfo));
          obs.next(pregCuestInfo);
        });
      });
    });
  });
  return CuestionarioObservable;
}
// Get Cromos
function getColeccion(idColeccion, idGrupo, idJuegoDeColeccion, idJuegoDeColeccionAlumno, idAlumno, dosCaras) {
  const ColeccionObservable = new Observable(obs => {
    let albumAlumnoInfo = [];
    let datosAlbum = []; // Guardamos los cromos que tiene un alumno en su album
    let datosCromos = []; // Guardamos todos los cromos de una colección determinada
    // Realizamos una consulta para obtener los datos que queremos mostrar a partir del id anterior
    request.get(server  + '/api/Cromos?filter[where][coleccionId]=' + idColeccion,
    {json: true}, (error, response, body) => {
      datosCromos = body;
      // BUSCAMOS LOS CROMOS DE LA COLECCIÓN
      let sizeCromos = Object.keys(body).length;
      // BUSCAMOS LOS CROMOS DEL ALBUM DEL ALUMNO
      console.log('datosCromos 00000000 L body: ', sizeCromos); // saber la longitud del body (cuantos elementos tenemos)
      console.log('datosCromos 000000000 body: ', body);
      request.get(server  + '/api/Albumes?filter[where][alumnoJuegoDeColeccionId]=' + idJuegoDeColeccionAlumno, {json: true}, (error, response, body2) => {
        console.log('datosAlbum body: ', body2);
        datosAlbum = body2;
        let sizeColeccion = body2.length;
        console.log('sizeColeccion L body: ', sizeColeccion);
        let cromosAlumno = [];
        let cromosTotal = [];
        if (sizeCromos > 0) {
          for (let j = 0; j < sizeCromos; j++) {
            console.log('J IS %s : ' + datosCromos[j].Imagen, j);
            // preguntaIndiv.push({T: pregunta[j].Titulo, P: pregunta[j].Pregunta});
            if (dosCaras == 'true') {
              cromosTotal.push({NombreCColeccion: [datosCromos[j].Nombre], ProbabilidadCColeccion: [datosCromos[j].Probabilidad], NivelCColeccion: [datosCromos[j].Nivel],
                idCColeccion: [datosCromos[j].id], coleccionIdCColeccion: [datosCromos[j].coleccionId],
                ImagenCColeccionDelante: [datosCromos[j].ImagenDelante], ImagenCColeccionDetras: [datosCromos[j].ImagenDetras],
                Imagen: ''});
            } else {
              cromosTotal.push({NombreCColeccion: [datosCromos[j].Nombre], ProbabilidadCColeccion: [datosCromos[j].Probabilidad], NivelCColeccion: [datosCromos[j].Nivel],
                idCColeccion: [datosCromos[j].id], coleccionIdCColeccion: [datosCromos[j].coleccionId],
                ImagenCColeccionDelante: false, ImagenCColeccionDetras: '',
                Imagen: [datosCromos[j].Imagen]});
            }
          }
          for (let l = 0; l < sizeColeccion; l++) {
            cromosAlumno.push({idCColeccionAlumno: [datosAlbum[l].id], cromoIdCColeccionAlumno: [datosAlbum[l].cromoId],
              alumnoJuegoDeColeccionIdCColeccionAlumno: [datosAlbum[l].alumnoJuegoDeColeccionId]});
          }
          albumAlumnoInfo.push(cromosTotal, cromosAlumno);
        }
        console.log('1 MY pregCuestInfo IS: ' + JSON.stringify(albumAlumnoInfo));
        obs.next(albumAlumnoInfo);
      });
    });
  });
  return ColeccionObservable;
}
// Save Quiz answers
function guardarRespuestas(idJuegoCuestionario, idGrupo, idAlumnoJuegoDeCuestionario) {
  console.log('Entramos en guardarRespuestas');
  let url = server  + '/api/Grupos/' + idGrupo + '/juegosDeCuestionario/' + idJuegoCuestionario;
  console.log('MY URL GUARDAR IS: ' + url);
  request({url: url, method: 'PUT', json: JSON.parse(JuegosDeCuestionario)}, function(error, request, body) {
    console.log('MY BODU OF RESPONSE IS: ' + body);
  });
}
// Save final mark of Quiz in AlumnoJuegoDeCuestionario
function guardarNota(idAlumnoJuegoDeCuestionario) {
  let url2 = server  + '/api/AlumnosJuegoDeCuestionario/' + idAlumnoJuegoDeCuestionario;
  console.log('2 MY URL GUARDAR IS: ' + url2);
  request({url: url2, method: 'PUT', json: JSON.parse(alumnoJuegoDeCuestionario)}, function(error2, request2, body2) {
    console.log('2 MY BODU OF RESPONSE IS: ' + body2);
  });
}
function updateUser(miAlumno, idUser) {
  console.log('UsuarioMoodle');
  let url = server  + '/api/Alumnos/' + idUser;
  request({url: url, method: 'PUT', json: JSON.parse(miAlumno)}, function(error2, request2, body) {
    console.log('updateUser OF RESPONSE IS: ' + body);
  });
}
// Get getAlumnoJuegoPuntos
function getAlumnoJuegoPuntos(idAlumno) {
  const alumnoJuegoPuntosbservable = new Observable(obs => {
    let alumnoJuegoDePuntos = [];
    request.get(server  + '/api/AlumnoJuegosDePuntos?filter[where][alumnoId]=' +
    idAlumno, {json: true}, (error, response, body) => {
      alumnoJuegoDePuntos.push(body);
      // Recogemos valores del body
      let uri = '';
      let size = Object.keys(body).length;
      alumnoJuegoDePuntos.push(size);
      console.log('1111111111 L body: ', size); // saber la longitud del body (cuantos elementos tenemos)
      console.log('1111111 body: ', body);
      let filterone = '';
      if (size > 0) {
        filterone = body[0].juegoDePuntosId;
      }
      uri = server  + '/api/JuegosDePuntos?filter[where][or][0][id]=' + filterone;
      if (body.length > 1) {
        for (let i = 1; i < body.length; i++) {
          uri += '&filter[where][or]' + '[' + i + ']' + '[id]=' + body[i].juegoDePuntosId;
          console.log('MY URI IN %s is: ' + uri, i);
        }
      }
      alumnoJuegoDePuntos.push(uri);
      obs.next(alumnoJuegoDePuntos);
    });
  });
  return alumnoJuegoPuntosbservable;
}
// Get getJuegoDePuntos
function getJuegoDePuntos(myuri, type) {
  const juegoPuntosbservable = new Observable(obs => {
    let juegoDePuntos = [];
    request.get(myuri, {json: true}, (error, response, body2) => {
      if (type == 1) {
        juegoDePuntos = body2;
      } else {
        juegoDePuntos.push(body2);
        console.log('2222222 body: ', body2);
        // Recogemos valores del body
        let size2 = body2.length;
        juegoDePuntos.push(size2);
        console.log('22222222 L body: ', size2); // saber la longitud del body (cuantos elementos tenemos)
      }
      obs.next(juegoDePuntos);
    });
  });
  return juegoPuntosbservable;
}

function getListaAlumnosJuegoPuntos(myuri) {
  const listaAlumnosPuntosbservable = new Observable(obs => {
    let listaAlumnosJuegoDePuntos = [];
    request.get(myuri, {json: true}, (error, response, body2) => {
      listaAlumnosJuegoDePuntos.push(body2);
      console.log('2222222 body: ', body2);
      // Recogemos valores del body
      let size2 = body2.length;
      listaAlumnosJuegoDePuntos.push(size2);
      console.log('22222222 L body: ', size2); // saber la longitud del body (cuantos elementos tenemos)
      obs.next(listaAlumnosJuegoDePuntos);
    });
  });
  return listaAlumnosPuntosbservable;
}
// Get getAlumnoJuegoCompeticionLiga
function getAlumnoJuegoCompeticionLiga(idUser) {
  const alumnoJuegoCompeticionLigabservable = new Observable(obs => {
    let alumnoJuegoCompeticionLiga = [];
    request.get(server  + '/api/AlumnosJuegoDeCompeticionLiga?filter[where][AlumnoId]=' +
      idUser, {json: true}, (error, response, body3) => {
        alumnoJuegoCompeticionLiga.push(body3);
        // Recogemos valores del body
        let uri2 = '';
        let size3 = body3.length;
        alumnoJuegoCompeticionLiga.push(size3);
        console.log('3333333 L body: ', size3); // saber la longitud del body (cuantos elementos tenemos)
        console.log('3333333 body: ', body3);
        let filterone2 = '';
        if (size3 > 0) {
          filterone2 = body3[0].JuegoDeCompeticionLigaId;
        }
        uri2 = server  + '/api/JuegosDeCompeticionLiga?filter[where][or][0][id]=' + filterone2;
        if (body3.length > 1) {
          for (let k = 1; k < size3; k++) {
            uri2 += '&filter[where][or]' + '[' + k + ']' + '[id]=' + body3[k].JuegoDeCompeticionLigaId;
            console.log('MY URI IN %s is: ' + uri2, k);
          }
        }
        alumnoJuegoCompeticionLiga.push(uri2);
        obs.next(alumnoJuegoCompeticionLiga);
      });
  });
  return alumnoJuegoCompeticionLigabservable;
}
// Get getJuegoCompeticionLiga
function getJuegoCompeticionLiga(myuri) {
  const juegoJuegoCompeticionLigabservable = new Observable(obs => {
    let juegoCompeticionLiga = [];
    request.get(myuri, {json: true}, (error, response, body4) => {
      console.log('4444444 body: ', body4);
      juegoCompeticionLiga.push(body4);
      // Recogemos valores del body
      let size4 = body4.length;
      juegoCompeticionLiga.push(size4);
      console.log('4444444 L body: ', size4); // saber la longitud del body (cuantos elementos tenemos)
      console.log('444444 body: ', body4);
      obs.next(juegoCompeticionLiga);
    });
  });
  return juegoJuegoCompeticionLigabservable;
}
// Get getAlumnoJuegoCompeticionFUno
function getAlumnoJuegoCompeticionFUno(idUser) {
  const alumnoJuegoCompeticionFUnobservable = new Observable(obs => {
    let alumnoJuegoCompeticionFUno = [];
    request.get(server  + '/api/AlumnosJuegoDeCompeticionFormulaUno?filter[where][AlumnoId]=' +
      idUser, {json: true}, (error, response, body5) => {
        alumnoJuegoCompeticionFUno.push(body5);
        // Recogemos valores del body
        let uri3 = '';
        let size4 = body5.length;
        alumnoJuegoCompeticionFUno.push(size4);
        console.log('5555555 L body: ', size4); // saber la longitud del body (cuantos elementos tenemos)
        console.log('5555555 body: ', body5);
        let filterone3 = '';
        if (size4 > 0) {
          filterone3 = body5[0].JuegoDeCompeticionFormulaUnoId;
        }
        uri3 = server  + '/api/JuegosDecompeticionFormulaUno?filter[where][or][0][id]=' + filterone3;
        if (body5.length > 1) {
          for (let m = 1; m < size4; m++) {
            uri3 += '&filter[where][or]' + '[' + m + ']' + '[id]=' + body5[m].JuegoDeCompeticionFormulaUnoId;
            console.log('MY URI IN %s is: ' + uri3, m);
          }
        }
        alumnoJuegoCompeticionFUno.push(uri3);
        obs.next(alumnoJuegoCompeticionFUno);
      });
  });
  return alumnoJuegoCompeticionFUnobservable;
}
// Get getJuegoCompeticionFU
function getJuegoCompeticionFU(myuri) {
  const juegoJuegoCompeticionFUObservable = new Observable(obs => {
    let juegoCompeticionFU = [];
    request.get(myuri, {json: true}, (error, response, body6) => {
      juegoCompeticionFU.push(body6);
      console.log('6666666 body: ', body6);
      // Recogemos valores del body
      let size6 = body6.length;
      juegoCompeticionFU.push(size6);
      console.log('6666666 L body: ', size6); // saber la longitud del body (cuantos elementos tenemos)
      console.log('666666 body: ', body6);
      obs.next(juegoCompeticionFU);
    });
  });
  return juegoJuegoCompeticionFUObservable;
}
// Get getAlumnoJuegoCuestionario
function getAlumnoJuegoCuestionario(idUser) {
  const alumnoJuegoCuestionarioObservable = new Observable(obs => {
    let alumnoJuegoCuestionario = [];
    request.get(server  + '/api/AlumnosJuegoDeCuestionario?filter[where][alumnoId]=' +
    idUser, {json: true}, (error, response, body7) => {
      // Recogemos valores del body
      alumnoJuegoCuestionario.push(body7);
      let uri4 = '';
      let size6 = body7.length;
      alumnoJuegoCuestionario.push(size6);
      console.log('77777777 L body: ', size6); // saber la longitud del body (cuantos elementos tenemos)
      console.log('777777777 body: ', body7);
      let filterone4 = '';
      if (size6 > 0) {
        filterone4 =  body7[0].juegoDeCuestionarioId;
      }
      uri4 = server  + '/api/JuegosDeCuestionario?filter[where][or][0][id]=' + filterone4;
      console.log('111111777777 MY URI IN %s is: ' + uri4);
      if (body7.length > 1) {
        for (let o = 1; o < size6; o ++) {
          uri4 += '&filter[where][or]' + '[' + o + ']' + '[id]=' + body7[o].juegoDeCuestionarioId;
          console.log('777777777 MY URI IN %s is: ' + uri4, o);
        }
      }
      alumnoJuegoCuestionario.push(uri4);
      obs.next(alumnoJuegoCuestionario);
    });
  });
  return alumnoJuegoCuestionarioObservable;
}
// Get getJuegoCuestionario
function getJuegoCuestionario(myuri) {
  const juegoJuegoCuestionarioUObservable = new Observable(obs => {
    let juegoCuestionario = [];
    request.get(myuri, {json: true}, (error, response, body10) => {
      juegoCuestionario.push(body10);
      console.log('88888888 body: ', body10);
      // Recogemos valores del body
      let size8 = body10.length;
      juegoCuestionario.push(size8);
      console.log('888888888 L body: ', size8); // saber la longitud del body (cuantos elementos tenemos)
      console.log('888888888 body: ', body10);
      obs.next(juegoCuestionario);
    });
  });
  return juegoJuegoCuestionarioUObservable;
}
// Get getAlumnoJuegoColeccion
function getAlumnoJuegoColeccion(idUser) {
  const alumnoJuegoColeccionObservable = new Observable(obs => {
    let alumnoJuegoColeccion = [];
    request.get(server  + '/api/AlumnosJuegoDeColeccion?filter[where][alumnoId]=' +
    idUser, {json: true}, (error, response, body9) => {
      // Recogemos valores del body
      alumnoJuegoColeccion.push(body9);
      let uri5 = '';
      let size9 = body9.length;
      alumnoJuegoColeccion.push(size9);
      console.log('8888888 L body: ', size9); // saber la longitud del body (cuantos elementos tenemos)
      console.log('8888888 body: ', body9);
      let filterone4 = '';
      if (size9 > 0) {
        filterone4 =  body9[0].juegoDeColeccionId;
      }
      uri5 = server  + '/api/JuegosDeColeccion?filter[where][or][0][id]=' + filterone4;
      console.log('1118888888 MY URI IN %s is: ' + uri5);
      if (body9.length > 1) {
        for (let o = 1; o < size9; o ++) {
          uri5 += '&filter[where][or]' + '[' + o + ']' + '[id]=' + body9[o].juegoDeColeccionId;
          console.log('8888888 MY URI IN %s is: ' + uri5, o);
        }
      }
      alumnoJuegoColeccion.push(uri5);
      obs.next(alumnoJuegoColeccion);
    });
  });
  return alumnoJuegoColeccionObservable;
}
// Get getJuegoColeccion
function getJuegoColeccion(myuri) {
  const juegoJuegoColeccionsUObservable = new Observable(obs => {
    let juegoColeccion = [];
    request.get(myuri, {json: true}, (error, response, body8) => {
      juegoColeccion.push(body8);
      console.log('88888888 body: ', body8);
      // Recogemos valores del body
      let size10 = body8.length;
      juegoColeccion.push(size10);
      console.log('888888888 L body: ', size10); // saber la longitud del body (cuantos elementos tenemos)
      obs.next(juegoColeccion);
    });
  });
  return juegoJuegoColeccionsUObservable;
}
// Get all games of user, if a game does not exists, it will display only the info it can retrieve
function getListaJuegos(idUser) {
  const listaObservables = new Observable(obs => {
    let listaJuegos = [];
    let bPuntos = [];
    let cPuntos = [];
    let dPuntos = [];
    let ePuntos = [];
    let fPuntos = [];
    // JUEGO DE PUNTOS
    getAlumnoJuegoPuntos(idUser).subscribe(alumnojuegodepuntos => {
      bPuntos = alumnojuegodepuntos[0];
      let size = alumnojuegodepuntos[1];
      let uri = alumnojuegodepuntos[2];
      console.log('MY URI 2222 IN %s is: ' + uri);
      getJuegoDePuntos(uri).subscribe(juegodepuntos => {
        let body2 = juegodepuntos[0];
        let size2 = juegodepuntos[1];
        if (size2 <= 0) {
          for (let j = 0; j < size2; j ++) {
            listaJuegos.push({NombreJuego: '', Puntos: [bPuntos[j].PuntosTotalesAlumno],
              Modo: '', JuegoActivo: 'null', id: '', Tipo: ''});
            console.log('MI PUNTOS SON: ' + bPuntos[j].PuntosTotalesAlumno);
            console.log('2 MIS JUEGOS ACTIVOS SON: ' + listaJuegos);
          }
        } else {
          for (let j = 0; j < size; j ++) {
            listaJuegos.push({NombreJuego: [body2[j].NombreJuego], Puntos: [bPuntos[j].PuntosTotalesAlumno],
              Modo: [body2[j].Modo], JuegoActivo: [body2[j].JuegoActivo], id: [body2[j].id], Tipo: [body2[j].Tipo],
              idAlumno: idUser});
            console.log('MI PUNTOS SON: ' + bPuntos[j].PuntosTotalesAlumno);
            console.log('2 MIS JUEGOS ACTIVOS SON: ' + listaJuegos);
          }
        }
        console.log('MIS JUEGOS ACTIVOS (PUNTOS) SON: ' + JSON.stringify(listaJuegos));
        // JUEGO COMPETICION LIGA
        getAlumnoJuegoCompeticionLiga(idUser).subscribe(alumnojuegocompeticionliga => {
          cPuntos = alumnojuegocompeticionliga[0];
          let size3 = alumnojuegocompeticionliga[1];
          let uri2 =  alumnojuegocompeticionliga[2];
          getJuegoCompeticionLiga(uri2).subscribe(juegocompeticionliga => {
            let body4 = juegocompeticionliga[0];
            let size4 = juegocompeticionliga[1];
            if (size4 > 0) {
              for (let l = 0; l < size4; l++) {
                listaJuegos.push({NombreJuego: [body4[l].NombreJuego], Puntos: [cPuntos[l].PuntosTotalesAlumno],
                  Modo: [body4[l].Modo], JuegoActivo: [body4[l].JuegoActivo], id: [body4[l].id], Tipo: [body4[l].Tipo],
                  Jornadas: [body4[l].NumeroTotalJornadas]});
                console.log('MI PUNTOS SON: ' + cPuntos[l].PuntosTotalesAlumno);
                console.log('3 MIS JUEGOS ACTIVOS SON: ' + listaJuegos);
              }
            } else {
              for (let l = 0; l < size3; l++) {
                listaJuegos.push({NombreJuego: '', Puntos: cPuntos[l].PuntosTotalesAlumno,
                  Modo: '', JuegoActivo: 'null', id: '', Tipo: '',
                  Jornadas: ''});
                console.log('MI PUNTOS SON: ' + cPuntos[l].PuntosTotalesAlumno);
                console.log('3 MIS JUEGOS ACTIVOS SON: ' + listaJuegos);
              }
            }
            console.log('MIS JUEGOS ACTIVOS (competicion liga) SON: ' + JSON.stringify(listaJuegos));
            // JUEGO COMPETICION LIGA FORMULA UNO
            getAlumnoJuegoCompeticionFUno(idUser).subscribe(alumnojuegocompeticionfu => {
              dPuntos = alumnojuegocompeticionfu[0];
              let size5 = alumnojuegocompeticionfu[1];
              let uri3 = alumnojuegocompeticionfu[2];
              getJuegoCompeticionFU(uri3).subscribe(juegocompeticionfu => {
                let body6 = juegocompeticionfu[0];
                let size6 = juegocompeticionfu[1];
                if (size6 > 0) {
                  for (let n = 0; n < size6; n++) {
                    listaJuegos.push({NombreJuego: [body6[n].NombreJuego], Puntos: dPuntos[n].PuntosTotalesAlumno,
                      Modo: body6[n].Modo, JuegoActivo: [body6[n].JuegoActivo], id: [body6[n].id], Tipo: [body6[n].Tipo],
                      Jornadas: [body6[n].NumeroTotalJornadas], NumeroParticipantesPuntuan: [body6[n].NumeroParticipantesPuntuan],
                      PuntosArray: [body6[n].Puntos]});
                    console.log('MI PUNTOS SON: ' + dPuntos[n].PuntosTotalesAlumno);
                    console.log('4 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                  }
                } else {
                  for (let n = 0; n < size5; n++) {
                    listaJuegos.push({NombreJuego: '', Puntos: dPuntos[n].PuntosTotalesAlumno,
                      Modo: '', JuegoActivo: 'null', id: '', Tipo: '',
                      Jornadas: '', NumeroParticipantesPuntuan: '',
                      PuntosArray: ''});
                    console.log('MI PUNTOS SON: ' + dPuntos[n].PuntosTotalesAlumno);
                    console.log('4 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                  }
                }
                console.log('MIS JUEGOS ACTIVOS (competicion formula formula uno) SON: ' + JSON.stringify(listaJuegos));
                // JUEGO CUESTIONARIO
                getAlumnoJuegoCuestionario(idUser).subscribe(alumnojuegocuestionario => {
                  ePuntos = alumnojuegocuestionario[0];
                  let size7 = alumnojuegocuestionario[0];
                  let uri4 = alumnojuegocuestionario[2];
                  getJuegoCuestionario(uri4).subscribe(juegocuestionario => {
                    let body8 = juegocuestionario[0];
                    let size8 = juegocuestionario[1];
                    if (size8 > 0) {
                      for (let o = 0; o < size8; o++) {
                        listaJuegos.push({NombreJuego: [body8[o].NombreJuego], Puntos: ePuntos[o].Nota,
                          cuestionarioId: body8[o].cuestionarioId, JuegoActivo: [body8[o].JuegoActivo], id: [body8[o].id], JuegoTerminado: [body8[o].JuegoTerminado],
                          Presentacion: [body8[o].Presentacion], PuntuacionCorrecta: [body8[o].PuntuacionCorrecta],
                          PuntuacionIncorrecta: [body8[o].PuntuacionIncorrecta], Tipo: ['Juego De Cuestionario'], Modo: ['Individual'],
                          grupoId: body8[o].grupoId, juegoDeCuestionarioId: body8[o].id, idCuestionarioAlumnoJuego: ePuntos[o].id, idAlumno: idUser});
                        console.log('MI PUNTOS SON: ' + ePuntos[o].Nota);
                        console.log('4 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                      }
                    } else {
                      for (let o = 0; o < size7; o++) {
                        listaJuegos.push({NombreJuego: '', Puntos: ePuntos[o].Nota,
                          cuestionarioId: '', JuegoActivo: 'null', id: '', JuegoTerminado: '',
                          Presentacion: '', PuntuacionCorrecta: '',
                          PuntuacionIncorrecta: '', Tipo: ['Juego De Cuestionario'], Modo: ['Individual'],
                          grupoId: '', juegoDeCuestionarioId: '', idCuestionarioAlumnoJuego: ePuntos[o].id, idAlumno: idUser});
                        console.log('MI PUNTOS SON: ' + ePuntos[o].Nota);
                        console.log('4 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                      }
                    }
                    console.log('MIS JUEGOS ACTIVOS (cuestionario) SON: ' + JSON.stringify(listaJuegos));
                    getAlumnoJuegoColeccion(idUser).subscribe(alumnojuegocoleccion => {
                      fPuntos = alumnojuegocoleccion[0];
                      let size9 = alumnojuegocoleccion[1];
                      let uri5 = alumnojuegocoleccion[2];
                      getJuegoColeccion(uri5).subscribe(juegocoleccion => {
                        let body9 = juegocoleccion[0];
                        let size10 = juegocoleccion[1];
                        if (size9 > 0) {
                          for (let o = 0; o < size9; o++) {
                            listaJuegos.push({NombreJuego: [body9[o].NombreJuego], coleccionId: body9[o].coleccionId,
                              JuegoActivo: [body9[o].JuegoActivo], id: [body9[o].id], Tipo: [body9[o].Tipo], Modo: ['Individual'],
                              grupoId: body9[o].grupoId, juegoDeColeccionId: body9[o].id, idColeccionAlumnoJuego: fPuntos[o].id, idAlumno: idUser});
                            console.log('5 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                          }
                        } else {
                          for (let o = 0; o < size10; o++) {
                            listaJuegos.push({NombreJuego: '', coleccionId: '', JuegoActivo: 'null',
                              id: '', Tipo: [body9[o].Tipo], Modo: ['Individual'],
                              grupoId: '', juegoDeColeccionId: '', idColeccionAlumnoJuego: fPuntos[o].id, idAlumno: idUser});
                            console.log('5 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                          }
                        }
                        console.log('MIS JUEGOS ACTIVOS (coleccion) SON: ' + JSON.stringify(listaJuegos));
                        getAlumnoJuegoAvatar(idUser).subscribe(alumnojuegosavatar => {
                          let mydata = alumnojuegosavatar[0];
                          let size10 = alumnojuegosavatar[1];
                          let uri6 = alumnojuegosavatar[2];
                          getJuegosAvatar(uri6).subscribe(juegosavatar => {
                            let body10 = juegosavatar[0];
                            let size11 = juegosavatar[1];
                            if (size10 > 0) {
                              for (let p = 0; p < size10; p++) {
                                listaJuegos.push({NombreJuego: [body10[p].NombreJuego],
                                  JuegoActivo: [body10[p].JuegoActivo], juegoAvatarid: [body10[p].id], Tipo: [body10[p].Tipo], Modo: [body10[p].Modo],
                                  grupoId: body10[p].grupoId, CriteriosPrivilegioComplemento1: body10[p].CriteriosPrivilegioComplemento1,
                                  CriteriosPrivilegioComplemento2: [body10[p].CriteriosPrivilegioComplemento2],
                                  CriteriosPrivilegioComplemento3: [body10[p].CriteriosPrivilegioComplemento3],
                                  CriteriosPrivilegioComplemento4: [body10[p].CriteriosPrivilegioComplemento4],
                                  CriteriosPrivilegioVoz: [body10[p].CriteriosPrivilegioVoz],
                                  CriteriosPrivilegioVerTodos: [body10[p].CriteriosPrivilegioVerTodos]});
                                console.log('6 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                              }
                            } else {
                              for (let q = 0; q < size11; q++) {
                                listaJuegos.push({NombreJuego: '', coleccionId: '', JuegoActivo: 'null',
                                  id: '', Tipo: [body10[q].Tipo], Modo: [body10[q].Modo]});
                                console.log('6 2 MIS JUEGOS ACTIVOS SON: ' + JSON.stringify(listaJuegos));
                              }
                            }
                            console.log('MIS JUEGOS ACTIVOS (AVATAR) SON: ' + JSON.stringify(listaJuegos));
                            obs.next(listaJuegos);
                          });
                        });
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
  return listaObservables;
}
// Get getRankingPuntos
function getRankingJuegoDePuntos(juegoDePuntosId) {
  const rankingJuegoDePuntosObservable = new Observable(obs => {
    let rankingJuegoDePuntos;
    let myuri = server  + '/api/AlumnoJuegosDePuntos?filter[where][or][0][juegoDePuntosId]=' + juegoDePuntosId;
    request.get(myuri, {json: true}, (error, response, body8) => {
      rankingJuegoDePuntos = body8;
      console.log('9999999 rankingJuegoDePuntos: ', rankingJuegoDePuntos);
      obs.next(rankingJuegoDePuntos);
    });
  });
  return rankingJuegoDePuntosObservable;
}
function getAvatar(idAlumnojJuegoAvatar) {
  const juegoAvatarObservable = new Observable(obs => {
    let alumnoJuegoAvatar = [];
    let myuri = server + '/api/alumnosJuegoAvatar?filter[where][juegoDeAvatarId]=' + idAlumnojJuegoAvatar;
    request.get(myuri, {json: true}, (error, response, body12) => {
      alumnoJuegoAvatar = body12;
      console.log('\n12 body: ', body12);
      obs.next(alumnoJuegoAvatar);
    });
  });
  return juegoAvatarObservable;
}
function getAlumnoJuegoAvatar(idAlumno) {
  const juegoAvatarObservable = new Observable(obs => {
    let misJuegosDeAvatar = [];
    let myuri = server + '/api/alumnosJuegoAvatar?filter[where][alumnoId]=' + idAlumno;
    let uri3 = '';
    request.get(myuri, {json: true}, (error, response, body8) => {
      misJuegosDeAvatar.push(body8);
      misJuegosDeAvatar.push(body8.length);
      console.log('15 misJuegosDeAvatar: ', misJuegosDeAvatar);
      console.log('15 body8: ', body8.length);
      let filterone3 = '';
      if (body8.length > 0) {
        filterone3 = body8[0].juegoDeAvatarId;
      }
      uri3 = server  + '/api/JuegosDeAvatar?filter[where][or][0][id]=' + filterone3;
      if (body8.length > 1) {
        for (let m = 1; m < body8.length; m++) {
          uri3 += '&filter[where][or]' + '[' + m + ']' + '[id]=' + body8[m].juegoDeAvatarId;
          console.log('MY URI getAlumnoJuegoAvatar IN %s is: ' + uri3, m);
        }
      }
      misJuegosDeAvatar.push(uri3);
      obs.next(misJuegosDeAvatar);
    });
  });
  return juegoAvatarObservable;
}

function getJuegosAvatar(myuri) {
  const juegoAvatarObservable = new Observable(obs => {
    let juegoAvatar = [];
    request.get(myuri, {json: true}, (error, response, body6) => {
      juegoAvatar.push(body6);
      console.log('16 body: ', body6);
      // Recogemos valores del body
      let size6 = body6.length;
      juegoAvatar.push(size6);
      console.log('16 L body: ', size6); // saber la longitud del body (cuantos elementos tenemos)
      obs.next(juegoAvatar);
    });
  });
  return juegoAvatarObservable;
}

function registeredUser(nombreUser, passwordUser) {
  const registeredObservable = new Observable(obs => {
    let registered = [];
    console.log('ESTAMOS EN REGISTEREDUSER: ' + nombreUser + ' ' + passwordUser);
    request.get(server + '/api/Alumnos?filter[where][Nombre]=' +
    nombreUser + '&filter[where][PrimerApellido]=' + passwordUser, {json: true}, (error, response) => {
      console.log('ESTAMOS EN REGISTEREDUSER 2: ' + JSON.stringify(response));
      let isRegistered = '';
      let id = '';
      console.log('longitud es: ' + response.body.length);
      console.log('longitud 2 es: ' + response.body[0].Nombre);
      if (response.body[0].Nombre == '') {
        registered = [isRegistered, id];
        segundoApellido = ' ';
      } else {
        isRegistered = response.body[0].UsuarioMoodle;
        id = response.body[0].id;
        registered = [isRegistered, id];
      }
      obs.next(registered);
    });
  });
  return registeredObservable;
}
// Creating a provider instance
const lti = new Lti(process.env.LTI_KEY,
    // Setting up database configurations
  {url: 'mongodb://' + process.env.DB_HOST + '/' + process.env.DB_DATABASE,
    connection: {user: process.env.DB_USER, pass: process.env.DB_PASS}},
    {appUrl: '/start', loginUrl: '/login', logger: true});

async function setup() {
  // Deploying provider, connecting to the database and starting express server.
  await lti.deploy({serverless: true});
  // Register Moodle as a platform
  const plat = await lti.registerPlatform({
    url: 'http://localhost',
    name: 'Local Moodle',
    clientId: 'lanPMuneshcfmTj',
    authenticationEndpoint: 'http://localhost/mod/lti/auth.php',
    accesstokenEndpoint: 'http://localhost/mod/lti/token.php',
    authConfig: {
      method: 'JWK_SET',
      key: 'http://localhost/mod/lti/certs.php'},
  });

  // Get the public key generated for that platform
  console.log(await plat.platformPublicKey());
  lti.onConnect((connection, request, response) => {
    console.log('dato de mooodle: ' + response.locals.token.id);
    console.log('\n\nconnection de mooodle: ' + connection);
    idUserMoodle = response.locals.token.id;
    nameUser = response.locals.token.userInfo.given_name;
    passUser = response.locals.token.userInfo.family_name;
    // Set the rerouting towards /begin
    lti.redirect(response, '/begin', {ignoreRoot: true, isNewResource: true});
    console.log('lti.onconnect okay\n');
  });
}

// Mount Ltijs express app into preexisting express app with /begin prefix
module.exports = async function(app) {
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.engine('ejs', engine);
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '../views'));
  // Logic when rerouted to /begin
  app.get('/begin', lti.app, async (req, res) => {
    // Render with ejs the login page
    registeredUser(nameUser, passUser).subscribe(registration => {
      console.log('ESTAMOS EN REGISTEREDUSER RESPONSE');
      miRegisteredUser = registration;
      let userData = {username: nameUser, password: passUser, registered: miRegisteredUser, classpipRegister: true};
      res.render('login.ejs', {data: userData});
    });
  });
  // List of Games Page
  app.use('/loginUser', function(req, resp, next) {
    // Añadir if en caso de que el usuario ya esté registrado
    let idRegisteredUser = req.url.split('/');
    console.log('estamos en el login user 1 con usuario registrado 2: ' + idRegisteredUser);
    console.log('lA LONGITUD ES: ' + idRegisteredUser.length);
    if (idRegisteredUser[1] != '' && nameUser != '') {
      console.log('entramos en el if 1');
      userId = idRegisteredUser[1];
      getUser(nameUser, passUser).subscribe(res => {
        getListaJuegos(idRegisteredUser[1]).subscribe(response => {
          console.log('estamos en el login user 3 con usuario ya registrado: ' + JSON.stringify(response));
          Juegos = response;
          resp.render('..\\..\\views\\games.ejs', {Nombre: nameUser, table: Juegos, Avatar: miAvatar});
        });
      });
    } else if (nameUser == '') {
      console.log('estamos en el login de usuario no registrado 1');
      let userData = {username: nameUser, password: passUser, registered: miRegisteredUser, classpipRegister: false};
      resp.render('..\\..\\views\\login.ejs', {data: userData});
    } else {
      console.log('estamos en el login de usuario no registrado 2');
      nombreUser = req.body.username;
      getUser(req.body.username, req.body.password).subscribe(res => {
        userId = res;
        alumno = JSON.stringify({Nombre: nameUser, PrimerApellido: passUser, SegundoApellido: segundoApellido,
          ImagenPerfil: miAvatarRoot, UsuarioMoodle: idUserMoodle, id: userId, profesorId: profesorId});
        updateUser(alumno, userId);
        console.log('estamos en el login user 2');
        console.log('userId is: ' + userId);
        getListaJuegos(userId).subscribe(response => {
          console.log('estamos en el login user 3: ' + JSON.stringify(response));
          Juegos = response;
          resp.render('..\\..\\views\\games.ejs', {Nombre: nombreUser, table: Juegos, Avatar: miAvatar});
        });
      });
    }
  });
  // Get Ranking of Puntos Page
  app.use('/rankingPuntos', function(req, resp, next) {
    console.log('MY HOST IS: ' + req.url);
    let urlSplit = req.url.split('/');
    let idPuntos = urlSplit[1];
    let idAlumno = urlSplit[2];
    console.log('My id alumno is: ' + urlSplit);
    let idPuntosAlumnoId = '';
    getRankingJuegoDePuntos(idPuntos).subscribe(ranking => {
      let rankingResponse = ranking;
      console.log('ranking es: ' + JSON.stringify(rankingResponse));
      console.log('ranking L es: ' + rankingResponse.length);
      let filterone12 = rankingResponse[0].juegoDePuntosId;
      let uri2 = server  + '/api/JuegosDePuntos?filter[where][or][0][id]=' + filterone12;
      console.log('MI URI2 BASE ES: ' + uri2);
      if (rankingResponse.length > 1) {
        for (let i = 1; i < rankingResponse.length; i++) {
          if (rankingResponse[i].juegoDePuntosId != rankingResponse[i - 1].juegoDePuntosId) {
            uri2 += '&filter[where][or]' + '[' + i + ']' + '[id]=' + rankingResponse[i].juegoDePuntosId;
            console.log('MY URI IN %s is ranking: ' + uri2, i);
          }
        }
      }
      let filterone13 = rankingResponse[0].alumnoId;
      let uri3 = server  + '/api/Alumnos?filter[where][or][0][id]=' + filterone13;
      if (rankingResponse.length > 1) {
        for (let i = 1; i < rankingResponse.length; i++) {
          uri3 += '&filter[where][or]' + '[' + i + ']' + '[id]=' + rankingResponse[i].alumnoId;
          console.log('MY URI IN %s is ranking 2: ' + uri3, i);
        }
      }
      let rankingList = [];
      getListaAlumnosJuegoPuntos(uri3).subscribe(listaalumnos => {
        let listaAlumnosJuegoPuntos = listaalumnos[0];
        let sizeListaAlumnos = listaalumnos[1];
        for (let l = 0; l < ranking.length; l++) {
          if (ranking[l].alumnoId == idAlumno) {
            idPuntosAlumnoId = ranking[l].alumnoId;
          }
        }
        console.log('sizeListaAlumnos: ' + sizeListaAlumnos);
        console.log('some info listaAlumnosJuegoPuntos: ' + listaAlumnosJuegoPuntos[0].Nombre);
        getJuegoDePuntos(uri2, 1).subscribe(allinfo => {
          console.log('allinfo is: ' + JSON.stringify(allinfo));
          for (let j = 0; j < sizeListaAlumnos; j++) {
            rankingList.push({nombre: [allinfo[0].NombreJuego], juegoDePuntosId: [rankingResponse[j].juegoDePuntosId],
              alumnoId: [rankingResponse[j].alumnoId], Puntos: [rankingResponse[j].PuntosTotalesAlumno]});
            console.log('rankingList in %s is: ' + JSON.stringify(rankingList), j);
          }
          console.log('rankingList is: ' + JSON.stringify(rankingList));
          let orderedRankingList = rankingList.sort((a, b) => (a.Puntos > b.Puntos) ? -1 : 1);
          resp.render('..\\..\\views\\ranking-puntos.ejs', {table: orderedRankingList, myId: idPuntosAlumnoId, listaAlumnos: listaAlumnosJuegoPuntos});
        });
      });
    });
  });
  // Get Quiz Page
  app.use('/Cuestionario', function(req, resp, next) {
    console.log('MY HOST IS: ' + req.url);
    let idCuest = req.url.split('/');
    console.log('My id cuest is: ' + idCuest);
    getCuestionario(idCuest[1], idCuest[2], idCuest[3], idCuest[4], idCuest[5]).subscribe(response => {
      Cuestionarios = response;
      console.log('MY CUESTIONARIO IS: ' + JSON.stringify(Cuestionarios));
      resp.render('..\\..\\views\\game-cuestionario.ejs', {table: Cuestionarios, Nombre: nombreUser,
        numeroPreguntas: Cuestionarios.length});
    });
  });
  // Get Collection Page
  app.use('/Coleccion', function(req, resp, next) {
    console.log('MY HOST IS: ' + req.url);
    let idCol = req.url.split('/');
    let coleccionAlumno, coleccion;
    let dosCaras = idCol[6];
    console.log('My id Coleccion is: ' + idCol);
    getColeccion(idCol[1], idCol[2], idCol[3], idCol[4], idCol[5], dosCaras).subscribe(response => {
      coleccion = response[0];
      coleccionAlumno = response[1];
      console.log('MY coleccion IS: ' + JSON.stringify(coleccion));
      console.log('MY coleccion 2 IS: ' + JSON.stringify(coleccionAlumno));
      for (let z = 0; z < coleccionAlumno.length; z++) {
        console.log('MY coleccion 3 IS in %s: ' + JSON.stringify(coleccion[z].idCColeccion), z);
        for (let y = 0; y < coleccionAlumno.length; y++) {
          if (JSON.stringify(coleccion[z].idCColeccion) == JSON.stringify(coleccionAlumno[y].cromoIdCColeccionAlumno)) {
            console.log('MY coleccion 4 IS in %s: ' + JSON.stringify(coleccionAlumno[y].cromoIdCColeccionAlumno), y);
            y++;
          }
        }
      }
      resp.render('..\\..\\views\\game-coleccion.ejs', {Coleccion: coleccion, ColeccionAlumno: coleccionAlumno, Nombre: nombreUser, Doscaras: dosCaras});
    });
  });
  // Save Quiz and reload List of Games Page
  app.use('/answerQuiz', function(req, resp, next) {
    console.log('MY HOST IS: ' + req.url.split('/answerQuiz').pop());
    let myValues = req.url.split('/answerQuiz').pop();
    let singleValues = myValues.split('/');
    console.log('MY singleValues ARE: ' + singleValues);
    let cuestionarioId = singleValues[1];
    let grupoId = singleValues[2];
    let puntosCorrectos = parseInt(singleValues[3]);
    let puntosIncorrectos = parseInt(singleValues[4]);
    let idCuestionarioJuego = singleValues[5];
    let puntosTotales = (puntosCorrectos + puntosIncorrectos);
    let puntosCorrectosTotales = (puntosCorrectos - (puntosIncorrectos / 3));
    let idJuegoCuestionarioAlumno = singleValues[6];
    let idAlumno = singleValues[7];
    miNota = puntosCorrectosTotales;
    if (miNota <= 0) {
      miNota = 0;
    }
    console.log('MI PUNTO CORR: ' + puntosCorrectos);
    console.log('MI PUNTO INCO: ' + puntosIncorrectos);
    console.log('MI PUNTO TOT: ' + puntosTotales);
    console.log('MI PUNTO puntosCorrectosTotales: ' + puntosCorrectosTotales);
    console.log('MI NOTA 0: ' + miNota);
    miNota = miNota / puntosTotales;
    miNota = (miNota * 10).toFixed(2);
    // Request to get data of Juego de Cuestionario. We create JuegosDeCuestionario updated
    request.get(server  + '/api/JuegosDeCuestionario?filter[where][or][0][id]=' + idCuestionarioJuego, {json: true}, (error, response, body) => {
      JuegosDeCuestionario = JSON.stringify({NombreJuego: body.NombreJuego, PuntuacionCorrecta: puntosCorrectos,
        PuntuacionIncorrecta: puntosIncorrectos, Presentacion: body.Presentacion, JuegoActivo: false,
        JuegoTerminado: body.JuegoTerminado, profesorId: body.profesorId, grupoId: grupoId, cuestionarioId: cuestionarioId});
      console.log('CUESTIONARIO ES: ' + JuegosDeCuestionario);
       // Request to get data of Juego de Cuestionario del alumno. We create alumnoJuegoDeCuestionario updated
      request.get(server  + '/api/AlumnosJuegoDeCuestionario?filter[where][or][0][juegoDeCuestionarioId]=' + idCuestionarioJuego, {json: true}, (error2, response2, body2) => {
        console.log('MY response2 IS:' + JSON.stringify(response2.body));
        alumnoJuegoDeCuestionario = JSON.stringify({Nota: (miNota).toString(), alumnoId: idAlumno,
          juegoDeCuestionarioId: idCuestionarioJuego});
        console.log('The iod obdy oif: ' + body2.id);
        console.log('MY alumnoJuegoDeCuestionario IS : ' + alumnoJuegoDeCuestionario);
        guardarRespuestas(idCuestionarioJuego, grupoId, idJuegoCuestionarioAlumno);
        guardarNota(idJuegoCuestionarioAlumno);
        // After saving the corresonding data, we reload the games page
        getListaJuegos(userId).subscribe(response => {
          console.log('estamos en el login user 3: ' + response);
          Juegos = response;
          resp.render('..\\..\\views\\games.ejs', {Nombre: nombreUser, table: Juegos, Avatar: miAvatar});
        });
      });
    });
  });
  app.use('/Avatar', function(req, resp, next) {
    console.log('MY HOST avatar IS: ' + req.url);
    let MYURL = req.url.split('/');
    let idJuegoAvatarAlumno = MYURL[1];
    console.log('My idJuegoAvatarAlumno is: ' + idJuegoAvatarAlumno);
    getAvatar(idJuegoAvatarAlumno).subscribe(response => {
      let miJuegoAvatar = response;
      miJuegoAvatar.forEach(function(element) {
        console.log('mi avatar es: ' + element.Privilegios);
        if (element.Privilegios[0] == true) {
          console.log('priv 1 es ' + element.Privilegios[0]);
        } else if (element.Privilegios[1] == true) {
          console.log('mi prive 2 es ' + element.Privilegios[1]);
        } else if (element.Privilegios[2] == true) {
          console.log('mi prive 3 es ' + element.Privilegios[2]);
        } else if (element.Privilegios[3] == true) {
          console.log('mi prive 4 es ' + element.Privilegios[3]);
        } else if (element.Privilegios[4] == true) {
          console.log('mi prive 5 es ' + element.Privilegios[4]);
        } else if (element.Privilegios[5] == true) {
          console.log('mi prive 6 es ' + element.Privilegios[5]);
        }
      });
      resp.render('..\\..\\views\\game-avatar.ejs', {Nombre: nombreUser, table: miJuegoAvatar});
    });
  });
  // Make post of /login and /start be managed by ltijs (otherwise gives error)
  app.post('/login', lti.app);
  app.post('/start', lti.app);
};
// Deploy lti connection
setup();
