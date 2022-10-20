import React from 'react';
import { MapContainer, TileLayer, Popup, Polygon, FeatureGroup, Rectangle} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import '../index.css';
import chroma from "chroma-js";
import helpers from'./helpers'

class Grids extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
      	grid: [],
      	points: [],
      	polygon: [[-52.382812,53.225768],[-62.050781,48.107431],[-72.773438,43.325178],[-77.695313,37.996163],[-81.5625,32.990236],[-82.089844,27.683528],[-78.925781,22.755921],[-71.547389,23.008026],[-64.160156,22.917923],[-57.673458,28.712256],[-50.449219,34.161818],[-40.078125,44.590467],[-35.683594,51.618017],[-43.066406,54.265224],[-52.382812,53.225768]],
      	min: 0,
      	max: 1,
      	units: '',
      	levelindex: {
      		'temperature_rg': 0,
      		'salinity_rg': 0,
      		'ohc_kg': 0
      	},
      	timestep: {
      		'temperature_rg': "2004-01-15",
      		'salinity_rg': "2004-01-15",
      		'ohc_kg': "2005-01-15"
      	},
      	selectedGrid: 'temperature_rg',
      	refreshData: true
      }
      this.rawLevels = {
      	'temperature_rg': [2.5,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,182.5,200,220,240,260,280,300,320,340,360,380,400,420,440,462.5,500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1412.5,1500,1600,1700,1800,1900,1975],
      	'salinity_rg': [2.5,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,182.5,200,220,240,260,280,300,320,340,360,380,400,420,440,462.5,500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1412.5,1500,1600,1700,1800,1900,1975],
      	'ohc_kg': [15]
      }
      this.levels = {
      	'temperature_rg': this.constructLevelOptions(this.rawLevels['temperature_rg']),
      	'salinity_rg': this.constructLevelOptions(this.rawLevels['salinity_rg']),
      	'ohc_kg': this.constructLevelOptions(this.rawLevels['ohc_kg'])
      }
      this.timesteps = {
      	'temperature_rg': this.constructDateOptions(["2004-01-15","2004-02-15","2004-03-15","2004-04-15","2004-05-15","2004-06-15","2004-07-15","2004-08-15","2004-09-15","2004-10-15","2004-11-15","2004-12-15","2005-01-15","2005-02-15","2005-03-15","2005-04-15","2005-05-15","2005-06-15","2005-07-15","2005-08-15","2005-09-15","2005-10-15","2005-11-15","2005-12-15","2006-01-15","2006-02-15","2006-03-15","2006-04-15","2006-05-15","2006-06-15","2006-07-15","2006-08-15","2006-09-15","2006-10-15","2006-11-15","2006-12-15","2007-01-15","2007-02-15","2007-03-15","2007-04-15","2007-05-15","2007-06-15","2007-07-15","2007-08-15","2007-09-15","2007-10-15","2007-11-15","2007-12-15","2008-01-15","2008-02-15","2008-03-15","2008-04-15","2008-05-15","2008-06-15","2008-07-15","2008-08-15","2008-09-15","2008-10-15","2008-11-15","2008-12-15","2009-01-15","2009-02-15","2009-03-15","2009-04-15","2009-05-15","2009-06-15","2009-07-15","2009-08-15","2009-09-15","2009-10-15","2009-11-15","2009-12-15","2010-01-15","2010-02-15","2010-03-15","2010-04-15","2010-05-15","2010-06-15","2010-07-15","2010-08-15","2010-09-15","2010-10-15","2010-11-15","2010-12-15","2011-01-15","2011-02-15","2011-03-15","2011-04-15","2011-05-15","2011-06-15","2011-07-15","2011-08-15","2011-09-15","2011-10-15","2011-11-15","2011-12-15","2012-01-15","2012-02-15","2012-03-15","2012-04-15","2012-05-15","2012-06-15","2012-07-15","2012-08-15","2012-09-15","2012-10-15","2012-11-15","2012-12-15","2013-01-15","2013-02-15","2013-03-15","2013-04-15","2013-05-15","2013-06-15","2013-07-15","2013-08-15","2013-09-15","2013-10-15","2013-11-15","2013-12-15","2014-01-15","2014-02-15","2014-03-15","2014-04-15","2014-05-15","2014-06-15","2014-07-15","2014-08-15","2014-09-15","2014-10-15","2014-11-15","2014-12-15","2015-01-15","2015-02-15","2015-03-15","2015-04-15","2015-05-15","2015-06-15","2015-07-15","2015-08-15","2015-09-15","2015-10-15","2015-11-15","2015-12-15","2016-01-15","2016-02-15","2016-03-15","2016-04-15","2016-05-15","2016-06-15","2016-07-15","2016-08-15","2016-09-15","2016-10-15","2016-11-15","2016-12-15","2017-01-15","2017-02-15","2017-03-15","2017-04-15","2017-05-15","2017-06-15","2017-07-15","2017-08-15","2017-09-15","2017-10-15","2017-11-15","2017-12-15","2018-01-15","2018-02-15","2018-03-15","2018-04-15","2018-05-15","2018-06-15","2018-07-15","2018-08-15","2018-09-15","2018-10-15","2018-11-15","2018-12-15","2019-01-15","2019-02-15","2019-03-15","2019-04-15","2019-05-15","2019-06-15","2019-07-15","2019-08-15","2019-09-15","2019-10-15","2019-11-15","2019-12-15","2020-01-15","2020-02-15","2020-03-15","2020-04-15","2020-05-15","2020-06-15","2020-07-15","2020-08-15","2020-09-15","2020-10-15","2020-11-15","2020-12-15","2021-01-15","2021-02-15","2021-03-15","2021-04-15","2021-05-15","2021-06-15","2021-07-15","2021-08-15","2021-09-15","2021-10-15","2021-11-15","2021-12-15","2022-01-15","2022-02-15","2022-03-15","2022-04-15","2022-05-15"]),
      	'salinity_rg': this.constructDateOptions(["2004-01-15","2004-02-15","2004-03-15","2004-04-15","2004-05-15","2004-06-15","2004-07-15","2004-08-15","2004-09-15","2004-10-15","2004-11-15","2004-12-15","2005-01-15","2005-02-15","2005-03-15","2005-04-15","2005-05-15","2005-06-15","2005-07-15","2005-08-15","2005-09-15","2005-10-15","2005-11-15","2005-12-15","2006-01-15","2006-02-15","2006-03-15","2006-04-15","2006-05-15","2006-06-15","2006-07-15","2006-08-15","2006-09-15","2006-10-15","2006-11-15","2006-12-15","2007-01-15","2007-02-15","2007-03-15","2007-04-15","2007-05-15","2007-06-15","2007-07-15","2007-08-15","2007-09-15","2007-10-15","2007-11-15","2007-12-15","2008-01-15","2008-02-15","2008-03-15","2008-04-15","2008-05-15","2008-06-15","2008-07-15","2008-08-15","2008-09-15","2008-10-15","2008-11-15","2008-12-15","2009-01-15","2009-02-15","2009-03-15","2009-04-15","2009-05-15","2009-06-15","2009-07-15","2009-08-15","2009-09-15","2009-10-15","2009-11-15","2009-12-15","2010-01-15","2010-02-15","2010-03-15","2010-04-15","2010-05-15","2010-06-15","2010-07-15","2010-08-15","2010-09-15","2010-10-15","2010-11-15","2010-12-15","2011-01-15","2011-02-15","2011-03-15","2011-04-15","2011-05-15","2011-06-15","2011-07-15","2011-08-15","2011-09-15","2011-10-15","2011-11-15","2011-12-15","2012-01-15","2012-02-15","2012-03-15","2012-04-15","2012-05-15","2012-06-15","2012-07-15","2012-08-15","2012-09-15","2012-10-15","2012-11-15","2012-12-15","2013-01-15","2013-02-15","2013-03-15","2013-04-15","2013-05-15","2013-06-15","2013-07-15","2013-08-15","2013-09-15","2013-10-15","2013-11-15","2013-12-15","2014-01-15","2014-02-15","2014-03-15","2014-04-15","2014-05-15","2014-06-15","2014-07-15","2014-08-15","2014-09-15","2014-10-15","2014-11-15","2014-12-15","2015-01-15","2015-02-15","2015-03-15","2015-04-15","2015-05-15","2015-06-15","2015-07-15","2015-08-15","2015-09-15","2015-10-15","2015-11-15","2015-12-15","2016-01-15","2016-02-15","2016-03-15","2016-04-15","2016-05-15","2016-06-15","2016-07-15","2016-08-15","2016-09-15","2016-10-15","2016-11-15","2016-12-15","2017-01-15","2017-02-15","2017-03-15","2017-04-15","2017-05-15","2017-06-15","2017-07-15","2017-08-15","2017-09-15","2017-10-15","2017-11-15","2017-12-15","2018-01-15","2018-02-15","2018-03-15","2018-04-15","2018-05-15","2018-06-15","2018-07-15","2018-08-15","2018-09-15","2018-10-15","2018-11-15","2018-12-15","2019-01-15","2019-02-15","2019-03-15","2019-04-15","2019-05-15","2019-06-15","2019-07-15","2019-08-15","2019-09-15","2019-10-15","2019-11-15","2019-12-15","2020-01-15","2020-02-15","2020-03-15","2020-04-15","2020-05-15","2020-06-15","2020-07-15","2020-08-15","2020-09-15","2020-10-15","2020-11-15","2020-12-15","2021-01-15","2021-02-15","2021-03-15","2021-04-15","2021-05-15","2021-06-15","2021-07-15","2021-08-15","2021-09-15","2021-10-15","2021-11-15","2021-12-15","2022-01-15","2022-02-15","2022-03-15","2022-04-15","2022-05-15"]),
      	'ohc_kg': this.constructDateOptions(["2005-01-15","2005-02-15","2005-03-15","2005-04-15","2005-05-15","2005-06-15","2005-07-15","2005-08-15","2005-09-15","2005-10-15","2005-11-15","2005-12-15","2006-01-15","2006-02-15","2006-03-15","2006-04-15","2006-05-15","2006-06-15","2006-07-15","2006-08-15","2006-09-15","2006-10-15","2006-11-15","2006-12-15","2007-01-15","2007-02-15","2007-03-15","2007-04-15","2007-05-15","2007-06-15","2007-07-15","2007-08-15","2007-09-15","2007-10-15","2007-11-15","2007-12-15","2008-01-15","2008-02-15","2008-03-15","2008-04-15","2008-05-15","2008-06-15","2008-07-15","2008-08-15","2008-09-15","2008-10-15","2008-11-15","2008-12-15","2009-01-15","2009-02-15","2009-03-15","2009-04-15","2009-05-15","2009-06-15","2009-07-15","2009-08-15","2009-09-15","2009-10-15","2009-11-15","2009-12-15","2010-01-15","2010-02-15","2010-03-15","2010-04-15","2010-05-15","2010-06-15","2010-07-15","2010-08-15","2010-09-15","2010-10-15","2010-11-15","2010-12-15","2011-01-15","2011-02-15","2011-03-15","2011-04-15","2011-05-15","2011-06-15","2011-07-15","2011-08-15","2011-09-15","2011-10-15","2011-11-15","2011-12-15","2012-01-15","2012-02-15","2012-03-15","2012-04-15","2012-05-15","2012-06-15","2012-07-15","2012-08-15","2012-09-15","2012-10-15","2012-11-15","2012-12-15","2013-01-15","2013-02-15","2013-03-15","2013-04-15","2013-05-15","2013-06-15","2013-07-15","2013-08-15","2013-09-15","2013-10-15","2013-11-15","2013-12-15","2014-01-15","2014-02-15","2014-03-15","2014-04-15","2014-05-15","2014-06-15","2014-07-15","2014-08-15","2014-09-15","2014-10-15","2014-11-15","2014-12-15","2015-01-15","2015-02-15","2015-03-15","2015-04-15","2015-05-15","2015-06-15","2015-07-15","2015-08-15","2015-09-15","2015-10-15","2015-11-15","2015-12-15","2016-01-15","2016-02-15","2016-03-15","2016-04-15","2016-05-15","2016-06-15","2016-07-15","2016-08-15","2016-09-15","2016-10-15","2016-11-15","2016-12-15","2017-01-15","2017-02-15","2017-03-15","2017-04-15","2017-05-15","2017-06-15","2017-07-15","2017-08-15","2017-09-15","2017-10-15","2017-11-15","2017-12-15","2018-01-15","2018-02-15","2018-03-15","2018-04-15","2018-05-15","2018-06-15","2018-07-15","2018-08-15","2018-09-15","2018-10-15","2018-11-15","2018-12-15","2019-01-15","2019-02-15","2019-03-15","2019-04-15","2019-05-15","2019-06-15","2019-07-15","2019-08-15","2019-09-15","2019-10-15","2019-11-15","2019-12-15","2020-01-15","2020-02-15","2020-03-15","2020-04-15","2020-05-15","2020-06-15","2020-07-15","2020-08-15","2020-09-15","2020-10-15","2020-11-15","2020-12-15"])
      }
      this.fgRef = React.createRef()
      this.gridControls = {
      	'temperature_rg': React.createRef(),
      	'salinity_rg': React.createRef(),
      	'ohc_kg': React.createRef()
      }
      this.statusReporting = React.createRef()
      this.scales = {
      	'temperature_rg': '',
      	'salinity_rg': '',
      	'ohc_kg': 'G'
      }
      this.apiPrefix = 'https://argovis-api.colorado.edu/'
      this.scale = chroma.scale(['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825']); //chroma -> colorbrewer -> viridis
      
      this.componentDidUpdate()
    }

    componentDidUpdate(prevProps, prevState, snapshot){
    	if(this.state.refreshData){
    		if(this.statusReporting.current){
					helpers.manageStatus.bind(this)('downloading')
				}
	    	//kick off request for new data, redraw the map when complete
	    	let url = this.apiPrefix + 'grids/' + this.state.selectedGrid+'?data=all&compression=array&startDate='+this.state.timestep[this.state.selectedGrid]+'T00:00:00Z&endDate='+this.state.timestep[this.state.selectedGrid]+'T00:00:01Z&presRange='+(this.rawLevels[this.state.selectedGrid][this.state.levelindex[this.state.selectedGrid]]-0.1)+','+(this.rawLevels[this.state.selectedGrid][this.state.levelindex[this.state.selectedGrid]]+0.1)
	    	if(this.state.polygon.length > 0){
	    		url += '&polygon='+JSON.stringify(this.state.polygon)
	    	}
				fetch(url)
					.then(response => {response.json().then(data => {
						// eslint-disable-next-line
						this.state.points = data
						helpers.manageStatus.bind(this)('rendering')
						this.refreshMap(false)				
					})})
			}
    }

    // input handlers
    changeGrid(target){
    	if(this.state.selectedGrid){
	    	this.gridControls[this.state.selectedGrid].current.classList.toggle('hidden')
	    }
    	this.gridControls[target.target.id].current.classList.toggle('hidden')
    	this.setState({...this.state, selectedGrid: target.target.id, refreshData: true})
    }

    changeLevel(target, grid){
    	let s = this.state
    	s.levelindex[grid] = parseInt(target.target.value)
    	s.refreshData = true
    	this.setState(s)
    }

    changeDate(target, grid){
    	let s = this.state
    	s.timestep[grid] = target.target.value
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

    refreshMap(needNewData){
    	// redraw the map and render the dom
    	if(this.state.points.length > 0){
				let values = this.state.points.map(x=>x.data[0][0]).filter(x=>x!==null)
				this.setState({...this.state, 
												grid: this.gridRasterfy(this.state.points, Math.min(...values), Math.max(...values)), 
												min: Math.min(...values), 
												max: Math.max(...values), 
												units: this.state.points[0].units[0], 
												refreshData: needNewData}, () => {
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
					<Rectangle key={point._id+Math.random()} bounds={[[point.geolocation.coordinates[1]-0.5, point.geolocation.coordinates[0]-0.5],[point.geolocation.coordinates[1]+0.5, point.geolocation.coordinates[0]+0.5]]} pathOptions={{ fillOpacity: 0.5, weight: 0, color: this.chooseColor(point.data[0][0], min, max) }}>
      				<Popup>
				      	ID: {point._id} <br />
				  			Long / Lat: {point.geolocation.coordinates[0]} / {point.geolocation.coordinates[1]} <br />
				  			Date: {point.timestamp}
				  		</Popup>
    			</Rectangle>
				)})
				return points
			}
    }

    chooseColor(val, min, max){
    	if(val === null){
    		return 'black'
    	}

    	return this.scale((val-min)/(max - min)).hex()
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

    	return(
		    <Popup>
		      ID: {point[0]} <br />
		      Long / Lat: {point[1]} / {point[2]} <br />
		      Date: {point[3]} <br />
		      Data Sources: {point[4]}
		    </Popup>
    	)
    }

	render(){
		return(
			<div>
				<div className='row'>	
					{/*search option sidebar*/}
					<div className='col-3 overflow-auto'>
						<span ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
						<div className='mapSearchInputs'>
							<h5>Search Control</h5>
							<div className="form-check">
							  <input className="form-check-input" type="radio" name="flexRadioDefault" id="temperature_rg" onChange={(v) => this.changeGrid(v)} checked={this.state.selectedGrid === 'temperature_rg'}/>
							  <label className="form-check-label" htmlFor="temperature_rg">
							    <strong>Roemmich-Gilson temperature total</strong>
							  </label>
							</div>
							<div ref={this.gridControls['temperature_rg']}>
								<div className='row'>
									<div className='col-1'></div>
									<div className='col-11'>
										<small className="form-text text-muted"><a target="_blank" rel="noreferrer" href='https://sio-argo.ucsd.edu/RG_Climatology.html'>Original Data</a></small>
										<select className="form-select" onChange={(v) => this.changeLevel(v, 'temperature_rg')}>
											{this.levels.temperature_rg}
										</select>
										<small className="form-text text-muted">Depth Layer [m]</small>
									</div>
								</div>
								<div className='row'>
									<div className='col-1'></div>
									<div className='col-11'>
										<select className="form-select" onChange={(v) => this.changeDate(v, 'temperature_rg')}>
											{this.timesteps.temperature_rg}
										</select>
										<small className="form-text text-muted">Month</small>
									</div>
								</div>
							</div>
							<div className="form-check">
							  <input className="form-check-input" type="radio" name="flexRadioDefault" id="salinity_rg" onChange={(v) => this.changeGrid(v)} checked={this.state.selectedGrid === 'salinity_rg'}/>
							  <label className="form-check-label" htmlFor="salinity_rg">
							    <strong>Roemmich-Gilson salinity total</strong>
							  </label>
							</div>
							<div ref={this.gridControls['salinity_rg']} className='hidden'>
								<div className='row'>
									<div className='col-1'></div>
									<div className='col-11'>
										<small className="form-text text-muted"><a target="_blank" rel="noreferrer" href='https://sio-argo.ucsd.edu/RG_Climatology.html'>Original Data</a></small>
										<select className="form-select" onChange={(v) => this.changeLevel(v, 'salinity_rg')}>
											{this.levels.salinity_rg}
										</select>
										<small className="form-text text-muted">Depth Layer [m]</small>
									</div>
								</div>
								<div className='row'>
									<div className='col-1'></div>
									<div className='col-11'>
										<select className="form-select" onChange={(v) => this.changeDate(v, 'salinity_rg')}>
											{this.timesteps.salinity_rg}
										</select>
										<small className="form-text text-muted">Month</small>
									</div>
								</div>
							</div>
							<div className="form-check">
							  <input className="form-check-input" type="radio" name="flexRadioDefault" id="ohc_kg" onChange={(v) => this.changeGrid(v)} checked={this.state.selectedGrid === 'ohc_kg'}/>
							  <label className="form-check-label" htmlFor="ohc_kg">
							    <strong>Kuusela-Giglio ocean heat content</strong>
							  </label>
							</div>
							<div ref={this.gridControls['ohc_kg']} className='hidden'>
								<div className='row'>
									<div className='col-1'></div>
										<div className='col-11'>
											<small className="form-text text-muted"><a target="_blank" rel="noreferrer" href='https://zenodo.org/record/6131625'>Original Data</a></small>
											<select className="form-select" onChange={(v) => this.changeLevel(v, 'ohc_kg')}>
												{this.levels.ohc_kg}
											</select>
											<small className="form-text text-muted">Depth Layer [m]</small>
										</div>
								</div>
								<div className='row'>
									<div className='col-1'></div>
									<div className='col-11'>
										<select className="form-select" onChange={(v) => this.changeDate(v, 'ohc_kg')}>
											{this.timesteps.ohc_kg}
										</select>
										<small className="form-text text-muted">Month</small>
									</div>
								</div>
							</div>
							<svg style={{'width':'100%', 'marginTop': '1em'}} version="1.1" xmlns="http://www.w3.org/2000/svg">
							  <defs>
							    <linearGradient id="grad" x1="0" x2="1" y1="0" y2="0">
							      <stop offset="0%" stopColor={this.scale(0)} />
							      <stop offset="10%" stopColor={this.scale(0.1)} />
							      <stop offset="20%" stopColor={this.scale(0.2)} />
							      <stop offset="30%" stopColor={this.scale(0.3)} />
							      <stop offset="40%" stopColor={this.scale(0.4)} />
							      <stop offset="50%" stopColor={this.scale(0.5)} />
							      <stop offset="60%" stopColor={this.scale(0.6)} />
							      <stop offset="70%" stopColor={this.scale(0.7)} />
							      <stop offset="80%" stopColor={this.scale(0.8)} />
							      <stop offset="90%" stopColor={this.scale(0.9)} />
							      <stop offset="100%" stopColor={this.scale(1)} />
							    </linearGradient>
							  </defs>

							  <rect width="100%" height="1em" fill="url(#grad)" />
								<text style={{'transform': 'translate(0.2em, 1.5em) rotate(90deg)'}}>{this.unitTransform(this.state.min, this.scales[this.state.selectedGrid])}</text>
							  <text style={{'transform': 'translate(100%, 1.5em) rotate(90deg) translate(0, 1em)',}}>{this.unitTransform(this.state.max, this.scales[this.state.selectedGrid])}</text>
							  <text textAnchor="middle" style={{'transform': 'translate(50%, 2em)',}}>{this.scales[this.state.selectedGrid]+this.state.units}</text>
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
			</div>
		)
	}
}

export default Grids