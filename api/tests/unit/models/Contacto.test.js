const Contacto = require('../../../src/models/Contacto/Contacto.js');
const MedioDeContacto = require('../../../src/models/Contacto/MedioDeContacto.js');
const {
    NotificadorEmail, NotificadorWhatsapp, NotificadorSms, obtenerNotificador
} = require('../../../src/models/Contacto/Notificadores.js');

describe('Contacto', () => {
    test('asigna todos los atributos del constructor', () => {
        const contacto = new Contacto(1, MedioDeContacto.EMAIL, 'a@b.com');

        expect(contacto).toEqual({ id: 1, medio: 'Email', valor: 'a@b.com' });
    });

    test('MedioDeContacto tiene los medios soportados', () => {
        expect(Object.values(MedioDeContacto)).toEqual(['Email', 'WhatsApp', 'SMS']);
    });
});

describe('Notificadores', () => {
    const notificacion = { generarTexto: () => 'texto de prueba' };
    let consoleLog;

    beforeEach(() => {
        consoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleLog.mockRestore();
    });

    test.each([
        [MedioDeContacto.EMAIL, NotificadorEmail],
        [MedioDeContacto.WHATSAPP, NotificadorWhatsapp],
        [MedioDeContacto.SMS, NotificadorSms],
    ])('obtenerNotificador(%s) devuelve el notificador correcto', (medio, Clase) => {
        expect(obtenerNotificador(medio)).toBeInstanceOf(Clase);
    });

    test('obtenerNotificador devuelve undefined para un medio desconocido', () => {
        expect(obtenerNotificador('Paloma mensajera')).toBeUndefined();
    });

    test.each([
        [new NotificadorEmail(), '[Email a a@b.com] texto de prueba'],
        [new NotificadorWhatsapp(), '[WhatsApp a a@b.com] texto de prueba'],
        [new NotificadorSms(), '[SMS a a@b.com] texto de prueba'],
    ])('enviar escribe el texto de la notificación', (notificador, esperado) => {
        notificador.enviar({ valor: 'a@b.com' }, notificacion);

        expect(consoleLog).toHaveBeenCalledWith(esperado);
    });
});
