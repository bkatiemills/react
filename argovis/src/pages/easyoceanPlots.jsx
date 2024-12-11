import React from 'react';
import '../index.css';
import helpers from'./helpers'
import { MapContainer, TileLayer, CircleMarker} from 'react-leaflet';
import GeometryUtil from "leaflet-geometryutil";
import Autosuggest from 'react-autosuggest';
import Plot from 'react-plotly.js';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

class EasyoceanPlots extends React.Component {

    constructor(props) {
		document.title = 'Argovis - Easy Ocean plots'
		super(props);

        // todo: autodetect this
        this.eo_occupancies = { 
            "75N":[  
                    [new Date("1994-07-28T00:00:00Z"), new Date("1994-08-03T00:00:00Z")],
                    [new Date("1995-10-09T00:00:00Z"), new Date("1995-10-22T00:00:00Z")],
                    [new Date("1997-09-15T00:00:00Z"), new Date("1997-09-22T00:00:00Z")],
                    [new Date("1998-09-20T00:00:00Z"), new Date("1998-09-27T00:00:00Z")],
                    [new Date("1999-07-08T00:00:00Z"), new Date("1999-07-17T00:00:00Z")],
                    [new Date("2000-07-06T00:00:00Z"), new Date("2000-07-13T00:00:00Z")],
                    [new Date("2001-06-24T00:00:00Z"), new Date("2001-07-01T00:00:00Z")],
                    [new Date("2006-07-23T00:00:00Z"), new Date("2006-07-30T00:00:00Z")],
                    [new Date("2016-08-04T00:00:00Z"), new Date("2016-08-09T00:00:00Z")]
                ],
            "A02":[
                    [new Date("1994-10-16T00:00:00Z"), new Date("1994-11-08T00:00:00Z")],
                    [new Date("1997-06-13T00:00:00Z"), new Date("1997-06-30T00:00:00Z")],
                    [new Date("2017-04-29T00:00:00Z"), new Date("2017-05-21T00:00:00Z")]
                  ],
            "A03": 
                  [[ new Date("1993-09-24T00:00:00Z"), new Date("1993-10-25T00:00:00Z") ]],
            "A05":[ 
                    [ new Date("1992-07-20T00:00:00Z"), new Date("1992-08-15T00:00:00Z") ],
                    [ new Date("1998-01-24T00:00:00Z"), new Date("1998-02-23T00:00:00Z") ],
                    [ new Date("2004-04-05T00:00:00Z"), new Date("2004-05-09T00:00:00Z") ],
                    [ new Date("2010-01-06T00:00:00Z"), new Date("2010-02-15T00:00:00Z") ],
                    [ new Date("2011-01-28T00:00:00Z"), new Date("2011-03-14T00:00:00Z") ],
                    [ new Date("2015-12-09T00:00:00Z"), new Date("2016-01-20T00:00:00Z") ],
                    [ new Date("2020-01-20T00:00:00Z"), new Date("2020-02-28T00:00:00Z") ]
                 ],
            "A10":[ 
                    [ new Date("1992-12-30T00:00:00Z"), new Date("1993-01-28T00:00:00Z") ],
                    [ new Date("2003-11-07T00:00:00Z"), new Date("2003-12-02T00:00:00Z") ],
                    [ new Date("2011-09-28T00:00:00Z"), new Date("2011-10-29T00:00:00Z") ]
                  ],
            "A12":[ 
                    [ new Date("1992-05-22T00:00:00Z"), new Date("1992-06-19T00:00:00Z") ],
                    [ new Date("1996-04-04T00:00:00Z"), new Date("1996-04-22T00:00:00Z") ],
                    [ new Date("1999-01-18T00:00:00Z"), new Date("1999-03-11T00:00:00Z") ],
                    [ new Date("2000-12-20T00:00:00Z"), new Date("2001-01-11T00:00:00Z") ],
                    [ new Date("2002-11-26T00:00:00Z"), new Date("2002-12-19T00:00:00Z") ],
                    [ new Date("2005-01-25T00:00:00Z"), new Date("2005-02-18T00:00:00Z") ],
                    [ new Date("2008-02-14T00:00:00Z"), new Date("2008-03-16T00:00:00Z") ],
                    [ new Date("2008-02-11T00:00:00Z"), new Date("2008-03-12T00:00:00Z") ],
                    [ new Date("2010-11-30T00:00:00Z"), new Date("2010-12-19T00:00:00Z") ],
                    [ new Date("2014-12-04T00:00:00Z"), new Date("2015-01-21T00:00:00Z") ]
                  ],
            "A13": [
                    [ new Date("1983-10-07T00:00:00Z"), new Date("1984-01-29T00:00:00Z") ],
                    [ new Date("2010-03-14T00:00:00Z"), new Date("2010-04-17T00:00:00Z") ]
                   ],
            "A16-A23": [
                    [ new Date("1988-07-23T00:00:00Z"), new Date("1989-04-08T00:00:00Z") ],
                    [ new Date("1993-07-07T00:00:00Z"), new Date("1993-08-28T00:00:00Z") ],
                    [ new Date("1995-03-30T00:00:00Z"), new Date("1998-05-23T00:00:00Z") ],
                    [ new Date("2003-06-20T00:00:00Z"), new Date("2005-02-21T00:00:00Z") ],
                    [ new Date("2011-07-20T00:00:00Z"), new Date("2011-07-31T00:00:00Z") ],
                    [ new Date("2013-08-03T00:00:00Z"), new Date("2014-01-29T00:00:00Z") ]
                  ],
            "A20": [
                    [ new Date("1997-07-20T00:00:00Z"), new Date("1997-08-08T00:00:00Z") ],
                    [ new Date("2003-09-26T00:00:00Z"), new Date("2003-10-18T00:00:00Z") ],
                    [ new Date("2012-04-21T00:00:00Z"), new Date("2012-05-11T00:00:00Z") ],
                    [ new Date("2021-03-21T00:00:00Z"), new Date("2021-04-13T00:00:00Z") ]
                   ],
            "A22": [
                    [ new Date("1997-08-16T00:00:00Z"), new Date("1997-08-29T00:00:00Z") ],
                    [ new Date("2003-10-24T00:00:00Z"), new Date("2003-11-12T00:00:00Z") ],
                    [ new Date("2012-03-25T00:00:00Z"), new Date("2012-04-10T00:00:00Z") ],
                    [ new Date("2021-04-26T00:00:00Z"), new Date("2021-05-15T00:00:00Z") ]
                   ],
            "A9.5":[
                    [ new Date("2009-03-16T00:00:00Z"), new Date("2009-04-19T00:00:00Z") ],
                    [ new Date("2018-03-01T00:00:00Z"), new Date("2018-04-06T00:00:00Z") ]
                   ],
            "AR07E": [
                    [ new Date("1990-07-02T00:00:00Z"), new Date("1990-07-09T00:00:00Z") ],
                    [ new Date("1991-04-19T00:00:00Z"), new Date("1991-04-22T00:00:00Z") ],
                    [ new Date("1991-08-14T00:00:00Z"), new Date("1991-08-17T00:00:00Z") ],
                    [ new Date("1991-09-05T00:00:00Z"), new Date("1991-09-21T00:00:00Z") ],
                    [ new Date("1992-09-15T00:00:00Z"), new Date("1992-09-28T00:00:00Z") ],
                    [ new Date("1994-05-27T00:00:00Z"), new Date("1994-12-15T00:00:00Z") ],
                    [ new Date("1995-05-31T00:00:00Z"), new Date("1995-06-12T00:00:00Z") ],
                    [ new Date("1996-08-22T00:00:00Z"), new Date("1996-09-01T00:00:00Z") ],
                    [ new Date("1997-08-25T00:00:00Z"), new Date("1997-08-31T00:00:00Z") ],
                    [ new Date("2000-10-07T00:00:00Z"), new Date("2000-10-12T00:00:00Z") ],
                    [ new Date("2005-09-13T00:00:00Z"), new Date("2005-09-21T00:00:00Z") ],
                    [ new Date("2014-06-06T00:00:00Z"), new Date("2014-06-18T00:00:00Z") ],
                    [ new Date("2014-06-24T00:00:00Z"), new Date("2014-07-03T00:00:00Z") ],
                    [ new Date("2015-04-16T00:00:00Z"), new Date("2015-04-20T00:00:00Z") ]
                   ],
            "AR07W": [
                    [ new Date("1990-07-04T00:00:00Z"), new Date("1990-07-09T00:00:00Z") ],
                    [ new Date("1992-06-07T00:00:00Z"), new Date("1992-06-10T00:00:00Z") ],
                    [ new Date("1993-06-20T00:00:00Z"), new Date("1993-06-23T00:00:00Z") ],
                    [ new Date("1994-05-29T00:00:00Z"), new Date("1994-11-23T00:00:00Z") ],
                    [ new Date("1995-06-12T00:00:00Z"), new Date("1995-06-16T00:00:00Z") ],
                    [ new Date("1996-05-19T00:00:00Z"), new Date("1996-05-25T00:00:00Z") ],
                    [ new Date("1997-05-21T00:00:00Z"), new Date("1997-06-05T00:00:00Z") ],
                    [ new Date("1998-06-28T00:00:00Z"), new Date("1998-07-03T00:00:00Z") ],
                    [ new Date("2011-07-26T00:00:00Z"), new Date("2011-07-30T00:00:00Z") ],
                    [ new Date("2012-06-05T00:00:00Z"), new Date("2012-06-11T00:00:00Z") ],
                    [ new Date("2013-05-11T00:00:00Z"), new Date("2013-05-19T00:00:00Z") ],
                    [ new Date("2013-05-12T00:00:00Z"), new Date("2013-05-15T00:00:00Z") ],
                    [ new Date("2015-05-08T00:00:00Z"), new Date("2015-05-16T00:00:00Z") ]
                   ],
            "I01": [ 
                    [ new Date("1995-06-05T00:00:00Z"), new Date("1995-06-13T00:00:00Z") ],
                    [ new Date("1995-09-12T00:00:00Z"), new Date("1995-10-12T00:00:00Z") ]
                   ],
            "I02": [ 
                    [ new Date("1995-12-05T00:00:00Z"), new Date("1996-01-21T00:00:00Z") ],
                    [ new Date("2000-10-07T00:00:00Z"), new Date("2000-10-12T00:00:00Z") ]
                   ],
            "I03-I04": [ 
                    [ new Date("1995-04-26T00:00:00Z"), new Date("1995-06-19T00:00:00Z") ],
                    [ new Date("2003-12-13T00:00:00Z"), new Date("2004-01-20T00:00:00Z") ]
                   ],
            "I05": [ 
                    [ new Date("1987-11-13T00:00:00Z"), new Date("1987-12-16T00:00:00Z") ],
                    [ new Date("1995-04-04T00:00:00Z"), new Date("1995-07-02T00:00:00Z") ],
                    [ new Date("2002-03-04T00:00:00Z"), new Date("2002-04-14T00:00:00Z") ],
                    [ new Date("2009-03-24T00:00:00Z"), new Date("2009-05-12T00:00:00Z") ]
                   ],
            "I06S":[ 
                    [ new Date("1993-02-05T00:00:00Z"), new Date("1993-03-10T00:00:00Z") ],
                    [ new Date("1996-02-20T00:00:00Z"), new Date("1996-03-21T00:00:00Z") ],
                    [ new Date("2008-02-06T00:00:00Z"), new Date("2008-03-08T00:00:00Z") ],
                    [ new Date("2019-04-16T00:00:00Z"), new Date("2019-05-11T00:00:00Z") ]
                   ],
            "I07": [ 
                    [ new Date("1995-07-04T00:00:00Z"), new Date("1995-08-11T00:00:00Z") ],
                    [ new Date("2018-04-28T00:00:00Z"), new Date("2020-01-22T00:00:00Z") ]
                   ],
            "I08N":[  
                    [ new Date("1995-03-10T00:00:00Z"), new Date("1995-03-26T00:00:00Z") ],
                    [ new Date("2019-12-05T00:00:00Z"), new Date("2019-12-22T00:00:00Z") ]
                   ],
            "I08S-I09N":[ 
                    [ new Date("1994-12-05T00:00:00Z"), new Date("1995-02-24T00:00:00Z") ],
                    [ new Date("2007-02-15T00:00:00Z"), new Date("2007-04-26T00:00:00Z") ],
                    [ new Date("2016-02-21T00:00:00Z"), new Date("2016-04-24T00:00:00Z") ]
                   ],
            "I09S":[ 
                    [ new Date("1995-01-01T00:00:00Z"), new Date("1995-01-18T00:00:00Z") ],
                    [ new Date("2004-12-24T00:00:00Z"), new Date("2005-01-15T00:00:00Z") ],
                    [ new Date("2012-01-20T00:00:00Z"), new Date("2012-02-10T00:00:00Z") ]
                   ],
            "I10":[ 
                    [ new Date("1995-11-14T00:00:00Z"), new Date("1995-11-21T00:00:00Z") ],
                    [ new Date("2015-12-29T00:00:00Z"), new Date("2016-01-08T00:00:00Z") ]
                  ],
            "IR06-I10":[ 
                    [ new Date("1995-04-04T00:00:00Z"), new Date("1995-04-05T00:00:00Z") ],
                    [ new Date("1995-09-16T00:00:00Z"), new Date("1995-09-17T00:00:00Z") ],
                    [ new Date("1995-11-14T00:00:00Z"), new Date("1995-11-14T00:00:00Z") ],
                    [ new Date("2000-09-27T00:00:00Z"), new Date("2000-09-28T00:00:00Z") ],
                    [ new Date("2015-12-28T00:00:00Z"), new Date("2015-12-29T00:00:00Z") ]
                   ],
            "IR06E":[ 
                    [ new Date("1989-08-09T00:00:00Z"), new Date("1989-08-19T00:00:00Z") ],
                    [ new Date("1992-02-19T00:00:00Z"), new Date("1992-03-05T00:00:00Z") ],
                    [ new Date("2000-09-10T00:00:00Z"), new Date("2000-09-21T00:00:00Z") ]
                   ],
            "IR06": [
                    [ new Date("1995-04-04T00:00:00Z"), new Date("1995-04-05T00:00:00Z") ],
                    [ new Date("1995-09-16T00:00:00Z"), new Date("1995-09-17T00:00:00Z") ],
                    [ new Date("1995-11-14T00:00:00Z"), new Date("1995-11-14T00:00:00Z") ],
                    [ new Date("2000-09-27T00:00:00Z"), new Date("2000-09-28T00:00:00Z") ],
                    [ new Date("2015-12-28T00:00:00Z"), new Date("2015-12-29T00:00:00Z") ]
                   ],
            "P01": [
                    [ new Date("1985-08-05T00:00:00Z"), new Date("1985-09-07T00:00:00Z") ],
                    [ new Date("1999-05-23T00:00:00Z"), new Date("1999-10-01T00:00:00Z") ],
                    [ new Date("2007-07-26T00:00:00Z"), new Date("2007-10-20T00:00:00Z") ],
                    [ new Date("2014-07-17T00:00:00Z"), new Date("2014-08-22T00:00:00Z") ],
                    [ new Date("2021-07-15T00:00:00Z"), new Date("2021-08-13T00:00:00Z") ]
                   ],
            "P02": [ 
                    [ new Date("1993-10-17T00:00:00Z"), new Date("1994-11-10T00:00:00Z") ],
                    [ new Date("2004-06-17T00:00:00Z"), new Date("2004-08-27T00:00:00Z") ],
                    [ new Date("2013-03-22T00:00:00Z"), new Date("2013-06-01T00:00:00Z") ],
                    [ new Date("2022-05-04T00:00:00Z"), new Date("2022-07-13T00:00:00Z") ]
                   ],
            "P03": [ 
                    [ new Date("1985-03-30T00:00:00Z"), new Date("1985-06-01T00:00:00Z") ],
                    [ new Date("2005-10-31T00:00:00Z"), new Date("2006-01-22T00:00:00Z") ],
                    [ new Date("2013-06-25T00:00:00Z"), new Date("2013-09-03T00:00:00Z") ],
                    [ new Date("2021-07-30T00:00:00Z"), new Date("2021-10-04T00:00:00Z") ]
                   ],
            "P04":[[ new Date("1989-02-09T00:00:00Z"), new Date("1989-05-10T00:00:00Z") ]],
            "P06":[ 
                    [ new Date("1992-05-04T00:00:00Z"), new Date("1992-07-27T00:00:00Z") ],
                    [ new Date("2003-08-03T00:00:00Z"), new Date("2003-10-12T00:00:00Z") ],
                    [ new Date("2009-11-22T00:00:00Z"), new Date("2010-02-09T00:00:00Z") ],
                    [ new Date("2017-07-04T00:00:00Z"), new Date("2017-09-29T00:00:00Z") ]
                   ],
            "P09":[ 
                    [ new Date("1994-07-08T00:00:00Z"), new Date("1994-08-17T00:00:00Z") ],
                    [ new Date("2010-07-07T00:00:00Z"), new Date("2010-08-10T00:00:00Z") ],
                    [ new Date("2016-07-04T00:00:00Z"), new Date("2016-08-10T00:00:00Z") ],
                    [ new Date("2022-08-05T00:00:00Z"), new Date("2022-10-16T00:00:00Z") ]
                  ],
            "P10":[ 
                    [ new Date("1993-10-12T00:00:00Z"), new Date("1993-11-03T00:00:00Z") ],
                    [ new Date("2005-05-27T00:00:00Z"), new Date("2005-06-27T00:00:00Z") ],
                    [ new Date("2012-01-14T00:00:00Z"), new Date("2012-02-05T00:00:00Z") ],
                    [ new Date("2014-06-12T00:00:00Z"), new Date("2014-09-01T00:00:00Z") ]
                  ],
            "P11":[[ new Date("1993-04-09T00:00:00Z"), new Date("1993-07-14T00:00:00Z") ]],
            "P13": [ 
                    [ new Date("1991-08-17T00:00:00Z"), new Date("1993-05-26T00:00:00Z") ],
                    [ new Date("1992-08-24T00:00:00Z"), new Date("1992-10-17T00:00:00Z") ],
                    [ new Date("2011-06-15T00:00:00Z"), new Date("2011-08-15T00:00:00Z") ]
                   ],
            "P14":[ 
                    [ new Date("1992-09-01T00:00:00Z"), new Date("1996-01-17T00:00:00Z") ],
                    [ new Date("2007-10-21T00:00:00Z"), new Date("2012-12-10T00:00:00Z") ]
                  ],
            "P15":[ 
                    [ new Date("1994-09-18T00:00:00Z"), new Date("1996-03-09T00:00:00Z") ],
                    [ new Date("2001-05-27T00:00:00Z"), new Date("2001-07-04T00:00:00Z") ],
                    [ new Date("2009-02-06T00:00:00Z"), new Date("2011-03-27T00:00:00Z") ],
                    [ new Date("2016-05-04T00:00:00Z"), new Date("2016-06-24T00:00:00Z") ]
                  ],
            "P16":[ 
                    [ new Date("1991-03-10T00:00:00Z"), new Date("1992-10-28T00:00:00Z") ],
                    [ new Date("2005-01-10T00:00:00Z"), new Date("2006-03-30T00:00:00Z") ],
                    [ new Date("2014-03-31T00:00:00Z"), new Date("2015-06-18T00:00:00Z") ]
                  ],
            "P17E":[ 
                    [ new Date("1992-12-17T00:00:00Z"), new Date("1992-12-26T00:00:00Z") ],
                    [ new Date("2017-02-16T00:00:00Z"), new Date("2017-02-22T00:00:00Z") ]
                   ],
            "P17":[ 
                    [ new Date("1991-06-08T00:00:00Z"), new Date("1993-06-14T00:00:00Z") ],
                    [ new Date("2001-08-06T00:00:00Z"), new Date("2001-08-25T00:00:00Z") ]
                  ],
            "P18":[ 
                    [ new Date("1994-02-27T00:00:00Z"), new Date("1994-04-25T00:00:00Z") ],
                    [ new Date("2007-12-17T00:00:00Z"), new Date("2008-02-14T00:00:00Z") ],
                    [ new Date("2016-11-24T00:00:00Z"), new Date("2017-01-27T00:00:00Z") ]
                  ],
            "P21":[ 
                    [ new Date("1994-04-01T00:00:00Z"), new Date("1994-06-21T00:00:00Z") ],
                    [ new Date("2009-04-14T00:00:00Z"), new Date("2009-06-17T00:00:00Z") ]
                  ],
            "S04I":[ 
                    [ new Date("1994-12-21T00:00:00Z"), new Date("1996-06-27T00:00:00Z") ],
                    [ new Date("2012-12-11T00:00:00Z"), new Date("2013-01-31T00:00:00Z") ]
                   ],
            "S04P":[ 
                    [ new Date("1992-02-25T00:00:00Z"), new Date("1992-03-25T00:00:00Z") ],
                    [ new Date("2011-02-22T00:00:00Z"), new Date("2011-04-19T00:00:00Z") ],
                    [ new Date("2018-03-17T00:00:00Z"), new Date("2018-05-09T00:00:00Z") ]
                   ],
            "SR01":[ 
                    [ new Date("1993-11-21T00:00:00Z"), new Date("1993-11-26T00:00:00Z") ],
                    [ new Date("1994-11-16T00:00:00Z"), new Date("1994-11-21T00:00:00Z") ],
                    [ new Date("1996-11-15T00:00:00Z"), new Date("1996-11-20T00:00:00Z") ],
                    [ new Date("1997-12-30T00:00:00Z"), new Date("1998-01-07T00:00:00Z") ],
                    [ new Date("2000-11-23T00:00:00Z"), new Date("2000-11-28T00:00:00Z") ],
                    [ new Date("2001-11-20T00:00:00Z"), new Date("2001-11-25T00:00:00Z") ],
                    [ new Date("2002-12-27T00:00:00Z"), new Date("2003-01-01T00:00:00Z") ],
                    [ new Date("2003-12-11T00:00:00Z"), new Date("2003-12-15T00:00:00Z") ],
                    [ new Date("2009-02-20T00:00:00Z"), new Date("2009-02-24T00:00:00Z") ],
                    [ new Date("2009-11-19T00:00:00Z"), new Date("2009-11-25T00:00:00Z") ],
                    [ new Date("2011-11-29T00:00:00Z"), new Date("2011-12-05T00:00:00Z") ],
                    [ new Date("2015-01-13T00:00:00Z"), new Date("2015-01-17T00:00:00Z") ],
                    [ new Date("2016-01-06T00:00:00Z"), new Date("2016-01-10T00:00:00Z") ],
                    [ new Date("2016-11-19T00:00:00Z"), new Date("2016-11-24T00:00:00Z") ],
                    [ new Date("2018-11-05T00:00:00Z"), new Date("2018-11-16T00:00:00Z") ],
                    [ new Date("2021-02-27T00:00:00Z"), new Date("2021-03-05T00:00:00Z") ]
                   ],
            "SR03":[ 
                    [ new Date("1991-10-08T00:00:00Z"), new Date("1991-10-26T00:00:00Z") ],
                    [ new Date("1993-03-11T00:00:00Z"), new Date("1993-03-28T00:00:00Z") ],
                    [ new Date("1995-01-20T00:00:00Z"), new Date("1995-02-01T00:00:00Z") ],
                    [ new Date("1994-01-02T00:00:00Z"), new Date("1994-01-16T00:00:00Z") ],
                    [ new Date("1995-07-17T00:00:00Z"), new Date("1995-08-27T00:00:00Z") ],
                    [ new Date("1996-09-02T00:00:00Z"), new Date("1996-09-20T00:00:00Z") ],
                    [ new Date("2001-10-29T00:00:00Z"), new Date("2001-12-07T00:00:00Z") ],
                    [ new Date("2008-03-28T00:00:00Z"), new Date("2008-04-15T00:00:00Z") ],
                    [ new Date("2011-01-04T00:00:00Z"), new Date("2011-01-18T00:00:00Z") ],
                    [ new Date("2018-01-11T00:00:00Z"), new Date("2018-02-01T00:00:00Z") ]
                   ],
            "SR04":[
                    [ new Date("1989-09-11T00:00:00Z"), new Date("1989-10-08T00:00:00Z") ],
                    [ new Date("1990-11-21T00:00:00Z"), new Date("1990-12-23T00:00:00Z") ],
                    [ new Date("1992-12-18T00:00:00Z"), new Date("1993-01-12T00:00:00Z") ],
                    [ new Date("1996-04-25T00:00:00Z"), new Date("1996-05-09T00:00:00Z") ],
                    [ new Date("1998-04-01T00:00:00Z"), new Date("1999-04-01T00:00:00Z") ],
                    [ new Date("2005-02-25T00:00:00Z"), new Date("2005-03-16T00:00:00Z") ],
                    [ new Date("2008-03-15T00:00:00Z"), new Date("2008-03-29T00:00:00Z") ],
                    [ new Date("2010-12-24T00:00:00Z"), new Date("2011-01-08T00:00:00Z") ]
                   ]
            }

            let q = new URLSearchParams(window.location.search) // parse out query string
            this.state = {
                woceline: q.has('woceline') ? q.get('woceline') : 'A10',
                occupancyIndex: q.has('occupancyIndex') ? parseInt(q.get('occupancyIndex')) : 0,
                variable: q.has('variable') ? q.get('variable') : 'conservative_temperature',
                subtractionIndex: q.has('subtractionIndex') ? parseInt(q.get('subtractionIndex')) : -1,
                points:[],
                urls:[],
                refreshData: true,
                apiKey: '',
                centerlon: 0
            }
    
            this.state.urls = this.generateURLs(this.state.woceline, this.state.occupancyIndex, this.state.subtractionIndex)
    
            this.formRef = React.createRef()
            this.statusReporting = React.createRef()
    
            this.customQueryParams = ['woceline', 'occupancyIndex', 'variable', 'subtractionIndex']

            this.downloadData()
    }

