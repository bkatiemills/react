import helpers from './helpers'

describe("your test suite", () => {

    let mockstate = {
        'depthRequired': '100',
        'startDate': '2023-01-01T00:00:00Z',
        'endDate': '2023-01-02T00:00:00Z',
        'polygon': [[0,0],[0,1],[1,1],[1,0],[0,0]]
    }

    let mockObject = {
        'apiPrefix': 'https://example.com/'
    }

    test("Check temporospatial URL", () => {
        expect(helpers.generateTemporoSpatialURL.bind(mockObject)('argo',mockstate)).toBe("https://example.com/argo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00ZT00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]");
    });
});
