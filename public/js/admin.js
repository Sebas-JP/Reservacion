
/* ==========================================
   RESTAURANTE RATATOULLI
   PANEL DE ADMINISTRACIÓN
   ========================================== */

// DATOS DE PRUEBA
// Todavía no están conectados a la base de datos.

const reservas = [
    {
        codigo: "RAT-001",
        mesa: 1,
        fecha: "2026-10-16",
        hora: "18:00",
        personas: 2,
        estado: "Confirmada"
    },
    {
        codigo: "RAT-002",
        mesa: 3,
        fecha: "2026-10-16",
        hora: "19:00",
        personas: 6,
        estado: "Pendiente"
    },
    {
        codigo: "RAT-003",
        mesa: 5,
        fecha: "2026-10-16",
        hora: "20:00",
        personas: 2,
        estado: "Pendiente"
    },
    {
        codigo: "RAT-004",
        mesa: 6,
        fecha: "2026-10-17",
        hora: "18:00",
        personas: 8,
        estado: "Cancelada"
    }
];

/* ==========================================
   CAPACIDAD DE LAS MESAS
   ========================================== */

const capacidadesMesas = {
    1: 2,
    2: 4,
    3: 6,
    4: 4,
    5: 2,
    6: 8
};

// Reserva que se está editando
let codigoEnEdicion = null;

/* ==========================================
   ELEMENTOS HTML
   ========================================== */

const tabla = document.getElementById("tabla-body");
const filtro = document.getElementById("filtro-fecha");

const seccionEditar = document.getElementById(
    "seccion-editar"
);

const formEditar = document.getElementById(
    "form-editar"
);

const editarMesa = document.getElementById(
    "editar-mesa"
);

const editarFecha = document.getElementById(
    "editar-fecha"
);

const editarHora = document.getElementById(
    "editar-hora"
);

const editarPersonas = document.getElementById(
    "editar-personas"
);

const mensajeEditar = document.getElementById(
    "mensaje-editar"
);

const capacidadEditar = document.getElementById(
    "capacidad-editar"
);

/* ==========================================
   MOSTRAR RESERVAS
   ========================================== */

function mostrarReservas() {

    tabla.innerHTML = "";

    const fechaSeleccionada = filtro.value;

    // Filtrar y ordenar las reservas
    const filtradas = reservas
        .filter(reserva =>
            !fechaSeleccionada ||
            reserva.fecha === fechaSeleccionada
        )
        .sort((a, b) =>
            a.fecha.localeCompare(b.fecha) ||
            a.hora.localeCompare(b.hora) ||
            a.mesa - b.mesa
        );

    filtradas.forEach(reserva => {

        const fila = document.createElement("tr");

        // Crear columnas de información
        const valores = [
            reserva.codigo,
            reserva.mesa,
            reserva.fecha,
            reserva.hora,
            reserva.personas
        ];

        valores.forEach(valor => {

            const celda = document.createElement("td");
            celda.textContent = valor;

            fila.appendChild(celda);
        });

        // Columna del estado
        const celdaEstado = document.createElement("td");

        celdaEstado.textContent = reserva.estado;

        celdaEstado.className =
            "estado-" + reserva.estado.toLowerCase();

        fila.appendChild(celdaEstado);

        // Columna de acciones
        const celdaAcciones = document.createElement("td");

        const contenedor = document.createElement("div");
        contenedor.className = "acciones-admin";

        /* BOTÓN MODIFICAR */

        if (reserva.estado !== "Cancelada") {

            const modificar = document.createElement("button");

            modificar.textContent = "Modificar";
            modificar.className = "btn-modificar";

            modificar.addEventListener("click", () => {
                abrirEdicion(reserva.codigo);
            });

            contenedor.appendChild(modificar);
        }

        /* BOTÓN CONFIRMAR */

        if (reserva.estado === "Pendiente") {

            const confirmar = document.createElement("button");

            confirmar.textContent = "Confirmar";
            confirmar.className = "btn-confirmar";

            confirmar.addEventListener("click", () => {
                cambiarEstado(reserva.codigo, "Confirmada");
            });

            contenedor.appendChild(confirmar);
        }

        /* BOTÓN CANCELAR */

        if (reserva.estado !== "Cancelada") {

            const cancelar = document.createElement("button");

            cancelar.textContent = "Cancelar";
            cancelar.className = "btn-cancelar";

            cancelar.addEventListener("click", () => {
                cambiarEstado(reserva.codigo, "Cancelada");
            });

            contenedor.appendChild(cancelar);
        }

        celdaAcciones.appendChild(contenedor);
        fila.appendChild(celdaAcciones);

        tabla.appendChild(fila);
    });

    // Mensaje si no existen reservas
    if (filtradas.length === 0) {

        const fila = document.createElement("tr");
        const celda = document.createElement("td");

        celda.colSpan = 7;
        celda.textContent =
            "No hay reservas para esta fecha.";

        fila.appendChild(celda);
        tabla.appendChild(fila);
    }

    actualizarEstadisticas(filtradas);
}

/* ==========================================
   ACTUALIZAR ESTADÍSTICAS
   ========================================== */

function actualizarEstadisticas(lista) {

    const activas = lista.filter(
        reserva => reserva.estado !== "Cancelada"
    );

    // Total de reservas mostradas
    document.getElementById("total-reservas")
        .textContent = lista.length;

    // Personas esperadas en reservas activas
    document.getElementById("total-personas")
        .textContent = activas.reduce(
            (total, reserva) => total + reserva.personas,
            0
        );

    // Confirmadas
    document.getElementById("total-confirmadas")
        .textContent = lista.filter(
            reserva => reserva.estado === "Confirmada"
        ).length;

    // Pendientes
    document.getElementById("total-pendientes")
        .textContent = lista.filter(
            reserva => reserva.estado === "Pendiente"
        ).length;
}

