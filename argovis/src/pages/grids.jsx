import React from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import '../index.css';
import chroma from "chroma-js";

class Grids extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
      	grid: [],
      	raw: [],
      	levelindex: {
      		'temperature_rg': 0,
      		'salinity_rg': 0,
      		'ohc_kg': 0
      	},
      	selectedGrid: '',
      	status: 'ready'
      }
      this.levels = {
      	'temperature_rg': this.constructLevelOptions([2.5,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,182.5,200,220,240,260,280,300,320,340,360,380,400,420,440,462.5,500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1412.5,1500,1600,1700,1800,1900,1975]),
      	'salinity_rg': this.constructLevelOptions([2.5,10,20,30,40,50,60,70,80,90,100,110,120,130,140,150,160,170,182.5,200,220,240,260,280,300,320,340,360,380,400,420,440,462.5,500,550,600,650,700,750,800,850,900,950,1000,1050,1100,1150,1200,1250,1300,1350,1412.5,1500,1600,1700,1800,1900,1975]),
      	'ohc_kg': this.constructLevelOptions([15])
      }
      this.fgRef = React.createRef()
      this.gridControls = {
      	'temperature_rg': React.createRef(),
      	'salinity_rg': React.createRef(),
      	'ohc_kg': React.createRef()
      }
      this.apiPrefix = 'https://argovis-api.colorado.edu/'
      this.scale = chroma.scale(['#440154', '#482777', '#3f4a8a', '#31678e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825']); //chroma -> colorbrewer -> viridis
    }

    constructLevelOptions(levels){
    	return levels.map((x,i) => {return(
    			<option key={x+i} value={i}>{x}</option>
    		)})
    }

    refreshData(){
    	//kick off request for new data, redraw the map when complete
    	console.log('refresh data', this.state.selectedGrid)
			fetch(this.apiPrefix+'grids/'+this.state.selectedGrid+'?data=all&compression=array&startDate=2020-01-14T23:59:59Z&endDate=2020-01-15T00:00:01Z')
				.then(response => {response.json().then(data => {
					this.setState({...this.state, status:'rendering'}, () => {this.refreshMap(data)})					
				})})
    }

    refreshMap(data){
    	// redraw the map and render the dom
    	console.log(data)
    	console.log(this.state.status)
    	console.log(this.state.levelindex)
    	if(data.length > 0){
				let values = data.map(x=>x.data[this.state.levelindex[this.state.selectedGrid]][0]).filter(x=>x!==null)
				this.setState({...this.state, grid: this.grid_circlefy(data, Math.min(...values), Math.max(...values)), raw: data, status: 'ready'})
	    }
    }

    changeGrid(target){
    	if(this.state.selectedGrid){
	    	this.gridControls[this.state.selectedGrid].current.classList.toggle('hidden')
	    }
    	this.gridControls[target.target.id].current.classList.toggle('hidden')
    	this.setState({...this.state, selectedGrid: target.target.id, status: 'downloading'}, () => this.refreshData())
    }

    changeLevel(target, grid){
    	let s = this.state
    	s.levelindex[grid] = parseInt(target.target.value)
    	s.status = 'rendering'
    	this.setState(s, () => this.refreshMap(this.state.raw))
    }

    grid_circlefy(points, min, max){
    	// expects a list from a data endpoint with compression=array
			if(points.hasOwnProperty('code') || points[0].hasOwnProperty('code')){
				return null
			}
			else {
				points = points.map(point => {return(
				  <CircleMarker key={point._id+Math.random()} center={[point.geolocation.coordinates[1], point.geolocation.coordinates[0]]} radius={1} color={this.chooseColor(point.data[this.state.levelindex[this.state.selectedGrid]][0], min, max)}>
				    <Popup>
				      ID: {point._id} <br />
				      Long / Lat: {point.geolocation.coordinates[0]} / {point.geolocation.coordinates[1]} <br />
				      Date: {point.timestamp}
				    </Popup>
				  </CircleMarker>
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

    generateStatus(status){
    	// status == 'ready', 'downloading', 'rendering'
    	let message = ''
  		let className = ''
    	if(status === 'ready'){
    		className = 'statusBanner ready'
    		message = 'Ready'
    	} else if(status === 'downloading'){
    		className = 'statusBanner busy'
    		message = 'Downloading...'
    	} else if(status === 'rendering'){
    		className = 'statusBanner busy'
    		message = 'Rendering...'
    	}
    	return(
	    	<span className={className}>{message}</span>
	    	)
    }


	render(){
		console.log('render ahoy')
		return(
			<div>
				<div className='row'>
					
					{/*search option sidebar*/}
					<div className='col-3 overflow-auto'>
						{this.generateStatus(this.state.status)}
						<div className='mapSearchInputs'>
							<h5>Search Control</h5>
							<div className="form-check">
							  <input className="form-check-input" type="radio" name="flexRadioDefault" id="temperature_rg" onChange={(v) => this.changeGrid(v)} checked={this.state.selectedGrid === 'temperature_rg'}/>
							  <label className="form-check-label" htmlFor="temperature_rg">
							    Roemmich-Gilson temperature total
							  </label>
							</div>
							<div ref={this.gridControls['temperature_rg']} className='hidden'>
								<select className="form-select" onChange={(v) => this.changeLevel(v, 'temperature_rg')}>
									{this.levels.temperature_rg}
								</select>
							</div>
							<div className="form-check">
							  <input className="form-check-input" type="radio" name="flexRadioDefault" id="salinity_rg" onChange={(v) => this.changeGrid(v)} checked={this.state.selectedGrid === 'salinity_rg'}/>
							  <label className="form-check-label" htmlFor="salinity_rg">
							    Roemmich-Gilson salinity total
							  </label>
							</div>
							<div ref={this.gridControls['salinity_rg']} className='hidden'>
								<select className="form-select" onChange={(v) => this.changeLevel(v, 'salinity_rg')}>
									{this.levels.salinity_rg}
								</select>
							</div>
							<div className="form-check">
							  <input className="form-check-input" type="radio" name="flexRadioDefault" id="ohc_kg" onChange={(v) => this.changeGrid(v)} checked={this.state.selectedGrid === 'ohc_kg'}/>
							  <label className="form-check-label" htmlFor="ohc_kg">
							    Kuusela-Giglio ocean heat content
							  </label>
							</div>
							<div ref={this.gridControls['ohc_kg']} className='hidden'>
								<select className="form-select" onChange={(v) => this.changeLevel(v, 'ohc_kg')}>
									{this.levels.ohc_kg}
								</select>
							</div>
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
						      }}
						    />
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