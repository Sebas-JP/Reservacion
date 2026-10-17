/* ==========================================
   RESTAURANTE RATATOULLI
   PANEL DE ADMINISTRACIÓN (conectado a la API)
   ========================================== */

const token = localStorage.getItem("token");
const usuario = JSON.parse(localStorage.getItem("usuario") || "null");

// Solo entra el administrador
if (!token || !usuario || usuario.rol !== "admin") {
    window.location.href = "login-admin.html";
}

let reservas = [];
let mesas = [];
let idEnEdicion = null;

const ETIQUETA = { activa: "Pendiente", confirmada: "Confirmada", cancelada: "Cancelada" };

/* ---------- Elementos ---------- */

const tabla = document.getElementById("tabla-body");
const filtro = document.getElementById("filtro-fecha");
const seccionEditar = document.getElementById("seccion-editar");
const formEditar = document.getElementById("form-editar");
const editarMesa = document.getElementById("editar-mesa");
const editarFecha = document.getElementById("editar-fecha");
const editarHora = document.getElementById("editar-hora");
const editarPersonas = document.getElementById("editar-personas");
const mensajeEditar = document.getElementById("mensaje-editar");
const capacidadEditar = document.getElementById("capacidad-editar");

/* ---------- Utilidades de API ---------- */

