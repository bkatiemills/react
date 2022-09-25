import React from 'react';
import { MapContainer, TileLayer, Popup, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import '../index.css';

class Grids extends React.Component {
    constructor(props) {
      super(props);
      this.state = {}
      this.fgRef = React.createRef()
      this.refreshButtonRef = React.createRef()
      this.apiPrefix = 'https://argovis-api.colorado.edu/'
    }

	render(){

		return(
			<div>
				<div className='row'>
					
					{/*search option sidebar*/}
					<div className='col-3 mapSearchInputs overflow-auto'>

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
						</MapContainer>
					</div>
				</div>
			</div>
		)
	}
}

export default Grids