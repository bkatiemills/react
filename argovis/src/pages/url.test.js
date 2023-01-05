// tests to check that sensible API calls are constructed based on component state

import helpers from './helpers'
import ArgoExplore from "./argo"
import DriftersExplore from "./drifters"
import ShipsExplore from "./ships"
import TCExplore from "./tc"

describe("your test suite", () => {

    let mockstate = {
        'depthRequired': '100',
        'startDate': '2023-01-01',
        'endDate': '2023-01-02',
        'polygon': [[0,0],[0,1],[1,1],[1,0],[0,0]]
    }

    let mockObject = {
        'apiPrefix': 'https://example.com/'
    }

    test("Check temporospatial URL", () => {
        expect(helpers.generateTemporoSpatialURL.bind(mockObject)('argo',mockstate)).toBe("https://example.com/argo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]");
    });

    // argo

    let argo_mockstate = {
        ...mockstate,
        'argoPlatform': '',
        'argocore': true,
        'argobgc': true,
        'argodeep': true,
    }

    test("Check Argo map URL for all sources", () => {
        const argo = new ArgoExplore()
        argo.apiPrefix = 'https://example.com/'
        expect(argo.generateURLs(argo_mockstate)).toStrictEqual(["https://example.com/argo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]&source=argo_core"])
    });

    test("Check Argo map URL for BGC only", () => {
        const argo = new ArgoExplore()
        argo.apiPrefix = 'https://example.com/'
        expect(argo.generateURLs({...argo_mockstate, 'argocore': false, 'argodeep': false})).toStrictEqual(["https://example.com/argo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]&source=argo_bgc"])
    });

    test("Check Argo map URL for deep only", () => {
        const argo = new ArgoExplore()
        argo.apiPrefix = 'https://example.com/'
        expect(argo.generateURLs({...argo_mockstate, 'argocore': false, 'argobgc': false})).toStrictEqual(["https://example.com/argo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]&source=argo_deep"])
    });

    test("Check Argo map URL for platform request", () => {
        const argo = new ArgoExplore()
        argo.apiPrefix = 'https://example.com/'
        expect(argo.generateURLs({...argo_mockstate, 'argoPlatform': 1234})).toStrictEqual(["https://example.com/argo?compression=minimal&platform=1234"])
    });

    // drifters

    let drifter_mockstate = {
        ...mockstate,
        'wmo': '',
        'platform': '',
    }

    test("Check drifter URL for wmo request", () => {
        const drifter = new DriftersExplore()
        drifter.apiPrefix = 'https://example.com/'
        expect(drifter.generateURLs({...drifter_mockstate, 'wmo': 1234})).toStrictEqual(["https://example.com/drifters?compression=minimal&wmo=1234"])
    });

    test("Check drifter URL for platform request", () => {
        const drifter = new DriftersExplore()
        drifter.apiPrefix = 'https://example.com/'
        expect(drifter.generateURLs({...drifter_mockstate, 'platform': 1234})).toStrictEqual(["https://example.com/drifters?compression=minimal&platform=1234"])
    });

    test("Check drifter URL for generic request", () => {
        const drifter = new DriftersExplore()
        drifter.apiPrefix = 'https://example.com/'
        expect(drifter.generateURLs(drifter_mockstate)).toStrictEqual(["https://example.com/drifters?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]"])
    });

    // ships

    let ship_mockstate = {
        ...mockstate,
        'cruise': '',
        'woceline': '',
        'woce': true,
        'goship': true,
        'other': true
    }

    test("Check ship URL for woceline request", () => {
        const ship = new ShipsExplore()
        ship.apiPrefix = 'https://example.com/'
        ship.wocelineLookup = {"A11 - 1992-12": { "startDate" : "1992-12-27T23:12:00Z", "endDate" : "1993-01-30T05:21:00Z" } }
        expect(ship.generateURLs({...ship_mockstate, 'woceline': 'A11 - 1992-12'})).toStrictEqual(["https://example.com/cchdo?compression=minimal&woceline=A11&startDate=1992-12-27T22:12:00Z&endDate=1993-01-30T06:21:00Z"])
    });

    test("Check ship URL for cruise request", () => {
        const ship = new ShipsExplore()
        ship.apiPrefix = 'https://example.com/'
        ship.wocelineLookup = {"A11 - 1992-12": { "startDate" : "1992-12-27T23:12:00Z", "endDate" : "1993-01-30T05:21:00Z" } }
        expect(ship.generateURLs({...ship_mockstate, 'cruise': 1234})).toStrictEqual(["https://example.com/cchdo?compression=minimal&cchdo_cruise=1234"])
    });

    test("Check ships map URL for all sources", () => {
        const ship = new ShipsExplore()
        ship.apiPrefix = 'https://example.com/'
        expect(ship.generateURLs(ship_mockstate)).toStrictEqual(["https://example.com/cchdo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]"])
    });

    test("Check ships map URL for woce only", () => {
        const ship = new ShipsExplore()
        ship.apiPrefix = 'https://example.com/'
        expect(ship.generateURLs({...ship_mockstate, 'goship': false, 'other': false})).toStrictEqual(["https://example.com/cchdo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]&source=cchdo_woce"])
    });

    test("Check ships map URL for goship only", () => {
        const ship = new ShipsExplore()
        ship.apiPrefix = 'https://example.com/'
        expect(ship.generateURLs({...ship_mockstate, 'woce': false, 'other': false})).toStrictEqual(["https://example.com/cchdo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]&source=cchdo_go-ship"])
    });

    test("Check ships map URL for others only", () => {
        const ship = new ShipsExplore()
        ship.apiPrefix = 'https://example.com/'
        expect(ship.generateURLs({...ship_mockstate, 'goship': false, 'woce': false})).toStrictEqual(["https://example.com/cchdo?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]&source=~cchdo_go-ship,~cchdo_woce"])
    });

    // tropical cyclones

    let tc_mockstate = {
        ...mockstate,
        'tcName': ''
    }

    test("Check tc URL for name request", () => {
        const tc = new TCExplore()
        tc.apiPrefix = 'https://example.com/'
        tc.lookupLabel = {'PIXEL': 'pix2002'}
        expect(tc.generateURLs({...mockstate, 'tcName': 'PIXEL'})).toStrictEqual(["https://example.com/tc?compression=minimal&metadata=pix2002"])
    });

    test("Check tc URL for generic request", () => {
        const tc = new TCExplore()
        tc.apiPrefix = 'https://example.com/'
        expect(tc.generateURLs(tc_mockstate)).toStrictEqual(["https://example.com/tc?compression=minimal&presRange=100,20000&startDate=2023-01-01T00:00:00Z&endDate=2023-01-03T00:00:00Z&polygon=[[0,0],[0,1],[1,1],[1,0],[0,0]]"])
    });


});