    componentDidUpdate(prevProps, prevState, snapshot){
        if(this.state.refreshData){
            if(this.statusReporting.current){
                helpers.manageStatus.bind(this)('downloading')
            }
            this.downloadData()
        }

        helpers.setQueryString.bind(this)()
    }

    downloadData(){
        Promise.all(this.state.urls.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
            Promise.all(responses.map(res => res.json())).then(data => {
                for(let i=0; i<data.length; i++){
                    let bail = helpers.handleHTTPcodes.bind(this)(data[i].code)
                    if(bail){
                        return
                    }
                }

                let mappoints = data[0].map(point => {
                    return(
                        <CircleMarker key={point._id+Math.random()} center={[point.geolocation.coordinates[1], helpers.mutateLongitude(point.geolocation.coordinates[0], parseFloat(this.state.centerlon)) ]} radius={1} color={'red'}/>
                    )
                })

                this.setState({
                    points: mappoints, 
                    refreshData: false
                })

            })
        })
    }

    changeWOCE = (event) => {
        this.setState({ 
            woceline: event.target.value, 
            occupancyIndex: 0,
            subtractionIndex: -1,
            urls: this.generateURLs(event.target.value, 0, -1),
            refreshData: true
        });
    };

    changeOccupancy = (event) => {
        this.setState({ 
            occupancyIndex: parseInt(event.target.value),
            urls: this.generateURLs(this.state.woceline, parseInt(event.target.value), this.state.subtractionIndex),
            refreshData: true
        });
    };

    changeVariable = (event) => {
        this.setState({ 
            variable: event.target.value,
            refreshData: false
        });
    };

    changeSubtraction = (event) => {
        this.setState({ 
            subtractionIndex: parseInt(event.target.value),
            urls: this.generateURLs(this.state.woceline, this.state.occupancyIndex, parseInt(event.target.value)),
            refreshData: true
        });
    };

    generateURLs(woceline, occupancyIndex, subtractionIndex){
        let urls = []
        
        let startDate = this.eo_occupancies[woceline][occupancyIndex][0].toISOString()
        let endDate = this.eo_occupancies[woceline][occupancyIndex][1].toISOString()
        urls[0] = `https://argovis-api.colorado.edu/easyocean?woceline=${woceline}&startDate=${startDate}&endDate=${endDate}&data=all`

        if(subtractionIndex >= 0){
            let subStartDate = this.eo_occupancies[woceline][subtractionIndex][0].toISOString()
            let subEndDate = this.eo_occupancies[woceline][subtractionIndex][1].toISOString()
            urls[1] = `https://argovis-api.colorado.edu/easyocean?woceline=${woceline}&startDate=${subStartDate}&endDate=${subEndDate}&data=all`
        }

        return urls
    }

    render(){
        console.log(this.state)

        return(
            <>
            <div style={{'width':'100vw', 'textAlign': 'center', 'padding':'0.5em', 'fontStyle':'italic'}} className='d-lg-none'>Use the right-hand scroll bar to scroll down for plot controls</div>
            <div className='row' style={{'width':'100vw'}}>
                <div className='col-lg-3 order-last order-lg-first'>
                    <fieldset ref={this.formRef}>
                        <span id='statusBanner' ref={this.statusReporting} className={'statusBanner busy'}>Downloading...</span>
                        <MapContainer style={{'height': '30vh'}} center={[25,parseFloat(this.state.centerlon)]} zoom={0} scrollWheelZoom={true}>
						    <TileLayer
						        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						    />
						    {this.state.points}
					    </MapContainer>
                        <div className='mapSearchInputs plotting-scrollit'>
                            <div className='verticalGroup'>
                                <h5>Plot Controls</h5>

                                <div className="form-text">
			            <span>WOCE line</span>
				</div>
                                <select value={this.state.woceline} onChange={this.changeWOCE} className="form-select" aria-label="Default select example">
                                   {Object.keys(this.eo_occupancies).map((key) => (
                                        <option key={key} value={key}>{key}</option>
                                   ))}
                                </select>

                                <div className="form-text">
			            <span>Occupancy</span>
				</div>
                                <select value={this.state.occupancyIndex} onChange={this.changeOccupancy} className="form-select" aria-label="Default select example">
                                   {this.eo_occupancies[this.state.woceline].map((occupancy, i) => (
                                        <option key={Math.random()} value={i}>{occupancy.map(date => date.toISOString().split('T')[0]).join(' to ')}</option>
                                   ))}
                                </select>

                                <div className="form-text">
			            <span>Variable</span>
				</div>
                                <select value={this.state.variable} onChange={this.changeVariable} className="form-select" aria-label="Default select example">
                                    <option key={Math.random()} value={'ctd_temperature'}>CTD Temperature</option>
                                    <option key={Math.random()} value={'ctd_salinity'}>CTD Salinity</option>
                                    <option key={Math.random()} value={'doxy'}>Dissolved Oxygen</option>
                                    <option key={Math.random()} value={'conservative_temperature'}>Conservative Temperature</option>
                                    <option key={Math.random()} value={'absolute_salinity'}>Absolute Salinity</option>
                                </select>

                                <div className="form-text">
			            <span>
                                        Subtraction Occupancy
                                        <OverlayTrigger
					    placement="right"
					    overlay={
						<Tooltip id="compression-tooltip" className="wide-tooltip">
						    Subtraction Occupancy: Plot the difference in your selected variable between the selected occupancy and this one
						</Tooltip>
					    }
					    trigger="click"
					>
					<i style={{'float':'left'}} className="fa fa-question-circle" aria-hidden="true"></i>
                                    </OverlayTrigger>
                                    </span>
				</div>
                                <select value={this.state.subtractionIndex} onChange={this.changeSubtraction} className="form-select" aria-label="Default select example">
                                   <option key='nosub' value={-1}>No subtraction</option>
                                   {this.eo_occupancies[this.state.woceline].map((occupancy, i) => (
                                        <option key={Math.random()} value={i}>{occupancy.map(date => date.toISOString().split('T')[0]).join(' to ')}</option>
                                   ))}
                                </select>

                            </div>
                        </div>
                    </fieldset>
                </div>

                <div className='col-lg-9'>

                </div>
            </div>
            </>
        )
    }

}

export default EasyoceanPlots;
