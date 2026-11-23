jest.mock('../../../src/database/schemas/colaboracionSchema.js', () => ({
    updateMany: jest.fn(),
}));

const ColaboracionModel = require('../../../src/database/schemas/colaboracionSchema.js');
const colaboracionRepository = require('../../../src/repositories/colaboracionRepository.js');

describe('ColaboracionRepository.cerrarYAnonimizarPorColaborador', () => {
    beforeEach(() => jest.clearAllMocks());

    test('cierra las activas y anonimiza el nombre en el historial', async () => {
        const fecha = new Date();
        ColaboracionModel.updateMany.mockResolvedValue({ modifiedCount: 1 });

        await colaboracionRepository.cerrarYAnonimizarPorColaborador('colaborador-1', fecha);

        expect(ColaboracionModel.updateMany).toHaveBeenNthCalledWith(
            1,
            { 'colaborador.id': 'colaborador-1', fin: null },
            { $set: { fin: fecha } }
        );
        expect(ColaboracionModel.updateMany).toHaveBeenNthCalledWith(
            2,
            { 'colaborador.id': 'colaborador-1' },
            {
                $set: {
                    'colaborador.nombre': 'UsuarioEliminado',
                    'colaborador.apellido': null,
                },
                $unset: { 'colaborador.usuario': 1 },
            }
        );
    });
});