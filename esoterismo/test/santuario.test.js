'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const L = require('../santuario-logica.js');

test('getZodiacSign devuelve el signo correcto en cada rango', () => {
    const casos = [
        [10, 1, 'Capricornio'],
        [19, 1, 'Capricornio'],
        [20, 1, 'Acuario'],
        [18, 2, 'Acuario'],
        [19, 2, 'Piscis'],
        [20, 3, 'Piscis'],
        [21, 3, 'Aries'],
        [19, 4, 'Aries'],
        [20, 4, 'Tauro'],
        [20, 5, 'Tauro'],
        [21, 5, 'Géminis'],
        [20, 6, 'Géminis'],
        [21, 6, 'Cáncer'],
        [22, 7, 'Cáncer'],
        [23, 7, 'Leo'],
        [22, 8, 'Leo'],
        [23, 8, 'Virgo'],
        [22, 9, 'Virgo'],
        [23, 9, 'Libra'],
        [22, 10, 'Libra'],
        [23, 10, 'Escorpio'],
        [21, 11, 'Escorpio'],
        [22, 11, 'Sagitario'],
        [21, 12, 'Sagitario'],
        [22, 12, 'Capricornio'],
        [31, 12, 'Capricornio']
    ];
    for (const [dia, mes, esperado] of casos) {
        assert.equal(L.getZodiacSign(dia, mes), esperado, `Día ${dia}/${mes} debería ser ${esperado}`);
    }
});

test('getZodiacSign devuelve cadena vacía con datos inválidos', () => {
    assert.equal(L.getZodiacSign(0, 1), '');
    assert.equal(L.getZodiacSign(15, 13), '');
    assert.equal(L.getZodiacSign('a', 5), '');
    assert.equal(L.getZodiacSign(15), '');
});

test('getZodiacFromDate interpreta fechas ISO', () => {
    assert.equal(L.getZodiacFromDate('1990-07-24'), 'Leo');
    assert.equal(L.getZodiacFromDate('2026-01-01'), 'Capricornio');
    assert.equal(L.getZodiacFromDate('24/07/1990'), '');
    assert.equal(L.getZodiacFromDate(''), '');
});

test('formatDateDOB convierte ISO a DD/MM/YYYY', () => {
    assert.equal(L.formatDateDOB('1990-07-24'), '24/07/1990');
    assert.equal(L.formatDateDOB('2000-01-05'), '05/01/2000');
    assert.equal(L.formatDateDOB('no-fecha'), '');
    assert.equal(L.formatDateDOB(''), '');
    assert.equal(L.formatDateDOB(undefined), '');
});

test('buildUbicacion arma ciudad y país, con alternativa por defecto', () => {
    assert.equal(L.buildUbicacion({ city: 'Bogotá', country: 'Colombia' }), 'Bogotá, Colombia');
    assert.equal(L.buildUbicacion({ city: 'Bogotá' }), 'tu ubicación');
    assert.equal(L.buildUbicacion(null), 'tu ubicación');
    assert.equal(L.buildUbicacion(undefined), 'tu ubicación');
});

test('buildWhatsAppMessage genera el mensaje exacto con geolocalización', () => {
    const mensaje = L.buildWhatsAppMessage(
        { nombre: 'Ana María', fechaNacimiento: '1990-07-24', topico: 'Amor' },
        { city: 'Bogotá', country: 'Colombia' }
    );
    assert.equal(
        mensaje,
        'Hola, mi nombre es Ana María, nací el 24/07/1990, me conecto desde Bogotá, Colombia. Quisiera una consulta sobre: Amor'
    );
});

test('buildWhatsAppMessage usa "tu ubicación" cuando falla la geolocalización', () => {
    const mensaje = L.buildWhatsAppMessage(
        { nombre: 'Luis', fechaNacimiento: '1985-03-02', topico: 'Protección' },
        null
    );
    assert.equal(
        mensaje,
        'Hola, mi nombre es Luis, nací el 02/03/1985, me conecto desde tu ubicación. Quisiera una consulta sobre: Protección'
    );
});

test('buildWhatsAppMessage limpia espacios sobrantes del nombre', () => {
    const mensaje = L.buildWhatsAppMessage(
        { nombre: '  Pedro  ', fechaNacimiento: '1999-11-30', topico: 'Limpieza' },
        { city: 'Cali', country: 'Colombia' }
    );
    assert.equal(
        mensaje,
        'Hola, mi nombre es Pedro, nací el 30/11/1999, me conecto desde Cali, Colombia. Quisiera una consulta sobre: Limpieza'
    );
});

test('buildWhatsAppUrl apunta a wa.me con el texto codificado', () => {
    const mensaje = 'Hola, mi nombre es Ana, nací el 24/07/1990, me conecto desde Bogotá, Colombia. Quisiera una consulta sobre: Amor';
    const url = L.buildWhatsAppUrl(mensaje);
    assert.ok(url.startsWith('https://wa.me/' + L.WHATSAPP_NUMBER + '?text='), 'La URL debe apuntar a wa.me con el número configurado');
    const params = new URL(url).searchParams;
    assert.equal(params.get('text'), mensaje, 'El parámetro text debe decodificar al mensaje exacto');
});

test('buildWhatsAppUrl codifica caracteres especiales y acentos', () => {
    const url = L.buildWhatsAppUrl('Quisiera una consulta sobre: Protección');
    const decodificado = decodeURIComponent(url.split('text=')[1]);
    assert.equal(decodificado, 'Quisiera una consulta sobre: Protección');
    assert.ok(!url.includes('ó'), 'Los acentos deben ir codificados en la URL');
});

