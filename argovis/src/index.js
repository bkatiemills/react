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
      	datasetToggles: {
	        'Argo Core': 			true,
    	    'Argo BGC':  			true,
        	'Argo Deep': 			true,
        	'CCHDO':    			false,
        	'Drifters': 			false,
       		'Tropical Cyclones':    false
       	},
       	points: [],
       	url: ''
      }
    }

    toggle(tog){
    	let s = {...this.state}
    	s['datasetToggles'][tog] = !s['datasetToggles'][tog]
    	this.setState(s)
    }

    formURL(){
    	let rootURL = 'https://argovis-api.colorado.edu/argo?startDate=2020-01-01T00:00:00Z&endDate=2020-01-11T00:00:00Z&compression=minimal'
    	if(this.state.datasetToggles['Argo BGC']){
    		rootURL += '&source=argo_bgc'
    	}
    	return rootURL
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

    onPolyCreate(payload){
    	console.log(payload['layer'].getLatLngs())
    }

	render(){
		console.log('render ahoy')
		const datasetToggles = Object.keys(this.state.datasetToggles).map(toggle => {
			return(
				<div className="form-check" key={toggle}>
					<input className="form-check-input" checked={this.state.datasetToggles[toggle]} onChange={() => this.toggle(toggle)} type="checkbox" id={toggle}></input>
					<label className="form-check-label" htmlFor={toggle}>{toggle}</label>
				</div>
			)
		})

		let url = this.formURL()
		const APIquery = async () => {
			if(url !== this.state.url){
				console.log(url)
				const response = await fetch(url);
				const res = await response.json();
				let points = res.map(point => {return(
				  <CircleMarker key={point[0]} center={[point[2], point[1]]} radius={1} color={this.chooseColor(point[4])}>
				    <Popup>
				      ID: {point[0]} <br />
				      Long / Lat: {point[1]} / {point[2]} <br />
				      Date: {point[3]} <br />
				      Data Sources: {point[4]}
				    </Popup>
				  </CircleMarker>
				)})
				this.setState({url: url, points: points})
			}
		}
		APIquery()

		return(
			<div>
				<ArgovisNav></ArgovisNav>

				<div className='row'>
					
					{/*search option sidebar*/}
					<div className='col-3 mapSearchInputs'>
						<h5>Search Options</h5>
						<div>
							<h6>Datasets</h6>
							{datasetToggles}		
						</div>
					</div>

					{/*leaflet map*/}
					<div className='col-9'>
						<MapContainer center={[35, 0]} zoom={2} scrollWheelZoom={true}>
						  <TileLayer
						    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						  />
						  <FeatureGroup>
						    <EditControl
						      position='topleft'
						      onEdited={this._onEditPath}
						      onCreated={this.onPolyCreate}
						      onDeleted={this._onDeleted}
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