/* ==========================================
   CAMBIAR ESTADO
   ========================================== */

function cambiarEstado(codigo, nuevoEstado) {

    const reserva = reservas.find(
        reserva => reserva.codigo === codigo
    );

    if (!reserva || reserva.estado === "Cancelada") {
        return;
    }

    // Verificar conflicto antes de confirmar
    if (
        nuevoEstado === "Confirmada" &&
        existeConflicto(
            reserva.mesa,
            reserva.fecha,
            reserva.hora,
            reserva.codigo
        )
    ) {
        alert(
            "No se puede confirmar: la mesa tiene " +
            "otra reserva activa en ese horario."
        );
        return;
    }

    reserva.estado = nuevoEstado;

    // Cerrar edición si se cancela la reserva abierta
    if (
        nuevoEstado === "Cancelada" &&
        codigoEnEdicion === codigo
    ) {
        cerrarEdicion();
    }

    mostrarReservas();
}

/* ==========================================
   ABRIR FORMULARIO DE EDICIÓN
   ========================================== */

function abrirEdicion(codigo) {

    const reserva = reservas.find(
        reserva => reserva.codigo === codigo
    );

    if (!reserva || reserva.estado === "Cancelada") {
        return;
    }

    codigoEnEdicion = codigo;

    document.getElementById("codigo-editar")
        .textContent = reserva.codigo;

    // Cargar los datos actuales
    editarMesa.value = String(reserva.mesa);
    editarFecha.value = reserva.fecha;
    editarHora.value = reserva.hora;
    editarPersonas.value = reserva.personas;

    mensajeEditar.textContent = "";

    actualizarCapacidad();

    // Mostrar formulario
    seccionEditar.hidden = false;

    seccionEditar.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

/* ==========================================
   ACTUALIZAR CAPACIDAD
   ========================================== */

function actualizarCapacidad() {

    const mesa = Number(editarMesa.value);

    const capacidad = capacidadesMesas[mesa];

    editarPersonas.max = capacidad;

    capacidadEditar.textContent =
        `Capacidad máxima: ${capacidad} personas`;
}

/* ==========================================
   VALIDAR CONFLICTOS
   ========================================== */

function existeConflicto(
    mesa,
    fecha,
    hora,
    codigoActual
) {

    return reservas.some(reserva =>

        // No comparar contra la misma reserva
        reserva.codigo !== codigoActual &&

        // Ignorar reservas canceladas
        reserva.estado !== "Cancelada" &&

        // Comparar mesa, fecha y hora
        Number(reserva.mesa) === Number(mesa) &&
        reserva.fecha === fecha &&
        reserva.hora === hora
    );
}

/* ==========================================
   GUARDAR MODIFICACIONES
   ========================================== */

function guardarModificacion(event) {

    event.preventDefault();

    const mesa = Number(editarMesa.value);
    const fecha = editarFecha.value;
    const hora = editarHora.value;
    const personas = Number(editarPersonas.value);

    const capacidad = capacidadesMesas[mesa];

    mensajeEditar.style.color = "red";

    // Validar mesa
    if (!capacidad) {

        mensajeEditar.textContent =
            "Selecciona una mesa válida.";

        return;
    }

    // Validar número de personas
    if (
        !Number.isInteger(personas) ||
        personas < 1 ||
        personas > capacidad
    ) {

        mensajeEditar.textContent =
            `La Mesa ${mesa} admite entre 1 y ${capacidad} personas.`;

        return;
    }

    // Validar fecha y hora
    const fechaHora = new Date(
        `${fecha}T${hora}:00`
    );

    if (
        !fecha ||
        !hora ||
        Number.isNaN(fechaHora.getTime()) ||
        fechaHora <= new Date()
    ) {

        mensajeEditar.textContent =
            "Selecciona una fecha y hora futuras.";

        return;
    }

    // Validar conflictos
    if (
        existeConflicto(
            mesa,
            fecha,
            hora,
            codigoEnEdicion
        )
    ) {

        mensajeEditar.textContent =
            "Esta mesa ya tiene una reserva activa " +
            "en la fecha y hora seleccionadas.";

        return;
    }

    // Buscar reserva original
    const reserva = reservas.find(
        reserva => reserva.codigo === codigoEnEdicion
    );

    if (!reserva || reserva.estado === "Cancelada") {

        mensajeEditar.textContent =
            "No se puede modificar esta reserva.";

        return;
    }

    // Actualizar reserva
    reserva.mesa = mesa;
    reserva.fecha = fecha;
    reserva.hora = hora;
    reserva.personas = personas;

    // Actualizar tabla y estadísticas
    mostrarReservas();

    mensajeEditar.style.color = "green";
    mensajeEditar.textContent =
        "Reserva modificada correctamente (demostración).";
}

/* ==========================================
   CERRAR FORMULARIO
   ========================================== */

function cerrarEdicion() {

    seccionEditar.hidden = true;
    codigoEnEdicion = null;

    formEditar.reset();
    mensajeEditar.textContent = "";
}

/* ==========================================
   EVENTOS
   ========================================== */

// Filtrar por fecha
filtro.addEventListener(
    "change",
    mostrarReservas
);

// Actualizar capacidad al cambiar de mesa
editarMesa.addEventListener(
    "change",
    actualizarCapacidad
);

// Guardar modificación
formEditar.addEventListener(
    "submit",
    guardarModificacion
);

// Cerrar formulario
document.getElementById("btn-cerrar-editar")
    .addEventListener("click", cerrarEdicion);

// Mostrar reservas al cargar
mostrarReservas();
