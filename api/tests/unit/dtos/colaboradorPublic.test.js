const { ColaboradorPublic } = require('../../../src/dtos/colaboradorPublic.js');

describe('ColaboradorPublic', () => {
    test('anonimiza los datos públicos de una persona con cuenta inactiva y conserva sus habilidades', () => {
        const habilidades = [{ id: 'habilidad-1', titulo: 'JavaScript' }];

        const resultado = ColaboradorPublic.desde({
            id: 'colaborador-1',
            nombre: 'Ana',
            apellido: 'Pérez',
            nombreFantasia: 'Anita',
            cuentaGit: 'anaperez',
            habilidades,
            pronombres: 'ella',
            presentacion: 'Presentación personal',
            deseaSerContactado: true,
            usuario: { activo: false },
        });

        expect(resultado).toMatchObject({
            id: 'colaborador-1',
            nombre: null,
            apellido: null,
            nombreFantasia: 'UsuarioEliminado',
            cuentaGit: 'UsuarioEliminado',
            habilidades,
            pronombres: null,
            presentacion: null,
            deseaSerContactado: false,
        });
    });
});