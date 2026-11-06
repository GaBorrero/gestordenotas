/* Gestor de Calificaciones: lógica de la página.
   Calcula promedios y estados, actualiza el resumen y guarda los cambios
   en el navegador (localStorage). */
(function () {
  "use strict";

  var KEY = "gestor-calificaciones-v1";

  // Datos de ejemplo: nombre y cuatro calificaciones por alumno
  var ejemplo = [
    ["Valentina Gómez Ríos", 4.2, 3.8, 4.5, 4.0],
    ["Santiago Herrera Castro", 3.5, 3.0, 3.8, 3.6],
    ["Isabella Martínez López", 4.8, 4.6, 4.9, 4.7],
    ["Mateo Ramírez Torres", 2.8, 3.2, 2.5, 3.0],
    ["Sofía Vargas Peña", 4.0, 4.3, 3.9, 4.4],
    ["Juan David Ortiz Salazar", 3.2, 3.6, 3.4, 3.9],
    ["Camila Restrepo Duque", 4.5, 4.1, 4.7, 4.3],
    ["Samuel Cárdenas Mora", 2.5, 2.9, 3.1, 2.7],
    ["Mariana Jiménez Ocampo", 3.9, 4.2, 4.0, 4.1],
    ["Daniel Arias Quintero", 3.0, 3.4, 3.3, 3.5],
    ["Luciana Moreno Patiño", 4.6, 4.4, 4.8, 4.5],
    ["Nicolás Bedoya Franco", 3.7, 3.5, 3.9, 3.8],
    ["Gabriela Londoño Ruiz", 4.1, 3.9, 4.2, 4.0],
    ["Andrés Felipe Zapata Gil", 2.9, 3.1, 2.6, 3.3],
    ["Daniela Cortés Navarro", 4.3, 4.7, 4.4, 4.6],
    ["Emmanuel Osorio Vélez", 3.4, 3.2, 3.6, 3.1],
    ["Salomé Aguirre Bernal", 4.9, 4.8, 5.0, 4.7],
    ["Sebastián Lozano Cruz", 3.3, 3.7, 3.2, 3.8],
    ["Juliana Peña Marín", 4.0, 3.6, 4.2, 3.9],
    ["Tomás Echeverri Suárez", 3.1, 2.8, 3.4, 3.0]
  ];

  var state = {
    docente: "Carlos Andrés Rojas Mejía",
    materia: "Matemáticas",
    minima: 3.0,
    alumnos: ejemplo.map(function (r) {
      return { n: r[0], g: [r[1], r[2], r[3], r[4]] };
    })
  };

  try {
    var guardado = JSON.parse(localStorage.getItem(KEY) || "null");
    if (guardado && Array.isArray(guardado.alumnos)) state = guardado;
  } catch (e) {}

  function guardar() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  var $ = function (id) { return document.getElementById(id); };
  var rowsEl = $("rows");
  var footEl = $("foot");
  var statsEl = $("stats");

  // Convierte texto a nota entre 0 y 5; null si está vacío o no es número
  function aNota(v) {
    var x = parseFloat(v);
    return isNaN(x) ? null : Math.min(5, Math.max(0, x));
  }

  function suma(lista) {
    return lista.reduce(function (s, v) { return s + v; }, 0);
  }

  // Promedio de las notas escritas y si el alumno tiene las cuatro
  function calcular(alumno) {
    var vals = alumno.g.filter(function (v) { return v !== null; });
    return {
      promedio: vals.length ? suma(vals) / vals.length : null,
      completo: vals.length === 4
    };
  }

  function dos(x) { return x === null ? "—" : x.toFixed(2); }

  function actualizarFila(tr, alumno, i) {
    var r = calcular(alumno);
    tr.querySelector(".idx").textContent = i + 1;
    tr.querySelector(".avg b").textContent = dos(r.promedio);
    tr.querySelector(".meter i").style.width =
      r.promedio === null ? "0%" : (r.promedio / 5 * 100) + "%";

    var pill = tr.querySelector(".pill");
    if (!r.completo) {
      pill.className = "pill warn";
      pill.textContent = "Incompleto";
    } else if (r.promedio >= state.minima) {
      pill.className = "pill ok";
      pill.textContent = "Aprobado";
    } else {
      pill.className = "pill bad";
      pill.textContent = "Reprobado";
    }
  }

  function crearFila(alumno, i) {
    var tr = document.createElement("tr");

    function celda(clase) {
      var c = document.createElement("td");
      if (clase) c.className = clase;
      tr.appendChild(c);
      return c;
    }

    celda("idx");

    var nombre = document.createElement("input");
    nombre.type = "text";
    nombre.className = "name";
    nombre.value = alumno.n;
    nombre.setAttribute("aria-label", "Nombre del alumno");
    nombre.addEventListener("input", function () {
      alumno.n = nombre.value;
      guardar();
      actualizarResumen();
    });
    celda("l").appendChild(nombre);

    for (var k = 0; k < 4; k++) {
      (function (k) {
        var nota = document.createElement("input");
        nota.type = "number";
        nota.step = "0.1";
        nota.min = "0";
        nota.max = "5";
        nota.inputMode = "decimal";
        nota.className = "grade";
        nota.value = alumno.g[k] === null ? "" : alumno.g[k];
        nota.setAttribute("aria-label", "Nota " + (k + 1));
        nota.addEventListener("input", function () {
          alumno.g[k] = aNota(nota.value);
          guardar();
          actualizarFila(tr, alumno, state.alumnos.indexOf(alumno));
          actualizarResumen();
        });
        // Al salir del recuadro se corrige a un valor entre 0 y 5
        nota.addEventListener("change", function () {
          nota.value = alumno.g[k] === null ? "" : alumno.g[k];
        });
        celda().appendChild(nota);
      })(k);
    }

    celda("avg").innerHTML = "<b></b><div class='meter'><i></i></div>";
    celda().innerHTML = "<span class='pill'></span>";

    var quitar = document.createElement("button");
    quitar.type = "button";
    quitar.className = "del";
    quitar.textContent = "×";
    quitar.title = "Quitar alumno";
    quitar.setAttribute("aria-label", "Quitar alumno");
    quitar.addEventListener("click", function () {
      state.alumnos.splice(state.alumnos.indexOf(alumno), 1);
      guardar();
      dibujarFilas();
      actualizarResumen();
    });
    celda().appendChild(quitar);

    actualizarFila(tr, alumno, i);
    return tr;
  }

  function dibujarFilas() {
    rowsEl.textContent = "";
    state.alumnos.forEach(function (a, i) {
      rowsEl.appendChild(crearFila(a, i));
    });
  }

  function actualizarResumen() {
    var lista = state.alumnos;
    var promedios = [];
    var mejor = null;
    var peor = null;
    var aprobados = 0;
    var reprobados = 0;

    lista.forEach(function (a) {
      var r = calcular(a);
      if (r.promedio === null) return;
      promedios.push(r.promedio);
      if (!mejor || r.promedio > mejor.v) mejor = { v: r.promedio, n: a.n };
      if (!peor || r.promedio < peor.v) peor = { v: r.promedio, n: a.n };
      if (r.completo) {
        if (r.promedio >= state.minima) aprobados++;
        else reprobados++;
      }
    });

    var general = promedios.length ? suma(promedios) / promedios.length : null;

    var tarjetas = [
      ["Promedio general", dos(general), lista.length + " alumnos", ""],
      ["Más alto", mejor ? dos(mejor.v) : "—", mejor ? mejor.n : "", ""],
      ["Más bajo", peor ? dos(peor.v) : "—", peor ? peor.n : "", ""],
      ["Aprobados", String(aprobados), "desde " + state.minima.toFixed(1), "ok"],
      ["Reprobados", String(reprobados), "bajo " + state.minima.toFixed(1), "bad"]
    ];

    statsEl.textContent = "";
    tarjetas.forEach(function (t) {
      var d = document.createElement("div");
      d.className = "stat " + t[3];
      var k = document.createElement("span");
      k.className = "k";
      k.textContent = t[0];
      var v = document.createElement("span");
      v.className = "v";
      v.textContent = t[1];
      var s = document.createElement("span");
      s.className = "s";
      s.textContent = t[2];
      d.appendChild(k);
      d.appendChild(v);
      d.appendChild(s);
      statsEl.appendChild(d);
    });

    // Pie de tabla: promedio de cada una de las cuatro notas
    footEl.textContent = "";
    var tr = document.createElement("tr");
    var titulo = document.createElement("td");
    titulo.colSpan = 2;
    titulo.className = "l";
    titulo.textContent = "Promedio por nota";
    tr.appendChild(titulo);

    for (var k = 0; k < 4; k++) {
      var vals = lista
        .map(function (a) { return a.g[k]; })
        .filter(function (v) { return v !== null; });
      var c = document.createElement("td");
      c.className = "f";
      c.textContent = vals.length ? dos(suma(vals) / vals.length) : "—";
      tr.appendChild(c);
    }

    var cg = document.createElement("td");
    cg.className = "f";
    cg.textContent = dos(general);
    tr.appendChild(cg);

    var vacio = document.createElement("td");
    vacio.colSpan = 2;
    tr.appendChild(vacio);
    footEl.appendChild(tr);
  }

  function actualizarTodo() {
    Array.prototype.forEach.call(rowsEl.children, function (tr, i) {
      actualizarFila(tr, state.alumnos[i], i);
    });
    actualizarResumen();
  }

  // Datos del curso
  var docente = $("docente");
  var materia = $("materia");
  var minima = $("minima");

  docente.value = state.docente;
  materia.value = state.materia;
  minima.value = state.minima;

  docente.addEventListener("input", function () {
    state.docente = docente.value;
    guardar();
  });

  materia.addEventListener("input", function () {
    state.materia = materia.value;
    guardar();
  });

  minima.addEventListener("input", function () {
    var v = aNota(minima.value);
    if (v === null) return;
    state.minima = v;
    guardar();
    actualizarTodo();
  });

  minima.addEventListener("change", function () {
    minima.value = state.minima;
  });

  // Agregar alumno
  $("add").addEventListener("click", function () {
    var nuevo = { n: "Nuevo alumno", g: [null, null, null, null] };
    state.alumnos.push(nuevo);
    guardar();
    var tr = crearFila(nuevo, state.alumnos.length - 1);
    rowsEl.appendChild(tr);
    actualizarResumen();
    var campo = tr.querySelector("input.name");
    campo.focus();
    campo.select();
  });

  dibujarFilas();
  actualizarResumen();
})();