function fechaLocal(date) {
    const a = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${a}-${m}-${d}`;
}

async function api(url, opciones = {}) {
    const respuesta = await fetch(url, {
        ...opciones,
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
        }
    });

    if (respuesta.status === 401 || respuesta.status === 403) {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        window.location.href = "login-admin.html";
        throw new Error("Sesión no válida");
    }

    const datos = await respuesta.json();
    if (!respuesta.ok) {
        throw new Error(datos.error || datos.mensaje || "Error del servidor");
    }
    return datos;
}

/* ---------- Cargar datos ---------- */

async function cargarMesas() {
    const respuesta = await fetch("/api/mesas");
    mesas = await respuesta.json();

    editarMesa.innerHTML = "";
    mesas.forEach(function (m) {
        const opcion = document.createElement("option");
        opcion.value = m.id;
        opcion.textContent = `Mesa ${m.numero} - ${m.capacidad} personas`;
        editarMesa.appendChild(opcion);
    });
}

async function cargarReservas() {
    const fecha = filtro.value || fechaLocal(new Date());
    try {
        reservas = await api("/api/admin/reservas?fecha=" + encodeURIComponent(fecha));
    } catch (error) {
        reservas = [];
        tabla.innerHTML = "";
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.textContent = "No se pudieron cargar las reservas: " + error.message;
        fila.appendChild(celda);
        tabla.appendChild(fila);
        return;
    }
    mostrarReservas();
}

/* ---------- Mostrar reservas ---------- */

function mostrarReservas() {
    tabla.innerHTML = "";

    // El servidor ya las entrega ordenadas por hora y mesa
    reservas.forEach(function (reserva) {
        const fila = document.createElement("tr");

        [reserva.codigo, reserva.mesa, reserva.fecha, reserva.hora, reserva.personas]
            .forEach(function (valor) {
                const celda = document.createElement("td");
                celda.textContent = valor;
                fila.appendChild(celda);
            });

        const celdaEstado = document.createElement("td");
        celdaEstado.textContent = ETIQUETA[reserva.estado] || reserva.estado;
        celdaEstado.className = "estado-" + (ETIQUETA[reserva.estado] || "").toLowerCase();
        fila.appendChild(celdaEstado);

        const celdaAcciones = document.createElement("td");
        const contenedor = document.createElement("div");
        contenedor.className = "acciones-admin";

        if (reserva.estado !== "cancelada") {
            const modificar = document.createElement("button");
            modificar.textContent = "Modificar";
            modificar.className = "btn-modificar";
            modificar.addEventListener("click", function () { abrirEdicion(reserva.id); });
            contenedor.appendChild(modificar);
        }

        if (reserva.estado === "activa") {
            const confirmar = document.createElement("button");
            confirmar.textContent = "Confirmar";
            confirmar.className = "btn-confirmar";
            confirmar.addEventListener("click", function () { cambiarEstado(reserva.id, "confirmada"); });
            contenedor.appendChild(confirmar);
        }

        if (reserva.estado !== "cancelada") {
            const cancelar = document.createElement("button");
            cancelar.textContent = "Cancelar";
            cancelar.className = "btn-cancelar";
            cancelar.addEventListener("click", function () { cambiarEstado(reserva.id, "cancelada"); });
            contenedor.appendChild(cancelar);
        }

        celdaAcciones.appendChild(contenedor);
        fila.appendChild(celdaAcciones);
        tabla.appendChild(fila);
    });

    if (reservas.length === 0) {
        const fila = document.createElement("tr");
        const celda = document.createElement("td");
        celda.colSpan = 7;
        celda.textContent = "No hay reservas para esta fecha.";
        fila.appendChild(celda);
        tabla.appendChild(fila);
    }

    actualizarEstadisticas(reservas);
}

function actualizarEstadisticas(lista) {
    const vigentes = lista.filter(function (r) { return r.estado !== "cancelada"; });

    document.getElementById("total-reservas").textContent = lista.length;
    document.getElementById("total-personas").textContent =
        vigentes.reduce(function (total, r) { return total + r.personas; }, 0);
    document.getElementById("total-confirmadas").textContent =
        lista.filter(function (r) { return r.estado === "confirmada"; }).length;
    document.getElementById("total-pendientes").textContent =
        lista.filter(function (r) { return r.estado === "activa"; }).length;
}

/* ---------- Confirmar / cancelar ---------- */

async function cambiarEstado(id, nuevoEstado) {
    try {
        await api("/api/admin/reservas/" + id, {
            method: "PUT",
            body: JSON.stringify({ estado: nuevoEstado })
        });
        if (nuevoEstado === "cancelada" && idEnEdicion === id) cerrarEdicion();
        await cargarReservas();
    } catch (error) {
        alert(error.message);
    }
}

/* ---------- Edición ---------- */

function abrirEdicion(id) {
    const reserva = reservas.find(function (r) { return r.id === id; });
    if (!reserva || reserva.estado === "cancelada") return;

    idEnEdicion = id;
    document.getElementById("codigo-editar").textContent = reserva.codigo;

    editarMesa.value = String(reserva.mesa_id);
    editarFecha.value = reserva.fecha;
    editarHora.value = reserva.hora;
    editarPersonas.value = reserva.personas;
    mensajeEditar.textContent = "";

    actualizarCapacidad();
    seccionEditar.hidden = false;
    seccionEditar.scrollIntoView({ behavior: "smooth", block: "start" });
}

function actualizarCapacidad() {
    const mesa = mesas.find(function (m) { return String(m.id) === editarMesa.value; });
    if (!mesa) return;
    editarPersonas.max = mesa.capacidad;
    capacidadEditar.textContent = `Capacidad máxima: ${mesa.capacidad} personas`;
}

async function guardarModificacion(event) {
    event.preventDefault();
    mensajeEditar.style.color = "red";

    const mesa = mesas.find(function (m) { return String(m.id) === editarMesa.value; });
    const fecha = editarFecha.value;
    const hora = editarHora.value;
    const personas = Number(editarPersonas.value);

    if (!mesa) {
        mensajeEditar.textContent = "Selecciona una mesa válida.";
        return;
    }
    if (!Number.isInteger(personas) || personas < 1 || personas > mesa.capacidad) {
        mensajeEditar.textContent =
            `La Mesa ${mesa.numero} admite entre 1 y ${mesa.capacidad} personas.`;
        return;
    }
    if (!fecha || !hora) {
        mensajeEditar.textContent = "Selecciona fecha y hora.";
        return;
    }

    // El servidor valida de nuevo capacidad y conflictos de horario
    try {
        await api("/api/admin/reservas/" + idEnEdicion, {
            method: "PUT",
            body: JSON.stringify({ mesa_id: mesa.id, fecha, hora, personas })
        });
        mensajeEditar.style.color = "green";
        mensajeEditar.textContent = "Reserva modificada correctamente.";
        await cargarReservas();
    } catch (error) {
        mensajeEditar.textContent = error.message;
    }
}

function cerrarEdicion() {
    seccionEditar.hidden = true;
    idEnEdicion = null;
    formEditar.reset();
    mensajeEditar.textContent = "";
}

/* ---------- Eventos ---------- */

filtro.addEventListener("change", cargarReservas);
editarMesa.addEventListener("change", actualizarCapacidad);
formEditar.addEventListener("submit", guardarModificacion);
document.getElementById("btn-cerrar-editar").addEventListener("click", cerrarEdicion);

// Inicio: fecha de hoy, mesas reales y reservas del día
filtro.value = fechaLocal(new Date());
cargarMesas().then(cargarReservas);