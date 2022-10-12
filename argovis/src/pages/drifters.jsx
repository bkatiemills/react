import React from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'

class DriftersExplore extends React.Component {

	constructor(props) {
		super(props);

		let q = new URLSearchParams(window.location.search) // parse out query string

		this.defaultPolygon = [[-62.57812500000001,52.482780222078226],[-84.37500000000001,34.016241889667036],[-87.18750000000001,15.623036831528264],[-64.33593750000001,13.923403897723347],[-40.42968750000001,46.07323062540835],[-62.57812500000001,52.482780222078226]]
		// default state, pulling in query string specifications
		this.state = {
			observingEntity: false,
			apiKey: 'guest',
			wmoSuggestions: [],
			platformSuggestions: [],
			wmo: q.has('wmo') ? q.get('wmo') : '',
			platform: q.has('platform') ? q.get('platform') : '',
			refreshData: false,
			points: [],
			polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : this.defaultPolygon,
			urls: []
		}

		this.maxDayspan = 0 // note the url construction always allows for one extra day than endDate-startDate
		helpers.mungeTime.bind(this)(q, this.maxDayspan, '2020-01-01')

        // some other useful class variables
        this.fgRef = React.createRef()
        this.formRef = React.createRef()
		this.statusReporting = React.createRef()
        //this.apiPrefix = 'https://argovis-api.colorado.edu/'
        this.apiPrefix = 'http://3.88.185.52:8080/'
        this.vocab = {}
        this.lookupLabel = {}
        this.dataset = 'drifter'
        this.customQueryParams =  ['wmo', 'platform']

        // populate vocabularies, and trigger first render
        let vocabURLs = [this.apiPrefix + 'drifters/vocabulary?parameter=wmo', this.apiPrefix + 'drifters/vocabulary?parameter=platform']
		Promise.all(vocabURLs.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
			Promise.all(responses.map(res => res.json())).then(data => {
				this.vocab['wmo'] = data[0].map(x => String(x))
				this.vocab['platform'] = data[1]
				this.setState({refreshData:true})
			})
		})
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	helpers.componentDidUpdate.bind(this)()
    }

    lookingForEntity(){
    	// return true if any token, valid or not, is specified for any entity query string parameter
    	return Boolean(this.state.wmo || this.state.platform)
    }

    generateURLs(){
    	if(this.state.wmo !== ''){
    		return [this.apiPrefix +'drifters?compression=minimal&wmo=' + this.state.wmo]
    	} else if (this.state.platform !== ''){
    		return [this.apiPrefix +'drifters?compression=minimal&platform=' + this.state.platform]
    	} else {
    		return [helpers.generateTemporoSpatialURL.bind(this)('drifters')]
    	}
    }	

    chooseColor(datasources){
    	return 'black'
    }

	render(){
		console.log(this.state)
		return(
			<>
				<div className='row'>
					<div className='col-3 overflow-auto'>
						<fieldset ref={this.formRef}>
							<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
							<div className='mapSearchInputs'>
								<h5>Explore Global Drifter Program</h5>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
										<input type="password" className="form-control" id="apiKey" placeholder="" onInput={(v) => helpers.setToken.bind(this)('apiKey', v.target.value)}></input>
										<label htmlFor="apiKey">API Key</label>
										<div id="apiKeyHelpBlock" className="form-text">
						  					<a target="_blank" rel="noreferrer" href='https://argovis-keygen.colorado.edu/'>Get a free API key</a>
										</div>
									</div>
									<h6>Time Range</h6>
									<div className="form-floating mb-3">
										<input type="date" disabled={this.state.observingEntity} className="form-control" id="startDate" value={this.state.startDate} placeholder="" onChange={(v) => helpers.setDate.bind(this)('startDate', v.target.valueAsNumber, this.maxDayspan)}></input>
										<label htmlFor="startDate">Start Date</label>
									</div>
									<div className="form-floating mb-3">
										<input type="date" disabled={this.state.observingEntity} className="form-control" id="endDate" value={this.state.endDate} placeholder="" onChange={(v) => helpers.setDate.bind(this)('endDate', v.target.valueAsNumber, this.maxDayspan)}></input>
										<label htmlFor="endDate">End Date</label>
									</div>
									<div id="dateRangeHelp" className="form-text">
					  					<p>Max day range: {this.maxDayspan+1}</p>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6>Object Filters</h6>
									<div className="form-floating mb-3">
			      						<Autosuggest
									      	id='wmoAS'
									      	key='wmo'
									        suggestions={this.state.wmoSuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'wmoSuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'wmoSuggestions')}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'wmo')}
									        inputProps={{placeholder: 'WMO ID', value: this.state.wmo, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of WMO ID'), id: 'wmo', disabled: Boolean(this.state.platform)}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
									</div>

									<div className="form-floating mb-3">
			      						<Autosuggest
									      	id='platformAS'
									      	key='platform'
									        suggestions={this.state.platformSuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'platformSuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'platformSuggestions')}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'platform')}
									        inputProps={{placeholder: 'Platform ID', value: this.state.platform, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of Platform ID'), id: 'platform',  disabled: Boolean(this.state.wmo)}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
									</div>
								</div>
							</div>
						</fieldset>
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
								onEdited={p => helpers.onPolyEdit.bind(this,p)()}
								onCreated={p => helpers.onPolyCreate.bind(this,p)()}
								onDeleted={p => helpers.onPolyDelete.bind(this,p)()}
								onDrawStop={p => helpers.onDrawStop.bind(this,p)()}
								onDrawStart={p => helpers.onDrawStart.bind(this,p)()}
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
								<Polygon key={JSON.stringify(this.state.polygon)} positions={this.state.polygon.map(x => [x[1],x[0]])} fillOpacity={0}></Polygon>
							</FeatureGroup>
							{this.state.points}
						</MapContainer>
					</div>
				</div>
			</>
		)
	}
}

export default DriftersExplore