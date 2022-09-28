import React from 'react';
import { MapContainer, TileLayer, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import { HeatmapLayer } from "react-leaflet-heatmap-layer-v3";
import '../index.css';

class HM extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
      	grid: [],
      	min: 0,
      	max: 40,
      	refreshData: true
      }
      this.fgRef = React.createRef()
      this.apiPrefix = 'https://argovis-api.colorado.edu/'
    }

    refreshMap(){
    	this.setState({...this.state, refreshData: false})
    }

    heatUpdate(x){
    	console.log('heat update: ', x)
    	console.log('global min: ', this.state.min)
    	console.log('global max: ', this.state.max)
    }

	render(){

		if(this.state.refreshData){
			fetch(this.apiPrefix+'grids/temperature_rg?data=all&compression=array&startDate=2020-01-14T23:59:59Z&endDate=2020-01-15T00:00:01Z')
				.then(response => {response.json().then(data => {
					// eslint-disable-next-line
					this.state.grid = data

					let measurements = data.map(x => x.data[0][0])
					// eslint-disable-next-line
					this.state.max = Math.max(...measurements) ; this.state.min = Math.min(...measurements)

					console.log(this.state.min, this.state.max)

					this.refreshMap()
				})})
		}

		return(
			<div>
				<div className='row'>
					
					{/*search option sidebar*/}
					<div className='col-3 mapSearchInputs overflow-auto'>

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
              <HeatmapLayer
                points={this.state.grid}
                longitudeExtractor={x => x.geolocation.coordinates[0]}
                latitudeExtractor={x => x.geolocation.coordinates[1]}
                intensityExtractor={x => x.data[0][0] - this.state.min}
                useLocalExtrema={true}
                max={this.state.max}
                radius={5}
                blur={0}
                onStatsUpdate={this.heatUpdate.bind(this)}
              />
						</MapContainer>
					</div>
				</div>
			</div>
		)
	}
}

export default HM