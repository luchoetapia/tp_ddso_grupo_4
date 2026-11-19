jest.mock('../../../src/database/schemas/proyectoSchema.js', () => ({
    aggregate: jest.fn()
}));

jest.mock('../../../src/database/schemas/colectivoSchema.js', () => ({
    aggregate: jest.fn()
}));

jest.mock('../../../src/database/schemas/colaboracionSchema.js', () => ({
    aggregate: jest.fn()
}));

const ProyectoModel =
    require('../../../src/database/schemas/proyectoSchema.js');
const ColectivoModel =
    require('../../../src/database/schemas/colectivoSchema.js');
const ColaboracionModel =
    require('../../../src/database/schemas/colaboracionSchema.js');

describe('Aggregation pipelines globales', () => {
    beforeEach(() => jest.clearAllMocks());

    test('los tres repositorios utilizan Mongo aggregate', () => {
        ProyectoModel.aggregate.mockResolvedValue([]);
        ColectivoModel.aggregate.mockResolvedValue([]);
        ColaboracionModel.aggregate.mockResolvedValue([]);

        require('../../../src/repositories/proyectoRepository.js')
            .estadisticasGlobales();

        require('../../../src/repositories/colectivoRepository.js')
            .estadisticasGlobales();

        require('../../../src/repositories/colaboracionRepository.js')
            .estadisticasGlobales();

        expect(ProyectoModel.aggregate).toHaveBeenCalled();
        expect(ColectivoModel.aggregate).toHaveBeenCalled();
        expect(ColaboracionModel.aggregate).toHaveBeenCalled();
    });
});