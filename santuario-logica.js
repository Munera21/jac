(function (global) {
    'use strict';

    var WHATSAPP_NUMBER = '573163174296';

    var TOPICOS = ['Amor', 'Dinero', 'Protección', 'Limpieza', 'Otro'];

    var QUIZ = [
        {
            pregunta: '¿Qué área de tu vida deseas transformar hoy?',
            opciones: ['El amor', 'La abundancia y el dinero', 'Protección y limpieza energética', 'Mi camino espiritual']
        },
        {
            pregunta: '¿Cómo ha estado tu energía últimamente?',
            opciones: ['Agotada y desbalanceada', 'Inquieta o confundida', 'Estable pero sin dirección', 'En alta y con claridad']
        },
        {
            pregunta: '¿Qué tipo de guía buscas en este momento?',
            opciones: ['Lectura de tarot', 'Limpieza energética', 'Alineación de chakras', 'Acompañamiento personalizado']
        }
    ];

    var SIGNOS = [
        { nombre: 'Capricornio', finMes: 1, finDia: 19 },
        { nombre: 'Acuario', finMes: 2, finDia: 18 },
        { nombre: 'Piscis', finMes: 3, finDia: 20 },
        { nombre: 'Aries', finMes: 4, finDia: 19 },
        { nombre: 'Tauro', finMes: 5, finDia: 20 },
        { nombre: 'Géminis', finMes: 6, finDia: 20 },
        { nombre: 'Cáncer', finMes: 7, finDia: 22 },
        { nombre: 'Leo', finMes: 8, finDia: 22 },
        { nombre: 'Virgo', finMes: 9, finDia: 22 },
        { nombre: 'Libra', finMes: 10, finDia: 22 },
        { nombre: 'Escorpio', finMes: 11, finDia: 21 },
        { nombre: 'Sagitario', finMes: 12, finDia: 21 }
    ];

    function getZodiacSign(day, month) {
        day = Number(day);
        month = Number(month);
        if (!Number.isInteger(day) || !Number.isInteger(month) || month < 1 || month > 12 || day < 1 || day > 31) {
            return '';
        }
        for (var i = 0; i < SIGNOS.length; i++) {
            var signo = SIGNOS[i];
            if (month < signo.finMes || (month === signo.finMes && day <= signo.finDia)) {
                return signo.nombre;
            }
        }
        return SIGNOS[0].nombre;
    }

    function getZodiacFromDate(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return '';
        }
        var partes = value.split('-');
        return getZodiacSign(Number(partes[2]), Number(partes[1]));
    }

    function formatDateDOB(value) {
        if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
            return '';
        }
        var partes = value.split('-');
        return partes[2] + '/' + partes[1] + '/' + partes[0];
    }

    function buildUbicacion(geo) {
        if (geo && geo.city && geo.country) {
            return geo.city + ', ' + geo.country;
        }
        return 'tu ubicación';
    }

    function buildWhatsAppMessage(data, geo) {
        var nombre = (data && data.nombre ? String(data.nombre) : '').trim();
        var fecha = formatDateDOB(data && data.fechaNacimiento);
        var topico = (data && data.topico ? String(data.topico) : '').trim();
        return 'Hola, mi nombre es ' + nombre + ', nací el ' + fecha + ', me conecto desde ' + buildUbicacion(geo) + '. Quisiera una consulta sobre: ' + topico;
    }

    function buildWhatsAppUrl(message) {
        return 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(message);
    }

    function validateLeadForm(data) {
        var errores = [];
        var nombre = (data && data.nombre ? String(data.nombre) : '').trim();
        var fecha = data && data.fechaNacimiento;
        var topico = (data && data.topico ? String(data.topico) : '').trim();

        if (!nombre) {
            errores.push('Ingresa tu nombre completo.');
        }
        if (!formatDateDOB(fecha)) {
            errores.push('Ingresa tu fecha de nacimiento.');
        }
        if (!topico) {
            errores.push('Selecciona un tema de consulta.');
        } else if (TOPICOS.indexOf(topico) === -1) {
            errores.push('El tema de consulta no es válido.');
        }
        return errores;
    }

    function handleLeadSubmit(data, geo) {
        var errores = validateLeadForm(data);
        if (errores.length > 0) {
            return { ok: false, errores: errores };
        }
        var message = buildWhatsAppMessage(data, geo);
        return { ok: true, message: message, url: buildWhatsAppUrl(message) };
    }

    function buildQuizMessage(answers, geo) {
        var limpias = (answers || []).map(function (a) { return (a ? String(a) : '').trim(); });
        var lineas = limpias
            .map(function (a, i) { return (i + 1) + ') ' + a; })
            .join('  ');
        return 'Hola, completé el test del Santuario Místico. Mis respuestas: ' + lineas + '. Me conecto desde ' + buildUbicacion(geo) + '. Quisiera recibir mi lectura completa por WhatsApp.';
    }

    function createReview(data) {
        var nombre = (data && data.nombre ? String(data.nombre) : '').trim();
        var ciudad = (data && data.ciudad ? String(data.ciudad) : '').trim();
        var comentario = (data && data.comentario ? String(data.comentario) : '').trim();

        if (!nombre || !ciudad || !comentario) {
            return { ok: false, errores: ['Completa tu nombre, ciudad y comentario.'] };
        }

        var calificacion = Number(data && data.calificacion);
        if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
            calificacion = 5;
        }

        var iniciales = nombre.split(/\s+/).map(function (p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
        var hoy = new Date();
        var fecha = ('0' + hoy.getDate()).slice(-2) + '/' + ('0' + (hoy.getMonth() + 1)).slice(-2) + '/' + hoy.getFullYear();

        return {
            ok: true,
            review: {
                nombre: nombre,
                ciudad: ciudad,
                comentario: comentario,
                calificacion: calificacion,
                iniciales: iniciales,
                fecha: fecha
            }
        };
    }

    var REVIEWS_INICIALES = [
        {
            nombre: 'Mariana Gómez',
            ciudad: 'Medellín',
            comentario: 'La lectura de tarot que recibí fue increíblemente precisa. Me ayudó a tomar una decisión importante sobre mi relación y me sentí escuchada en todo momento.',
            calificacion: 5,
            iniciales: 'MG',
            fecha: '02/09/2026'
        },
        {
            nombre: 'Carlos Andrés Rojas',
            ciudad: 'Bogotá',
            comentario: 'La limpieza energética cambió por completo mi semana. Salí de la consulta con una paz que no sentía hace meses. Recomendadísimo para quienes cargan muchas energías negativas.',
            calificacion: 5,
            iniciales: 'CR',
            fecha: '10/09/2026'
        },
        {
            nombre: 'Laura Restrepo',
            ciudad: 'Cali',
            comentario: 'Me encantó la alineación de chakras. La guía fue clara, amorosa y muy respetuosa. Volví por una segunda consulta para trabajar mi prosperidad y los resultados se sienten.',
            calificacion: 5,
            iniciales: 'LR',
            fecha: '18/09/2026'
        },
        {
            nombre: 'Julián Martínez',
            ciudad: 'Barranquilla',
            comentario: 'Buscaba orientación sobre un proyecto de negocio y la consulta me dio la claridad que necesitaba. Un trato humano, cálido y muy profesional de principio a fin.',
            calificacion: 5,
            iniciales: 'JM',
            fecha: '25/09/2026'
        }
    ];

    var api = {
        WHATSAPP_NUMBER: WHATSAPP_NUMBER,
        TOPICOS: TOPICOS,
        QUIZ: QUIZ,
        REVIEWS_INICIALES: REVIEWS_INICIALES,
        getZodiacSign: getZodiacSign,
        getZodiacFromDate: getZodiacFromDate,
        formatDateDOB: formatDateDOB,
        buildUbicacion: buildUbicacion,
        buildWhatsAppMessage: buildWhatsAppMessage,
        buildWhatsAppUrl: buildWhatsAppUrl,
        validateLeadForm: validateLeadForm,
        handleLeadSubmit: handleLeadSubmit,
        buildQuizMessage: buildQuizMessage,
        createReview: createReview
    };

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        global.SantuarioLogica = api;
    }
})(typeof window !== 'undefined' ? window : globalThis);
