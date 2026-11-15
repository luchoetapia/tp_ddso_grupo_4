jest.mock('../../../src/auth/authRepository.js');

const AuthRepository = require('../../../src/auth/authRepository.js');
const bcrypt = require('bcrypt');
const { crearUsuarioDeSemilla, aUsername } = require('../../../src/auth/usuarioSemilla.js');

describe('usuarioSemilla', () => {
    describe('aUsername', () => {
        test.each([
            ['Colectivo Software Libre', 'colectivo-software-libre'],
            ['Tech For Good', 'tech-for-good'],
            ['Asamblea Ñandú & Co.', 'asamblea-nandu-co.'],
            ['juanperez', 'juanperez'],
            ['juan.p_erez-1', 'juan.p_erez-1'],
            ['  Fundación Árbol  ', 'fundacion-arbol'],
        ])('"%s" -> "%s"', (entrada, esperado) => {
            expect(aUsername(entrada)).toBe(esperado);
        });
    });

    describe('crearUsuarioDeSemilla', () => {
        const original = process.env.SEED_PASSWORD;
        afterEach(() => { original === undefined ? delete process.env.SEED_PASSWORD : (process.env.SEED_PASSWORD = original); });

        const repositorioCreado = () => AuthRepository.mock.instances[0].crearUsuario;

        test('crea el usuario con username, email derivado y el rol indicado', async () => {
            process.env.SEED_PASSWORD = 'clave-semilla';
            await crearUsuarioDeSemilla('Tech For Good', 'colectivo');
            const body = repositorioCreado().mock.calls.at(-1)[0];

            expect(body).toMatchObject({ username: 'tech-for-good', email: 'tech-for-good@semilla.local', rol: 'colectivo', activo: true });
            expect(bcrypt.compareSync('clave-semilla', body.password)).toBe(true);
        });

        test('sin SEED_PASSWORD usa una password aleatoria distinta en cada usuario', async () => {
            delete process.env.SEED_PASSWORD;

            await crearUsuarioDeSemilla('uno', 'colaborador');
            await crearUsuarioDeSemilla('dos', 'colaborador');
            const [a, b] = repositorioCreado().mock.calls.slice(-2).map(([body]) => body.password);

            expect(a).not.toBe(b);
            expect(a).toMatch(/^\$2[aby]\$/); // siempre se guarda hasheada
        });
    });
});
