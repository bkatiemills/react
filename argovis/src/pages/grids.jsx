import React from 'react';
import { MapContainer, TileLayer, Popup, Polygon, FeatureGroup, Rectangle} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import '../index.css';
import chroma from "chroma-js";
import helpers from'./helpers'

class Grids extends React.Component {
    constructor(props) {
      super(props);

      let q = new URLSearchParams(window.location.search) // parse out query string
      document.title = 'Argovis - Explore ' + q.get('grid') + ' grid'
      this.state = {
      	grid: [],
      	points: [],
      	subpoints: [],
      	data: [],
      	polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : [[-52.382812,53.225768],[-62.050781,48.107431],[-72.773438,43.325178],[-77.695313,37.996163],[-81.5625,32.990236],[-82.089844,27.683528],[-78.925781,22.755921],[-71.547389,23.008026],[-64.160156,22.917923],[-57.673458,28.712256],[-50.449219,34.161818],[-40.078125,44.590467],[-35.683594,51.618017],[-43.066406,54.265224],[-52.382812,53.225768]],
      	min: 0,
      	max: 1,
      	units: '',
      	levelindex: q.has('levelindex') ? q.get('levelindex') : 0,
      	sublevelindex: q.has('sublevelindex') ? q.get('sublevelindex') : 0,
      	timestep: q.has('timestep') ? q.get('timestep') : {
      		'temperature_rg': "2004-01-15",
      		'temperature_rg_sub': "2004-01-15",
      		'salinity_rg': "2004-01-15",
      		'ohc_kg': "2005-01-15"
      	}[q.get('grid')],
      	selectedGrid: q.get('grid'),
      	refreshData: true,
      	apiKey: 'guest',
      	subgrid: q.has('subgrid') ? q.get('subgrid') : false,
      	scale: chroma.scale(['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'])
      }
      this.state.subtimestep = q.has('subtimestep') ? q.get('subtimestep') : this.state.timestep
      this.rawLevels = {
      	'temperature_rg': [2.5,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,182.5,200,220,240,260,280,300,320,340,360,380,400,420,440,462.5,500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1412.5,1500,1600,1700,1800,1900,1975],
      	'salinity_rg': [2.5,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,182.5,200,220,240,260,280,300,320,340,360,380,400,420,440,462.5,500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1412.5,1500,1600,1700,1800,1900,1975],
      	'ohc_kg': [15]
      }[this.state.selectedGrid]
      this.levels = this.constructLevelOptions(this.rawLevels)
      this.timesteps = {
      	'temperature_rg': this.constructDateOptions(["2004-01-15","2004-02-15","2004-03-15","2004-04-15","2004-05-15","2004-06-15","2004-07-15","2004-08-15","2004-09-15","2004-10-15","2004-11-15","2004-12-15","2005-01-15","2005-02-15","2005-03-15","2005-04-15","2005-05-15","2005-06-15","2005-07-15","2005-08-15","2005-09-15","2005-10-15","2005-11-15","2005-12-15","2006-01-15","2006-02-15","2006-03-15","2006-04-15","2006-05-15","2006-06-15","2006-07-15","2006-08-15","2006-09-15","2006-10-15","2006-11-15","2006-12-15","2007-01-15","2007-02-15","2007-03-15","2007-04-15","2007-05-15","2007-06-15","2007-07-15","2007-08-15","2007-09-15","2007-10-15","2007-11-15","2007-12-15","2008-01-15","2008-02-15","2008-03-15","2008-04-15","2008-05-15","2008-06-15","2008-07-15","2008-08-15","2008-09-15","2008-10-15","2008-11-15","2008-12-15","2009-01-15","2009-02-15","2009-03-15","2009-04-15","2009-05-15","2009-06-15","2009-07-15","2009-08-15","2009-09-15","2009-10-15","2009-11-15","2009-12-15","2010-01-15","2010-02-15","2010-03-15","2010-04-15","2010-05-15","2010-06-15","2010-07-15","2010-08-15","2010-09-15","2010-10-15","2010-11-15","2010-12-15","2011-01-15","2011-02-15","2011-03-15","2011-04-15","2011-05-15","2011-06-15","2011-07-15","2011-08-15","2011-09-15","2011-10-15","2011-11-15","2011-12-15","2012-01-15","2012-02-15","2012-03-15","2012-04-15","2012-05-15","2012-06-15","2012-07-15","2012-08-15","2012-09-15","2012-10-15","2012-11-15","2012-12-15","2013-01-15","2013-02-15","2013-03-15","2013-04-15","2013-05-15","2013-06-15","2013-07-15","2013-08-15","2013-09-15","2013-10-15","2013-11-15","2013-12-15","2014-01-15","2014-02-15","2014-03-15","2014-04-15","2014-05-15","2014-06-15","2014-07-15","2014-08-15","2014-09-15","2014-10-15","2014-11-15","2014-12-15","2015-01-15","2015-02-15","2015-03-15","2015-04-15","2015-05-15","2015-06-15","2015-07-15","2015-08-15","2015-09-15","2015-10-15","2015-11-15","2015-12-15","2016-01-15","2016-02-15","2016-03-15","2016-04-15","2016-05-15","2016-06-15","2016-07-15","2016-08-15","2016-09-15","2016-10-15","2016-11-15","2016-12-15","2017-01-15","2017-02-15","2017-03-15","2017-04-15","2017-05-15","2017-06-15","2017-07-15","2017-08-15","2017-09-15","2017-10-15","2017-11-15","2017-12-15","2018-01-15","2018-02-15","2018-03-15","2018-04-15","2018-05-15","2018-06-15","2018-07-15","2018-08-15","2018-09-15","2018-10-15","2018-11-15","2018-12-15","2019-01-15","2019-02-15","2019-03-15","2019-04-15","2019-05-15","2019-06-15","2019-07-15","2019-08-15","2019-09-15","2019-10-15","2019-11-15","2019-12-15","2020-01-15","2020-02-15","2020-03-15","2020-04-15","2020-05-15","2020-06-15","2020-07-15","2020-08-15","2020-09-15","2020-10-15","2020-11-15","2020-12-15","2021-01-15","2021-02-15","2021-03-15","2021-04-15","2021-05-15","2021-06-15","2021-07-15","2021-08-15","2021-09-15","2021-10-15","2021-11-15","2021-12-15","2022-01-15","2022-02-15","2022-03-15","2022-04-15","2022-05-15"]),
      	'salinity_rg': this.constructDateOptions(["2004-01-15","2004-02-15","2004-03-15","2004-04-15","2004-05-15","2004-06-15","2004-07-15","2004-08-15","2004-09-15","2004-10-15","2004-11-15","2004-12-15","2005-01-15","2005-02-15","2005-03-15","2005-04-15","2005-05-15","2005-06-15","2005-07-15","2005-08-15","2005-09-15","2005-10-15","2005-11-15","2005-12-15","2006-01-15","2006-02-15","2006-03-15","2006-04-15","2006-05-15","2006-06-15","2006-07-15","2006-08-15","2006-09-15","2006-10-15","2006-11-15","2006-12-15","2007-01-15","2007-02-15","2007-03-15","2007-04-15","2007-05-15","2007-06-15","2007-07-15","2007-08-15","2007-09-15","2007-10-15","2007-11-15","2007-12-15","2008-01-15","2008-02-15","2008-03-15","2008-04-15","2008-05-15","2008-06-15","2008-07-15","2008-08-15","2008-09-15","2008-10-15","2008-11-15","2008-12-15","2009-01-15","2009-02-15","2009-03-15","2009-04-15","2009-05-15","2009-06-15","2009-07-15","2009-08-15","2009-09-15","2009-10-15","2009-11-15","2009-12-15","2010-01-15","2010-02-15","2010-03-15","2010-04-15","2010-05-15","2010-06-15","2010-07-15","2010-08-15","2010-09-15","2010-10-15","2010-11-15","2010-12-15","2011-01-15","2011-02-15","2011-03-15","2011-04-15","2011-05-15","2011-06-15","2011-07-15","2011-08-15","2011-09-15","2011-10-15","2011-11-15","2011-12-15","2012-01-15","2012-02-15","2012-03-15","2012-04-15","2012-05-15","2012-06-15","2012-07-15","2012-08-15","2012-09-15","2012-10-15","2012-11-15","2012-12-15","2013-01-15","2013-02-15","2013-03-15","2013-04-15","2013-05-15","2013-06-15","2013-07-15","2013-08-15","2013-09-15","2013-10-15","2013-11-15","2013-12-15","2014-01-15","2014-02-15","2014-03-15","2014-04-15","2014-05-15","2014-06-15","2014-07-15","2014-08-15","2014-09-15","2014-10-15","2014-11-15","2014-12-15","2015-01-15","2015-02-15","2015-03-15","2015-04-15","2015-05-15","2015-06-15","2015-07-15","2015-08-15","2015-09-15","2015-10-15","2015-11-15","2015-12-15","2016-01-15","2016-02-15","2016-03-15","2016-04-15","2016-05-15","2016-06-15","2016-07-15","2016-08-15","2016-09-15","2016-10-15","2016-11-15","2016-12-15","2017-01-15","2017-02-15","2017-03-15","2017-04-15","2017-05-15","2017-06-15","2017-07-15","2017-08-15","2017-09-15","2017-10-15","2017-11-15","2017-12-15","2018-01-15","2018-02-15","2018-03-15","2018-04-15","2018-05-15","2018-06-15","2018-07-15","2018-08-15","2018-09-15","2018-10-15","2018-11-15","2018-12-15","2019-01-15","2019-02-15","2019-03-15","2019-04-15","2019-05-15","2019-06-15","2019-07-15","2019-08-15","2019-09-15","2019-10-15","2019-11-15","2019-12-15","2020-01-15","2020-02-15","2020-03-15","2020-04-15","2020-05-15","2020-06-15","2020-07-15","2020-08-15","2020-09-15","2020-10-15","2020-11-15","2020-12-15","2021-01-15","2021-02-15","2021-03-15","2021-04-15","2021-05-15","2021-06-15","2021-07-15","2021-08-15","2021-09-15","2021-10-15","2021-11-15","2021-12-15","2022-01-15","2022-02-15","2022-03-15","2022-04-15","2022-05-15"]),
      	'ohc_kg': this.constructDateOptions(["2005-01-15","2005-02-15","2005-03-15","2005-04-15","2005-05-15","2005-06-15","2005-07-15","2005-08-15","2005-09-15","2005-10-15","2005-11-15","2005-12-15","2006-01-15","2006-02-15","2006-03-15","2006-04-15","2006-05-15","2006-06-15","2006-07-15","2006-08-15","2006-09-15","2006-10-15","2006-11-15","2006-12-15","2007-01-15","2007-02-15","2007-03-15","2007-04-15","2007-05-15","2007-06-15","2007-07-15","2007-08-15","2007-09-15","2007-10-15","2007-11-15","2007-12-15","2008-01-15","2008-02-15","2008-03-15","2008-04-15","2008-05-15","2008-06-15","2008-07-15","2008-08-15","2008-09-15","2008-10-15","2008-11-15","2008-12-15","2009-01-15","2009-02-15","2009-03-15","2009-04-15","2009-05-15","2009-06-15","2009-07-15","2009-08-15","2009-09-15","2009-10-15","2009-11-15","2009-12-15","2010-01-15","2010-02-15","2010-03-15","2010-04-15","2010-05-15","2010-06-15","2010-07-15","2010-08-15","2010-09-15","2010-10-15","2010-11-15","2010-12-15","2011-01-15","2011-02-15","2011-03-15","2011-04-15","2011-05-15","2011-06-15","2011-07-15","2011-08-15","2011-09-15","2011-10-15","2011-11-15","2011-12-15","2012-01-15","2012-02-15","2012-03-15","2012-04-15","2012-05-15","2012-06-15","2012-07-15","2012-08-15","2012-09-15","2012-10-15","2012-11-15","2012-12-15","2013-01-15","2013-02-15","2013-03-15","2013-04-15","2013-05-15","2013-06-15","2013-07-15","2013-08-15","2013-09-15","2013-10-15","2013-11-15","2013-12-15","2014-01-15","2014-02-15","2014-03-15","2014-04-15","2014-05-15","2014-06-15","2014-07-15","2014-08-15","2014-09-15","2014-10-15","2014-11-15","2014-12-15","2015-01-15","2015-02-15","2015-03-15","2015-04-15","2015-05-15","2015-06-15","2015-07-15","2015-08-15","2015-09-15","2015-10-15","2015-11-15","2015-12-15","2016-01-15","2016-02-15","2016-03-15","2016-04-15","2016-05-15","2016-06-15","2016-07-15","2016-08-15","2016-09-15","2016-10-15","2016-11-15","2016-12-15","2017-01-15","2017-02-15","2017-03-15","2017-04-15","2017-05-15","2017-06-15","2017-07-15","2017-08-15","2017-09-15","2017-10-15","2017-11-15","2017-12-15","2018-01-15","2018-02-15","2018-03-15","2018-04-15","2018-05-15","2018-06-15","2018-07-15","2018-08-15","2018-09-15","2018-10-15","2018-11-15","2018-12-15","2019-01-15","2019-02-15","2019-03-15","2019-04-15","2019-05-15","2019-06-15","2019-07-15","2019-08-15","2019-09-15","2019-10-15","2019-11-15","2019-12-15","2020-01-15","2020-02-15","2020-03-15","2020-04-15","2020-05-15","2020-06-15","2020-07-15","2020-08-15","2020-09-15","2020-10-15","2020-11-15","2020-12-15"])
      }[this.state.selectedGrid]
      this.reflink = {
      	'temperature_rg': 'https://sio-argo.ucsd.edu/RG_Climatology.html',
      	'salinity_rg': 'https://sio-argo.ucsd.edu/RG_Climatology.html',
      	'ohc_kg': 'https://zenodo.org/record/6131625#.Y3P5FILMKWA'
      }[this.state.selectedGrid]

      this.fgRef = React.createRef()
      this.statusReporting = React.createRef()
      this.scales = {
      	'temperature_rg': '',
      	'salinity_rg': '',
      	'ohc_kg': 'G'
      }[this.state.selectedGrid]
      this.apiPrefix = 'https://argovis-api.colorado.edu/'
     	this.customQueryParams = ['polygon', 'selectedGrid', 'levelindex', 'sublevelindex', 'timestep', 'subtimestep', 'subgrid']
      

      this.componentDidUpdate()
    }