test('validateLeadForm marca campos faltantes', () => {
    assert.deepEqual(L.validateLeadForm({ nombre: '', fechaNacimiento: '', topico: '' }), [
        'Ingresa tu nombre completo.',
        'Ingresa tu fecha de nacimiento.',
        'Selecciona un tema de consulta.'
    ]);
});

test('validateLeadForm rechaza tópicos no permitidos', () => {
    const errores = L.validateLeadForm({ nombre: 'Ana', fechaNacimiento: '1990-07-24', topico: 'Poder' });
    assert.deepEqual(errores, ['El tema de consulta no es válido.']);
});

test('validateLeadForm acepta todos los tópicos publicados', () => {
    for (const topico of L.TOPICOS) {
        assert.deepEqual(
            L.validateLeadForm({ nombre: 'Ana', fechaNacimiento: '1990-07-24', topico }),
            [],
            `El tópico ${topico} debería ser válido`
        );
    }
});

test('handleLeadSubmit devuelve errores cuando faltan datos', () => {
    const resultado = L.handleLeadSubmit({ nombre: '', fechaNacimiento: '', topico: 'Amor' }, { city: 'Bogotá', country: 'Colombia' });
    assert.equal(resultado.ok, false);
    assert.deepEqual(resultado.errores, ['Ingresa tu nombre completo.', 'Ingresa tu fecha de nacimiento.']);
    assert.equal(resultado.url, undefined);
});

test('handleLeadSubmit arma mensaje y enlace de WhatsApp listos para abrir', () => {
    const resultado = L.handleLeadSubmit(
        { nombre: 'Ana María', fechaNacimiento: '1990-07-24', topico: 'Amor' },
        { city: 'Medellín', country: 'Colombia' }
    );
    assert.equal(resultado.ok, true);
    assert.equal(
        resultado.message,
        'Hola, mi nombre es Ana María, nací el 24/07/1990, me conecto desde Medellín, Colombia. Quisiera una consulta sobre: Amor'
    );
    assert.ok(resultado.url.startsWith('https://wa.me/' + L.WHATSAPP_NUMBER + '?text='));
    assert.equal(new URL(resultado.url).searchParams.get('text'), resultado.message);
});

test('handleLeadSubmit funciona sin geolocalización (fallback)', () => {
    const resultado = L.handleLeadSubmit({ nombre: 'Luis', fechaNacimiento: '1985-03-02', topico: 'Otro' }, null);
    assert.equal(resultado.ok, true);
    assert.ok(resultado.message.includes('me conecto desde tu ubicación'));
});

test('buildQuizMessage incluye las 3 respuestas y la ubicación', () => {
    const mensaje = L.buildQuizMessage(
        ['El amor', 'Agotada y desbalanceada', 'Lectura de tarot'],
        { city: 'Barranquilla', country: 'Colombia' }
    );
    assert.ok(mensaje.includes('1) El amor'));
    assert.ok(mensaje.includes('2) Agotada y desbalanceada'));
    assert.ok(mensaje.includes('3) Lectura de tarot'));
    assert.ok(mensaje.includes('Me conecto desde Barranquilla, Colombia'));
    assert.ok(mensaje.endsWith('Quisiera recibir mi lectura completa por WhatsApp.'));
});

test('buildQuizMessage resiste respuestas faltantes', () => {
    const mensaje = L.buildQuizMessage(['El amor'], null);
    assert.ok(mensaje.includes('1) El amor'));
    assert.ok(mensaje.includes('Me conecto desde tu ubicación'));
});

test('createReview normaliza y asigna 5 estrellas por defecto', () => {
    const resultado = L.createReview({ nombre: '  Valentina Ruiz ', ciudad: ' Pereira ', comentario: '  Excelente atención.  ' });
    assert.equal(resultado.ok, true);
    assert.equal(resultado.review.nombre, 'Valentina Ruiz');
    assert.equal(resultado.review.ciudad, 'Pereira');
    assert.equal(resultado.review.comentario, 'Excelente atención.');
    assert.equal(resultado.review.calificacion, 5);
    assert.equal(resultado.review.iniciales, 'VR');
    assert.ok(/^\d{2}\/\d{2}\/\d{4}$/.test(resultado.review.fecha), 'La fecha debe tener formato DD/MM/YYYY');
});

test('createReview respeta la calificación elegida', () => {
    const resultado = L.createReview({ nombre: 'Ana', ciudad: 'Cali', comentario: 'Muy buena.', calificacion: 4 });
    assert.equal(resultado.review.calificacion, 4);
});

test('createReview rechaza campos vacíos', () => {
    const resultado = L.createReview({ nombre: '', ciudad: 'Cali', comentario: '   ' });
    assert.equal(resultado.ok, false);
    assert.ok(resultado.errores.length > 0);
});

test('las reseñas iniciales tienen 5 estrellas, avatar y ciudad', () => {
    assert.equal(L.REVIEWS_INICIALES.length, 4);
    for (const resena of L.REVIEWS_INICIALES) {
        assert.equal(resena.calificacion, 5, `${resena.nombre} debería tener 5 estrellas`);
        assert.ok(resena.nombre.length > 0);
        assert.ok(resena.ciudad.length > 0);
        assert.ok(resena.comentario.length > 0);
        assert.match(resena.iniciales, /^[A-ZÁÉÍÓÚÑ]{2}$/);
    }
});
