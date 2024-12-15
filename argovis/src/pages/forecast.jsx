import React from 'react';
import { MapContainer, TileLayer, FeatureGroup, Popup, Rectangle} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import '../index.css';
import helpers from'./helpers'
import chroma from "chroma-js";
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

class Forecast extends React.Component {

	constructor(props) {
		document.title = 'Argovis - Explore ARGONE forecasts'
		super(props);

		let q = new URLSearchParams(window.location.search) // parse out query string

		this.spectrum = ['#ffffff', '#ffd9d1','#fdc8be','#fba69a','#f88377','#f55f53','#f44c41','#e51f17','#ca110b','#a60d08','#820906']

		// default state, pulling in query string specifications
		this.state = {
			apiKey: localStorage.getItem('apiKey') ? localStorage.getItem('apiKey') : 'guest',
			originLon: q.has('originLon') ? parseFloat(q.get('originLon')) : -68,
			originLat: q.has('originLat') ? parseFloat(q.get('originLat')) : 36,
			forecastTime: q.has('forecastTime') ? parseFloat(q.get('forecastTime')) : 1800,
			centerlon: q.has('centerlon') ? parseFloat(q.get('centerlon')) : -70,
			mapkey: Math.random(),
			urls: [],
			points: [],
			data: [[]],
			scale: chroma.scale(this.spectrum).domain([0,1]),
			colormin: 0,
			colormax: 1,
            phase: 'refreshData'
		}

        // some other useful class variables
        this.fgRef = React.createRef()
        this.formRef = React.createRef()
        this.nameRef = React.createRef()
		this.statusReporting = React.createRef()
		this.reautofocus = null
        this.apiPrefix = 'https://argovis-api.colorado.edu/'
        this.lookupLabel = {}
        this.dataset = 'argone'
        this.customQueryParams =  ['originLon', 'originLat', 'forecastTime', 'centerlon']
		this.forecasts = this.constructForecastOptions(this.rawLevels)

        this.state.urls = this.generateURLs(this.state.originLon, this.state.originLat, this.state.forecastTime)
        this.downloadData()
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	helpers.phaseManager.bind(this)(prevProps, prevState, snapshot)
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

                this.setState({
                    phase: 'remapData',
                    data: data
                })

            })
        })
    }

    replot(){
        let points = this.mapmarkers()
        if(points.length > 0){  
            let p = this.state.data[0].map(point => {return point.data[0][0]})
            let min =  Math.floor(Math.log10(Math.min(...p)))
            let max = Math.ceil(Math.log10(Math.max(...p)))
            let scale = chroma.scale(this.spectrum).domain([min,max])
            this.setState({
                scale: scale,
                colormin: min,
                colormax: max,
                points: points,
                phase: 'idle'
            })
        } else {
            this.setState({points: [], phase: 'idle'})
        }

    }

    generateURLs(originLon, originLat, forecastTime){
		return [this.apiPrefix + 'argone?forecastOrigin=' + originLon + ',' + originLat + '&data=' + forecastTime]
    }	

    colorscale(val, scale){
    	if(val === null){
    		return 'black'
    	}

    	return scale(val).hex()
    }

	mapmarkers(){
		if(JSON.stringify(this.state.data) === '[[]]'){
			return []
		}
	
		if(this.state.data.hasOwnProperty('code') || this.state.data[0].hasOwnProperty('code')){
			return null
		}
		else {
			let p = this.state.data[0].map(point => {return point.data[0][0]})
			let min =  Math.floor(Math.log10(Math.min(...p)))
			let max = Math.ceil(Math.log10(Math.max(...p)))
			let scale = chroma.scale(this.spectrum).domain([min,max])
			let originfound = false
			let pts = this.state.data[0].map(point => {
				let origin = point.geolocation_forecast.coordinates[0] === point.geolocation.coordinates[0] && point.geolocation_forecast.coordinates[1] === point.geolocation.coordinates[1]
				if(origin){
					originfound = true
				}				
				let cell = <Rectangle 
						key={Math.random()} 
						bounds={[[point.geolocation_forecast.coordinates[1]-1, helpers.mutateLongitude(point.geolocation_forecast.coordinates[0], parseFloat(this.state.centerlon))-1],[point.geolocation_forecast.coordinates[1]+1, helpers.mutateLongitude(point.geolocation_forecast.coordinates[0], parseFloat(this.state.centerlon))+1]]} 
						pathOptions={{ 
							fillOpacity: 1,
							weight: 0, 
							color: origin ? 'black' : this.colorscale(Math.log10(point.data[0][0]), scale)
						}}

						>
      				{this.genTooltip(point)}
    			</Rectangle>
				return cell
			})
			if(!originfound){
				pts.push(
					<Rectangle 
						key={Math.random()} 
						bounds={[[this.state.data[0][0].geolocation.coordinates[1]-1, helpers.mutateLongitude(this.state.data[0][0].geolocation.coordinates[0], parseFloat(this.state.centerlon))-1],[this.state.data[0][0].geolocation.coordinates[1]+1, helpers.mutateLongitude(this.state.data[0][0].geolocation.coordinates[0], parseFloat(this.state.centerlon))+1]]} 
						pathOptions={{ 
							fillOpacity: 1,
							weight: 0, 
							color: 'black'
						}}

						>
						<Popup>
							Longitude: {this.state.data[0][0].geolocation.coordinates[0]}<br/>
							Latitude: {this.state.data[0][0].geolocation.coordinates[1]}<br/>
							Forecast probability: 0<br/>
						</Popup>
					</Rectangle>
				)
			}
			return pts
		}
	}

	constructForecastOptions(){
		let d = [90,180,270,360,450,540,630,720,810,900,990,1080,1170,1260,1350,1440,1530,1620,1710,1800]
		return d.map((x) => {return(
			<option key={x} value={x}>{x}</option>
		)})
	}

    genTooltip(point, state){
    	// given an array <point> corresponding to a single point returned by an API data route with compression=minimal,
    	// return the jsx for an appropriate tooltip for this point.

    	return(
		    <Popup>
				Longitude: {point.geolocation_forecast.coordinates[0]}<br/>
				Latitude: {point.geolocation_forecast.coordinates[1]}<br/>
				Forecast probability: {point.data[0][0]}<br/>
		    </Popup>
    	)
    }

    dateRangeMultiplyer(s){
    	// allowed date range will be multiplied by this much, as a function of the mutated state s
    	return 1
    }

	generateScaleTics(tics){
		// generate a list of tics for the color scale
		let scale = []
		for(let i=0; i<tics; i++){
			let x = 10 + i/(tics-1)*80
			if (i === tics-1) {
				x -= 0.5
			}
			scale.push(<rect key={i} x={x + '%'} y="15" height="5px" width="0.5%" fill="black"/>)
		}
		return scale
	}

	generateScaleLabels(min, max){
		let text = Array.from({length: max+1 - min}, (_, i) => min + i)
		return text.map((x, i) => {
			let pos = 10 + i/(max-min)*80
			if(i === max-min){
				pos -= 0.5
			}
			return(
				<text key={i} x={pos + '%'} y="40" fontSize="1em" textAnchor="middle">10<tspan dy="-10">{x}</tspan></text>
			)
		})	
	}

    changeLongitude(e){
        this.setState({
            phase: 'refreshData',
            originLon: helpers.tidylon(Math.round(e.target.value / 2) * 2),
            mapkey: Math.random(),
            urls: this.generateURLs(helpers.tidylon(Math.round(e.target.value / 2) * 2), this.state.originLat, this.state.forecastTime)
        })
    }

    changeLatitude(e){
        this.setState({
            phase: 'refreshData',
            originLat: Math.round(e.target.value / 2) * 2,
            mapkey: Math.random(),
            urls: this.generateURLs(this.state.originLon, Math.round(e.target.value / 2) * 2, this.state.forecastTime)
        })
    }

    changeForecast(target){
    	this.setState({
            forecastTime: target.target.value,
            phase: 'refreshData',
            urls: this.generateURLs(this.state.originLon, this.state.originLat, target.target.value)
        })
    }

    changeCenterLongitude(e){
        this.setState({
            centerlon: helpers.manageCenterlon(e.target.defaultValue),
            mapkey: Math.random(),
            phase: 'remapData'
        })
    }

	render(){
		console.log(this.state)
		return(
			<>
				<div style={{'width':'100vw', 'textAlign': 'center', 'padding':'0.5em', 'fontStyle':'italic'}} className='d-lg-none'>Use the right-hand scroll bar to scroll down for search controls</div>
				<div className='row' style={{'width':'100vw'}}>
					<div className='col-lg-3 order-last order-lg-first'>
						<fieldset ref={this.formRef}>
							<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
							<div className='mapSearchInputs scrollit' style={{'height':'90vh'}}>
								<h5>
									<OverlayTrigger
										placement="right"
										overlay={
											<Tooltip id="compression-tooltip" className="wide-tooltip">
												ARGONE provides probability distribution functions for the location of Argo floats after drifting for a number of days. Choose a new float origin location by clicking on the marker icon in the top left of the map, and then clicking your new location; or by adjusting the form below.
											</Tooltip>
										}
										trigger="click"
									>
										<i  style={{'float':'right'}} className="fa fa-question-circle" aria-hidden="true"></i>
                                    </OverlayTrigger>
									Explore ARGONE Forecasts
								</h5>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
										<input type="password" className="form-control" id="apiKey" value={this.state.apiKey} placeholder="" onInput={(v) => helpers.setToken.bind(this)('apiKey', v.target.value, null, true)}></input>
										<label htmlFor="apiKey">API Key</label>
										<div id="apiKeyHelpBlock" className="form-text">
						  					<a target="_blank" rel="noreferrer" href='https://argovis-keygen.colorado.edu/'>Get a free API key</a>
										</div>
									</div>
									<h6>Float origin (black cell)</h6>
									<div className="form-floating mb-3">
										<input 
											type="number" 
											className="form-control" 
											id="originLon" 
											value={this.state.originLon} 
											onChange={e => {
													this.setState({
														originLon:e.target.value,
                                                        phase: 'awaitingUserInput'
													})
												}
											} 
											onBlur={e => {
                                                this.changeLongitude(e)
											}}
											onKeyPress={e => {
												if(e.key==='Enter'){
                                                    this.changeLongitude(e)
												}
											}}
										/>
										<label htmlFor="originLon">Longitude</label>
									</div>
									<div className="form-floating mb-3">
										<input 
											type="number" 
											className="form-control" 
											id="originLat" 
											value={this.state.originLat} 
											onChange={e => {
													this.setState({
														originLat:e.target.value,
														phase: 'awaitingUserInput'
													})
												}
											} 
											onBlur={e => {
                                                this.changeLatitude(e)
											}}
											onKeyPress={e => {
												if(e.key==='Enter'){
                                                    this.changeLatitude(e)
												}
											}}
										/>
										<label htmlFor="originLat">Latitude</label>
									</div>

									<h6>Forecast length (days)</h6>
									<select 
										id="forecastTime"
										className="form-select" 
										value={this.state.forecastTime} 
										onChange={(v) => this.changeForecast(v)}
									>
										{this.forecasts}
									</select>

								</div>

								<h6>Map Center Longitude</h6>
								<div className="form-floating mb-3">
									<input 
										id="centerlon"
										type="text"
										className="form-control" 
										placeholder="0" 
										value={this.state.centerlon} 
										onChange={e => {
											this.setState({centerlon:e.target.value, phase: 'awaitingUserInput'})}
										} 
										onBlur={e => {
											this.changeCenterLongitude(e)
										}}
										onKeyPress={e => {
											if(e.key==='Enter'){
												this.changeCenterLongitude(e)
											}
										}}
										aria-label="centerlon" 
										aria-describedby="basic-addon1"/>
									<label htmlFor="depth">Center longitude on [-180,180]</label>
								</div>

								<svg style={{'width':'100%', 'height':'4em', 'marginTop': '1em'}} version="1.1" xmlns="http://www.w3.org/2000/svg">
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
								  <rect x="10%" width="80%" height="15px" fill="url(#grad)" stroke="black" />
								  {this.generateScaleTics(this.state.colormax-this.state.colormin+1)}
								  {this.generateScaleLabels(this.state.colormin, this.state.colormax)}
								  <text x="50%" y="3.5em" textAnchor="middle" fill="black">Probability density function</text>
								</svg>

							</div>
						</fieldset>
					</div>

					{/*leaflet map*/}
					<div className='col-lg-9'>
						<MapContainer key={this.state.mapkey} center={[25, parseFloat(this.state.centerlon)]} maxBounds={[[-90,this.state.centerlon-180],[90,this.state.centerlon+180]]} zoomSnap={0.01} zoomDelta={1} zoom={2.05} minZoom={2.05} scrollWheelZoom={true} >
							<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							<FeatureGroup ref={this.fgRef}>
								<EditControl
								position='topleft'
								onCreated={p => {
									const { lat, lng } = p.layer.getLatLng();  // Get the coordinates of the marker
									let latitude = Math.round(lat / 2) * 2;
									let longitude = Math.round(lng / 2) * 2;
									longitude = helpers.tidylon(longitude)
									this.setState({
										originLat: latitude,
										originLon: longitude,
										mapkey: Math.random(),
										refreshData: true
									});
								}}
								draw={{
									rectangle: false,
									circle: false,
									polyline: false,
									circlemarker: false,
									marker: true,
									polygon: false
								}}
								edit={{
									edit: false
								}}
								/>
							</FeatureGroup>
							{this.state.points}
						</MapContainer>
					</div>
				</div>
			</>
		)
	}
}

export default Forecast