    componentDidUpdate(prevProps, prevState, snapshot){
    	if(this.state.refreshData){
    		if(this.statusReporting.current){
					helpers.manageStatus.bind(this)('downloading')
				}
	    	//kick off request for new data, redraw the map when complete
	    	let url    = this.apiPrefix + 'grids/' + this.state.selectedGrid+'?data=all&compression=array&startDate='+this.state.timestep+'T00:00:00Z&endDate='+this.state.timestep+'T00:00:01Z&presRange='+(this.rawLevels[this.state.levelindex]-0.1)+','+(this.rawLevels[this.state.levelindex]+0.1)
	    	let suburl = this.apiPrefix + 'grids/' + this.state.selectedGrid+'?data=all&compression=array&startDate='+this.state.subtimestep+'T00:00:00Z&endDate='+this.state.subtimestep+'T00:00:01Z&presRange='+(this.rawLevels[this.state.sublevelindex]-0.1)+','+(this.rawLevels[this.state.sublevelindex]+0.1)
	    	if(this.state.polygon.length > 0){
	    		url += '&polygon='+JSON.stringify(this.state.polygon)
	    		suburl += '&polygon='+JSON.stringify(this.state.polygon)
	    	}

	    	if(this.state.subgrid){
					let x = Promise.all([url,suburl].map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
						Promise.all(responses.map(res => res.json())).then(data => {
							this.state.points = data[0]
							this.state.subpoints = data[1]
							// construct grid subtraction delta
							/// start by turning grids into kv keyed by unique concatenation of lon/lat so we can easily subtract the correct pairs of points
							let grid1 = {}
							for(let i=0; i<data[0].length; i++){
								grid1['' + data[0][i].geolocation.coordinates[0] + data[0][i].geolocation.coordinates[1]] = {
									geolocation: data[0][i].geolocation,
									data: data[0][i].data
								}
							}
							let grid2 = {}
							for(let i=0; i<data[1].length; i++){
								grid2['' + data[1][i].geolocation.coordinates[0] + data[1][i].geolocation.coordinates[1]] = {
									geolocation: data[1][i].geolocation,
									data: data[1][i].data
								}
							}
							/// subrtract grids, produce a list of objects that is 'profile-like' where data are the delta values
							this.state.data = []
							for(let i=0; i<Object.keys(grid1).length; i++){
								let key = Object.keys(grid1)[i]
								if(Object.keys(grid2).includes(key)){
									this.state.data.push({
										geolocation: grid1[key].geolocation,
										data: [[grid1[key].data[0][0] - grid2[key].data[0][0]]]
									})
								}
							}
							helpers.manageStatus.bind(this)('rendering')
							let values = this.state.data.map(x=>x.data[0][0]).filter(x=>x!==null)
							this.setScale(Math.min(...values), Math.max(...values))
							helpers.setQueryString.bind(this)()
							this.refreshMap(false, Math.min(...values), Math.max(...values))	
						})
					})
				} else {
					let x = Promise.all([url].map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
						Promise.all(responses.map(res => res.json())).then(data => {
							this.state.points = data[0]
							this.state.data = data[0]
							helpers.manageStatus.bind(this)('rendering')
							let values = this.state.data.map(x=>x.data[0][0]).filter(x=>x!==null)
							this.setScale(Math.min(...values), Math.max(...values))
							helpers.setQueryString.bind(this)()
							this.refreshMap(false, Math.min(...values), Math.max(...values))	
						}) 
					})
				}

			}
    }

    // input handlers
    changeLevel(target, index){
    	let s = this.state
    	s[index] = parseInt(target.target.value)
    	s.refreshData = true
    	this.setState(s)
    }

    changeDate(target, index){
    	let s = this.state
    	s[index] = target.target.value
    	s.refreshData = true
    	this.setState(s)
    }

    // mungers
    constructLevelOptions(levels){
    	return levels.map((x,i) => {return(
    			<option key={x+i} value={i}>{x}</option>
    		)})
    }

    constructDateOptions(dates){
    	return dates.map((x,i) => {return(
    			<option key={x+i} value={x}>{x}</option>
    		)})
    }

    refreshMap(needNewData, min, max){
    	// redraw the map and render the dom
    	if(this.state.points.length > 0){
				this.setState({...this.state, 
												grid: this.gridRasterfy(this.state.data, min, max), 
												min: min, 
												max: max, 
												units: this.state.points[0].units[0], 
												refreshData: needNewData
											}, () => {
													helpers.manageStatus.bind(this)('ready')
												})
	    }
    }

    gridRasterfy(points, min, max){
    	// expects a list from a data endpoint with compression=array
			if(points.hasOwnProperty('code') || points[0].hasOwnProperty('code')){
				return null
			}
			else {
				points = points.map(point => {return(
					<Rectangle 
						key={Math.random()} 
						bounds={[[point.geolocation.coordinates[1]-0.5, point.geolocation.coordinates[0]-0.5],[point.geolocation.coordinates[1]+0.5, point.geolocation.coordinates[0]+0.5]]} 
						pathOptions={{ 
							fillOpacity: 0.5, 
							weight: 0, 
							color: this.chooseColor(point.data[0][0], min, max) 
						}}>
      				{this.genTooltip(point)}
    			</Rectangle>
				)})
				return points
			}
    }

    chooseColor(val, min, max){
    	if(val === null){
    		return 'black'
    	}

    	return this.state.scale(val).hex()
    }

    fetchPolygon(coords){
    	helpers.fetchPolygon.bind(this)(coords)   	
    }

    onPolyCreate(payload){
    	this.fetchPolygon(payload.layer.getLatLngs()[0])
    }

    onPolyDelete(payload){
    	this.setState({polygon: []})
    }

    onPolyEdit(payload){
    	payload.layers.eachLayer(layer => this.fetchPolygon(layer.getLatLngs()[0]))
    }

    onDrawStop(payload){
    	helpers.onDrawStop.bind(this)(payload)
    }

    unitTransform(unit, scale){
    	if(scale === 'k'){
    		return Math.round(unit)/1000
    	} else if(scale === 'M'){
    		return Math.round(unit/1000)/1000
    	} else if(scale === 'G'){
    		return Math.round(unit/1000000)/1000
    	} else {
    		return unit
    	}
    }

    genTooltip(point){
    	// given an array <point> corresponding to a single point returned by an API data route with compression=minimal,
    	// return the jsx for an appropriate tooltip for this point.

		  if(this.state.subgrid){
		   	return(<Popup>
				  			Long / Lat: {point.geolocation.coordinates[0]} / {point.geolocation.coordinates[1]} <br />
				  			Value: {point.data[0][0]}
				  	  </Popup>)
		  } else {
	    	return(<Popup>
						      ID: {point._id} <br />
						      Long / Lat: {point.geolocation.coordinates[0]} / {point.geolocation.coordinates[1]} <br />
						      Date: {point.timestamp} <br />
						    </Popup>)
		  }
    }

    setScale(min, max){

    	if(this.state.subgrid){
    		if(min > 0){
    			this.state.scale = chroma.scale(['#FFFFFF', '#FF0000']).domain([0,max])
    			this.state.colormin = 0
    			this.state.colormax = max
    		} else if(max < 0){
    			this.state.scale = chroma.scale(['#0000FF', '#FFFFFF']).domain([min,0])
    			this.state.colormin = min
    			this.state.colormax = 0
    		} else {
    			this.state.scale = chroma.scale(['#0000FF', '#FFFFFF', '#FF0000']).domain([min,0,max])
    			this.state.colormin = min
    			this.state.colormax = max
    		}
    	} else {
    		this.state.scale = chroma.scale(['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825']).domain([min,max])
    		this.state.colormin = min
    		this.state.colormax = max
    	}
    }

	render(){
		console.log(this.state)
		return(
			<>
				<div className='row' style={{'width':'100vw'}}>	
					{/*search option sidebar*/}
					<div className='col-3 overflow-auto'>
						<span ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
						<div className='mapSearchInputs'>
							<h5>{this.state.selectedGrid + ' search control'}</h5>
							<small><a target="_blank" rel="noreferrer" href={this.reflink}>Original Data Reference</a></small>
							<div>
								<div className='row'>
									<div className='col-12'>
										<small className="form-text text-muted">Depth Layer [m]</small>
										<select className="form-select" value={this.state.levelindex} onChange={(v) => this.changeLevel(v, 'levelindex')}>
											{this.levels}
										</select>
									</div>
								</div>
								<div className='row'>
									<div className='col-12'>
										<small className="form-text text-muted">Month</small>
										<select className="form-select" value={this.state.timestep} onChange={(v) => this.changeDate(v, 'timestep')}>
											{this.timesteps}
										</select>
									</div>
								</div>
							</div>

							<div className="form-check" style={{'marginTop': '1em'}}>
								<input className="form-check-input" checked={this.state.subgrid} onChange={(v) => helpers.toggle.bind(this)(v, 'subgrid')} type="checkbox" id='subgrid'></input>
								<label className="form-check-label" htmlFor='subgrid'>Subtract another level or date</label>
							</div>

							<div style={{'display': this.state.subgrid ? 'block' : 'none'}}>
								<div className='row'>
									<div className='col-12'>
										<small className="form-text text-muted">Subtraction Depth Layer [m]</small>
										<select className="form-select" value={this.state.sublevelindex} onChange={(v) => this.changeLevel(v, 'sublevelindex')}>
											{this.levels}
										</select>
									</div>
								</div>
								<div className='row'>
									<div className='col-12'>
										<small className="form-text text-muted">Subtraction Month</small>
										<select className="form-select" value={this.state.subtimestep} onChange={(v) => this.changeDate(v, 'subtimestep')}>
											{this.timesteps}
										</select>
									</div>
								</div>
							</div>

							
							<svg style={{'width':'100%', 'marginTop': '1em'}} version="1.1" xmlns="http://www.w3.org/2000/svg">
							  <defs>
							    <linearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
							      <stop offset="0%" stopColor={this.state.scale(this.state.colormin)} />
							      <stop offset="10%" stopColor={this.state.scale(this.state.colormin + 0.1*(this.state.colormax-this.state.colormin))} />
							      <stop offset="20%" stopColor={this.state.scale(this.state.colormin + 0.2*(this.state.colormax-this.state.colormin))} />
							      <stop offset="30%" stopColor={this.state.scale(this.state.colormin + 0.3*(this.state.colormax-this.state.colormin))} />
							      <stop offset="40%" stopColor={this.state.scale(this.state.colormin + 0.4*(this.state.colormax-this.state.colormin))} />
							      <stop offset="50%" stopColor={this.state.scale(this.state.colormin + 0.5*(this.state.colormax-this.state.colormin))} />
							      <stop offset="60%" stopColor={this.state.scale(this.state.colormin + 0.6*(this.state.colormax-this.state.colormin))} />
							      <stop offset="70%" stopColor={this.state.scale(this.state.colormin + 0.7*(this.state.colormax-this.state.colormin))} />
							      <stop offset="80%" stopColor={this.state.scale(this.state.colormin + 0.8*(this.state.colormax-this.state.colormin))} />
							      <stop offset="90%" stopColor={this.state.scale(this.state.colormin + 0.9*(this.state.colormax-this.state.colormin))} />
							      <stop offset="100%" stopColor={this.state.scale(this.state.colormax)} />
							    </linearGradient>
							  </defs>

							  <rect width="100%" height="1em" fill="url(#grad)" />
								<text style={{'transform': 'translate(0.2em, 1.5em) rotate(90deg)'}}>{this.unitTransform(this.state.min, this.scales)}</text>
							  <text style={{'transform': 'translate(100%, 1.5em) rotate(90deg) translate(0, 1em)',}}>{this.unitTransform(this.state.max, this.scales)}</text>
							  <text textAnchor="middle" style={{'transform': 'translate(50%, 2em)',}}>{this.scales+this.state.units}</text>
							</svg>
						</div>
					</div>

					{/*leaflet map*/}
					<div className='col-9'>
						<MapContainer center={[25, 0]} zoom={2} scrollWheelZoom={true}>
						  <TileLayer
						    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						  />
						  <FeatureGroup ref={this.fgRef}>
						    <EditControl
						      position='topleft'
						      onEdited={p => this.onPolyEdit.bind(this,p)()}
						      onCreated={p => this.onPolyCreate.bind(this,p)()}
						      onDeleted={p => this.onPolyDelete.bind(this,p)()}
						      onDrawStop={p => this.onDrawStop.bind(this,p)()}
						      draw={{
                    rectangle: false,
                    circle: false,
                    polyline: false,
                    circlemarker: false,
                    marker: false,
                    polygon: {
                    	shapeOptions: {
                    		fillOpacity: 0
                    	}
                    }
						      }}
						    />
						    <Polygon positions={this.state.polygon.map(x => [x[1],x[0]])} fillOpacity={0}></Polygon>
						  </FeatureGroup>
              {this.state.grid}
						</MapContainer>
					</div>
				</div>
			</>
		)
	}
}

export default Grids