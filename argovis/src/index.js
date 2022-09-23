import React from 'react';
import ReactDOM from 'react-dom/client';
import { MapContainer, TileLayer, Popup, CircleMarker, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import './index.css';
import {ArgovisNav} from './nav.js'

class Argovis extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
      	argoPlatform: '',
      	apiKey: 'guest',
      	cchdoWOCE: '',
      	cchdoCruise: '',
      	datasetToggles: {
	        'Argo Core': 			true,
    	    'Argo BGC':  			true,
        	'Argo Deep': 			true,
        	'CCHDO':    			false,
        	'Drifters': 			false,
       		'Tropical Cyclones':    false
       	},
       	drifterWMO: '',
       	drifterPlatform: '',
       	endDate: '2020-01-02T00:00:00Z',
       	points: [[],[],[],[]], // index order argo, cchdo, drifters, tcs
       	polygon: [], // [[lon0, lat0], [lon1, lat1], ..., [lonn,latn], [lon0,lat0]]
       	startDate: '2020-01-01T00:00:00Z',
       	suppressRender: false,
       	tcName: '',
       	urls: [[],[],[],[]] // index order argo, cchdo, drifters, tcs
      }
      this.fgRef = React.createRef()
      this.apiPrefix = 'https://argovis-api.colorado.edu/'
    }

    shouldComponentUpdate(nextProps, nextState){
    	return !nextState.suppressRender
    }

    refreshMap(){
    	this.setState({suppressRender: false})
    }

    toggle(v){
    	let toggleState = {...this.state.datasetToggles}
    	toggleState[v.target.id] = !toggleState[v.target.id] 
    	this.setState({
    		datasetToggles: toggleState,
    	})
    }

    setDate(date, v){
    	let d = ''
    	if(isNaN(v.target.valueAsNumber)){
    		d = ''
    	} else{
	    	d = new Date(v.target.valueAsNumber).toISOString().replace('.000Z', 'Z')
	    }
	    let s = {...this.state}
	    s[date] = d
	    s['suppressRender'] = true
	    this.setState(s)
    }

    setToken(key, v){
    	let s = {...this.state}
    	s[key] = v.target.value
    	s.suppressRender = true
    	this.setState(s)
    }

    formURL(){
    	let rootURL = 'https://argovis-api.colorado.edu/argo?startDate=2020-01-01T00:00:00Z&endDate=2020-01-11T00:00:00Z&compression=minimal'
    	if(this.state.polygon.length > 0){
    		rootURL += '&polygon=[' + this.state.polygon.map(x => '['+x[0]+','+x[1]+']').join(',') + ']'
    	}
    	if(this.state.datasetToggles['Argo BGC']){
    		rootURL += '&source=argo_bgc'
    	}
    	return rootURL
    }

    generateTemporoSpatialURL(route){
    	//returns the api root, compression, time and space filters common to all endpoint queries

    	let url = this.apiPrefix + route + '?compression=minimal'

    	if(this.state.startDate !== ''){
    		url += '&startDate=' + this.state.startDate
    	}

    	if(this.state.endDate !== ''){
    		url += '&endDate=' + this.state.endDate
    	}  

    	if(this.state.polygon.length>0){
    		url += '&polygon=[' + this.state.polygon.map(x => '['+x[0]+','+x[1]+']').join(',') + ']'
    	}    

    	return url	
    }

    generateArgoURLs() {
    	let url = this.generateTemporoSpatialURL('argo')

    	if(this.state.argoPlatform !== ''){
    		url += '&platform=' + this.state.argoPlatform
    	}    	

    	// decide on source.source
    	let source = []
    	if(!this.state.datasetToggles['Argo Core'] && !this.state.datasetToggles['Argo BGC'] && !this.state.datasetToggles['Argo Deep']){
    		return []
    	} else if(this.state.datasetToggles['Argo Core'] && this.state.datasetToggles['Argo BGC'] && this.state.datasetToggles['Argo Deep']){
    		source = ['argo_core']
    	} else if(this.state.datasetToggles['Argo Core'] && this.state.datasetToggles['Argo BGC'] && !this.state.datasetToggles['Argo Deep']){
    		source = ['argo_core,argo_bgc,~argo_deep']
    	} else if(this.state.datasetToggles['Argo Core'] && !this.state.datasetToggles['Argo BGC'] && this.state.datasetToggles['Argo Deep']){
    		source = ['argo_core,~argo_bgc,argo_deep']
    	} else if(!this.state.datasetToggles['Argo Core'] && this.state.datasetToggles['Argo BGC'] && this.state.datasetToggles['Argo Deep']){
    		source = ['argo_bgc', 'argo_deep']
    	} else if(this.state.datasetToggles['Argo Core'] && !this.state.datasetToggles['Argo BGC'] && !this.state.datasetToggles['Argo Deep']){
    		source = ['argo_core,~argo_bgc,~argo_deep']
    	} else if(!this.state.datasetToggles['Argo Core'] && this.state.datasetToggles['Argo BGC'] && !this.state.datasetToggles['Argo Deep']){
    		source = ['argo_bgc']
    	} else if(!this.state.datasetToggles['Argo Core'] && !this.state.datasetToggles['Argo BGC'] && this.state.datasetToggles['Argo Deep']){
    		source = ['argo_deep']
    	}

    	if(source.length === 0){
    		return [url]
    	} else{
    		return source.map(x => url += '&source='+x)
    	}

    }

    generateCCHDOURLs() {
    	if(!this.state.datasetToggles['CCHDO']){
    		return []
    	}

    	let url = this.generateTemporoSpatialURL('cchdo')

    	if(this.state.cchdoWOCE !== ''){
    		url += '&woceline=' + this.state.cchdoWOCE
    	}

    	if(this.state.cchdoCruise !== ''){
    		url += '&cchdo_cruise=' + this.state.cchdoCruise
    	}

    	return [url]
    }

    generateDrifterURLs(){
    	if(!this.state.datasetToggles['Drifters']){
    		return []
    	}

    	let url = this.generateTemporoSpatialURL('drifters')

    	if(this.state.drifterWMO !== ''){
    		url += '&wmo=' + this.state.drifterWMO
    	}

    	if(this.state.drifterPlatform !== ''){
    		url += '&platform=' + this.state.drifterPlatform
    	}

    	return [url]
    }

    generateTCURLs(){
    	if(!this.state.datasetToggles['Tropical Cyclones']){
    		return []
    	}

    	let url = this.generateTemporoSpatialURL('tc')

    	if(this.state.tcName !== ''){
    		url += '&name=' + this.state.tcName
    	}

    	return [url]
    }	

    chooseColor(datasources){
    	if(datasources.includes('argo_bgc')){
    		return 'green'
    	}
    	else if(datasources.includes('argo_deep')){
    		return 'blue'
    	}
    	else{
	    	return 'yellow'
	    }
    }

    fetchPolygon(coords){
    	// coords == array of {lng: xx, lat: xx}, such as returned by getLatLngs
    	let vertexes = coords.map(x => [x.lng, x.lat])
    	vertexes.push(vertexes[0])
    	this.setState({polygon: vertexes})    	
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
    	// if there's already a polygon, get rid of it.
    	if(Object.keys(this.fgRef.current._layers).length > 1){
    		let layerID = Object.keys(this.fgRef.current._layers)[0]
    		let layer = this.fgRef.current._layers[layerID]
    		this.fgRef.current.removeLayer(layer)
    	}
    }

	render(){
		console.log('render ahoy')

		// reformualte all URLs
		let urls = [this.generateArgoURLs(), this.generateCCHDOURLs(), this.generateDrifterURLs(), this.generateTCURLs()]
		let refresh = []
		console.log('urls', urls)

		//compare new URLs to old URLs; any that are new, add them to a to-be-updated list, and update urls in state
		for(let i=0; i<urls.length; i++){
			let refetch = false
			for(let k=0; k<urls[i].length; k++){
				if(!this.state.urls[i].includes(urls[i][k])){
					refetch = true
				}
			}
			if(refetch){
				refresh = refresh.concat(urls[i])
				this.state.urls[i] = urls[i]
			}
		}

		console.log(refresh)

		//promise all across a `fetch` for all new URLs, and update CircleMarkers for all new fetches
		Promise.all(refresh.map(x => fetch(x))).then(responses => {
				let datasets = responses.map(x => x.url.slice(x.url.search('(?<='+this.apiPrefix+')'), x.url.search('(?=comp)')-1 ))
				console.log('datasets', datasets)
				Promise.all(responses.map(res => res.json())).then(data => {
					console.log(data)
				})
			})





		// let url = this.formURL()
		// const APIquery = async () => {
		// 	if(url !== this.state.url){
		// 		console.log(url)
		// 		const response = await fetch(url);
		// 		const res = await response.json();
		// 		let points = []
		// 		if(res.hasOwnProperty('code') || res[0].hasOwnProperty('code')){
		// 			console.log(res)
		// 		}
		// 		else {
		// 			points = res.map(point => {return(
		// 			  <CircleMarker key={point[0]} center={[point[2], point[1]]} radius={1} color={this.chooseColor(point[4])}>
		// 			    <Popup>
		// 			      ID: {point[0]} <br />
		// 			      Long / Lat: {point[1]} / {point[2]} <br />
		// 			      Date: {point[3]} <br />
		// 			      Data Sources: {point[4]}
		// 			    </Popup>
		// 			  </CircleMarker>
		// 			)})
					
		// 		}
		// 		this.setState({url: url, points: points})
		// 	}
		// }
		// APIquery()

		return(
			<div>
				<ArgovisNav/>

				<div className='row'>
					
					{/*search option sidebar*/}
					<div className='col-3 mapSearchInputs'>
						<h5>Search Control</h5>
						<button type="button" className="btn btn-primary verticalGroup" onClick={()=>this.refreshMap()}>Refresh Map</button>
						<div className='verticalGroup'>
							<div className="form-floating mb-3">
								<input type="date" className="form-control" id="startDate" value='2020-01-01' placeholder="" onChange={(v) => this.setDate('startDate', v)}></input>
								<label htmlFor="startDate">Start Date</label>
							</div>
							<div className="form-floating mb-3">
								<input type="date" className="form-control" id="endDate" value='2020-01-02' placeholder="" onChange={(v) => this.setDate('endDate', v)}></input>
								<label htmlFor="endDate">End Date</label>
							</div>
							<div className="form-floating mb-3">
								<input type="password" className="form-control" id="apiKey" placeholder="" onInput={(v) => this.setToken('apiKey', v)}></input>
								<label htmlFor="apiKey">API Key</label>
								<div id="apiKeyHelpBlock" className="form-text">
							  		<a target="_blank" rel="noreferrer" href='https://argovis-keygen.colorado.edu/'>Get a free API key</a>
								</div>
							</div>
						</div>
						<h6>Dataset Filters</h6>
						<div className="accordion" id="exploreMapControl">
						  <div className="accordion-item">
						    <h2 className="accordion-header" id="argoHeading">
						      <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseArgo" aria-expanded="true" aria-controls="collapseArgo">
						        <strong>Argo</strong>
						      </button>
						    </h2>
						    <div id="collapseArgo" className="accordion-collapse collapse show" aria-labelledby="argoHeading">
						      <div className="accordion-body">
						      	<div className='verticalGroup'>
							        <div className="form-check">
										<input className="form-check-input" checked={this.state.datasetToggles['Argo Core']} onChange={(v) => this.toggle(v)} type="checkbox" id='Argo Core'></input>
										<label className="form-check-label" htmlFor='Argo Core'>Display Argo Core</label>
									</div>
								    <div className="form-check">
										<input className="form-check-input" checked={this.state.datasetToggles['Argo BGC']} onChange={(v) => this.toggle(v)} type="checkbox" id='Argo BGC'></input>
										<label className="form-check-label" htmlFor='Argo BGC'>Display Argo BGC</label>
									</div>
					        		<div className="form-check">
										<input className="form-check-input" checked={this.state.datasetToggles['Argo Deep']} onChange={(v) => this.toggle(v)} type="checkbox" id='Argo Deep'></input>
										<label className="form-check-label" htmlFor='Argo Deep'>Display Argo Deep</label>
									</div>
								</div>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
  										<input type="text" className="form-control" id="argoPlatform" placeholder="" onInput={(v) => this.setToken('argoPlatform', v)}></input>
  										<label htmlFor="argoPlatform">Platform ID</label>
										<div id="argoPlatformHelpBlock" className="form-text">
									  		<a target="_blank" rel="noreferrer" href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=platform'>See list of Platform ID options</a>
										</div>
									</div>
								</div>
						      </div>
						    </div>
						  </div>

						  <div className="accordion-item">
						    <h2 className="accordion-header" id="cchdoHeading">
						      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseCCHDO" aria-expanded="false" aria-controls="collapseCCHDO">
						        <strong>CCHDO</strong>
						      </button>
						    </h2>
						    <div id="collapseCCHDO" className="accordion-collapse collapse" aria-labelledby="cchdoHeading">
						      <div className="accordion-body">
							    <div className='verticalGroup'>
				        			<div className="form-check">
										<input className="form-check-input" checked={this.state.datasetToggles['CCHDO']} onChange={(v) => this.toggle(v)} type="checkbox" id='CCHDO'></input>
										<label className="form-check-label" htmlFor='CCHDO'>Display CCHDO</label>
									</div>
								</div>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
  										<input type="text" className="form-control" id="cchdowoceline" placeholder="A10" onInput={(v) => this.setToken('cchdoWOCE', v)}></input>
  										<label htmlFor="cchdowoceline">WOCE line</label>
										<div id="cchdowoceHelpBlock" className="form-text">
									  		<a target="_blank" rel="noreferrer" href='https://argovis-api.colorado.edu/cchdo/vocabulary?parameter=woceline'>See list of WOCE line options</a>
										</div>
									</div>
									<div className="form-floating mb-3">
  										<input type="text" className="form-control" id="cchdoCruise" placeholder="" onInput={(v) => this.setToken('cchdoCruise', v)}></input>
  										<label htmlFor="cchdoCruise">Cruise No.</label>
										<div id="cchdoCruise" className="form-text">
									  		<a target="_blank" rel="noreferrer" href='https://argovis-api.colorado.edu/cchdo/vocabulary?parameter=cchdo_cruise'>See list of CCHDO cruise No. options</a>
										</div>
									</div>
								</div>
						      </div>
						    </div>
						  </div>

						  <div className="accordion-item">
						    <h2 className="accordion-header" id="driftersHeading">
						      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDrifters" aria-expanded="false" aria-controls="collapseDrifters">
						        <strong>Global Drifter Program</strong>
						      </button>
						    </h2>
						    <div id="collapseDrifters" className="accordion-collapse collapse" aria-labelledby="drifterHeading">
						      <div className="accordion-body">
							    <div className='verticalGroup'>
				        			<div className="form-check">
										<input className="form-check-input" checked={this.state.datasetToggles['Drifters']} onChange={(v) => this.toggle(v)} type="checkbox" id='Drifters'></input>
										<label className="form-check-label" htmlFor='Drifters'>Display Drifters</label>
									</div>
								</div>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
  										<input type="text" className="form-control" id="drifterWMO" placeholder="" onInput={(v) => this.setToken('drifterWMO', v)}></input>
  										<label htmlFor="drifterWMO">WMO ID</label>
										<div id="drifterWMOHelpBlock" className="form-text">
									  		<a target="_blank" rel="noreferrer" href='https://argovis-api.colorado.edu/drifters/vocabulary?parameter=wmo'>See list of WMO ID options</a>
										</div>
									</div>
									<div className="form-floating mb-3">
  										<input type="text" className="form-control" id="drifterPlatform" placeholder="" onInput={(v) => this.setToken('drifterPlatform', v)}></input>
  										<label htmlFor="drifterPlatform">Platform ID</label>
										<div id="drifterPlatform" className="form-text">
									  		<a target="_blank" rel="noreferrer" href='https://argovis-api.colorado.edu/drifters/vocabulary?parameter=platform'>See list of platform ID options</a>
										</div>
									</div>
								</div>
						      </div>
						    </div>
						  </div>

						  <div className="accordion-item">
						    <h2 className="accordion-header" id="tcHeading">
						      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTC" aria-expanded="false" aria-controls="collapseTC">
						        <strong>Tropical Cyclones</strong>
						      </button>
						    </h2>
						    <div id="collapseTC" className="accordion-collapse collapse" aria-labelledby="tcHeading">
						      <div className="accordion-body">
						      	<div className='verticalGroup'>
					        		<div className="form-check">
										<input className="form-check-input" checked={this.state.datasetToggles['Tropical Cyclones']} onChange={(v) => this.toggle(v)} type="checkbox" id='Tropical Cyclones'></input>
										<label className="form-check-label" htmlFor='Tropical Cyclones'>Display Tropical Cyclones</label>
									</div>
								</div>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
  										<input type="text" className="form-control" id="tcName" placeholder="" onInput={(v) => this.setToken('tcName', v)}></input>
  										<label htmlFor="tcName">Name</label>
										<div id="tcNameHelpBlock" className="form-text">
									  		<a target="_blank" rel="noreferrer" href='https://argovis-api.colorado.edu/tc/vocabulary?parameter=name'>See list of TC name options</a>
										</div>
									</div>
								</div>
						      </div>
						    </div>
						  </div>
						</div>
					</div>

					{/*leaflet map*/}
					<div className='col-9'>
						<MapContainer center={[35, 0]} zoom={2} scrollWheelZoom={true}>
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
						  {this.state.points}
						</MapContainer>
					</div>
				</div>
			</div>
		)
	}
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<Argovis />);