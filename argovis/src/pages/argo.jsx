import React from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup, Popup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'

class ArgoExplore extends React.Component {

	constructor(props) {
		super(props);

		let q = new URLSearchParams(window.location.search) // parse out query string

		// limits for polygon / time coupling
		this.minDays = 10
		this.maxDays = 365
		this.minArea = 1000000
		this.maxArea = 10000000
		this.defaultDayspan = 10

		// default state, pulling in query string specifications
		this.state = {
			observingEntity: false,
			apiKey: 'guest',
			argocore: q.has('argocore') ? q.get('argocore') === 'true' : false,
			argobgc: q.has('argobgc') ? q.get('argobgc') === 'true' : false,
			argodeep: q.has('argodeep') ? q.get('argodeep') === 'true' : false,
			argoPlatformSuggestions: [],
			argoPlatform: q.has('argoPlatform') ? q.get('argoPlatform') : '',
			refreshData: true,
			points: [],
			polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : [],
			maxDayspan: q.has('polygon') ? helpers.calculateDayspan.bind(this)(JSON.parse(q.get('polygon'))) : this.defaultDayspan,
			urls: []
		}

		helpers.mungeTime.bind(this)(q, this.state.maxDayspan)

        // if no query string specified at all or no categories selected turn on all argo categories
        if(!window.location.search || !q.has('argocore') && !q.has('argobgc') && !q.has('argodeep') ){
        	console.log('imposing defaults')
        	this.state.argocore = true
        	this.state.argobgc = true
        	this.state.argodeep = true
        }

        // some other useful class variables
        this.fgRef = React.createRef()
        this.formRef = React.createRef()
		this.statusReporting = React.createRef()
        //this.apiPrefix = 'https://argovis-api.colorado.edu/'
        this.apiPrefix = 'http://3.88.185.52:8080/'
        this.vocab = {}
        this.dataset = 'argo'
        this.customQueryParams = ['argocore', 'argobgc', 'argodeep', 'argoPlatform']

        // populate vocabularies, and trigger first render
        fetch(this.apiPrefix + 'argo/vocabulary?parameter=platform', {headers:{'x-argokey': this.state.apiKey}})
        .then(response => response.json())
        .then(data => {
        	this.vocab['argoPlatform'] = data
        	this.setState({refreshData:true})
        })
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	helpers.componentDidUpdate.bind(this)()
    }

    lookingForEntity(){
    	// return true if any token, valid or not, is specified for any entity query string parameter
    	return Boolean(this.state.argoPlatform)
    }

    generateURLs() {
    	if(this.state.argoPlatform !== ''){
    		return [this.apiPrefix +'argo?compression=minimal&platform=' + this.state.argoPlatform]
    	} else {

	    	let url = helpers.generateTemporoSpatialURL.bind(this)('argo')	

	    	// decide on source.source
	    	let source = []
	    	if(!this.state.argocore && !this.state.argobgc && !this.state.argodeep){
	    		return []
	    	} else if(this.state.argocore && this.state.argobgc && this.state.argodeep){
	    		source = ['argo_core']
	    	} else if(this.state.argocore && this.state.argobgc && !this.state.argodeep){
	    		source = ['argo_core,~argo_deep', 'argo_bgc']
	    	} else if(this.state.argocore && !this.state.argobgc && this.state.argodeep){
	    		source = ['argo_core,~argo_bgc', 'argo_deep']
	    	} else if(!this.state.argocore && this.state.argobgc && this.state.argodeep){
	    		source = ['argo_bgc', 'argo_deep']
	    	} else if(this.state.argocore && !this.state.argobgc && !this.state.argodeep){
	    		source = ['argo_core,~argo_bgc,~argo_deep']
	    	} else if(!this.state.argocore && this.state.argobgc && !this.state.argodeep){
	    		source = ['argo_bgc']
	    	} else if(!this.state.argocore && !this.state.argobgc && this.state.argodeep){
	    		source = ['argo_deep']
	    	}

	    	if(source.length === 0){
	    		return [url]
	    	} else{
	    		return source.map(x => url+'&source='+x)
	    	}
	    }
    }

    chooseColor(datasources){
    	if(datasources.includes('argo_bgc')){
    		return 'green'
    	}
    	else if(datasources.includes('argo_deep')){
    		return 'blue'
    	}
    	else if(datasources.includes('argo_core')){
	    	return 'yellow'
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
		      Data Sources: {point[4]} <br />
		      <a target="_blank" rel="noreferrer" href={'/plots?argoPlatform='+point[0].split('_')[0]}>Profile Page</a>
		    </Popup>
    	)
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
								<h5>Explore Argo Profiles</h5>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
										<input type="password" className="form-control" id="apiKey" placeholder="" onInput={(v) => helpers.setToken.bind(this)('apiKey', v.target.value)}></input>
										<label htmlFor="apiKey">API Key</label>
										<div id="apiKeyHelpBlock" className="form-text">
						  					<a target="_blank" rel="noreferrer" href='https://argovis-keygen.colorado.edu/'>Get a free API key</a>
										</div>
									</div>
									<h6>Time range</h6>
									<div className="form-floating mb-3">
										<input type="date" disabled={this.state.observingEntity} className="form-control" id="startDate" value={this.state.startDate} placeholder="" onChange={(v) => helpers.setDate.bind(this)('startDate', v.target.valueAsNumber, this.state.maxDayspan, false)}></input>
										<label htmlFor="startDate">Start Date</label>
									</div>
									<div className="form-floating mb-3">
										<input type="date" disabled={this.state.observingEntity} className="form-control" id="endDate" value={this.state.endDate} placeholder="" onChange={(v) => helpers.setDate.bind(this)('endDate', v.target.valueAsNumber, this.state.maxDayspan, false)}></input>
										<label htmlFor="endDate">End Date</label>
									</div>
									<div id="dateRangeHelp" className="form-text">
					  					<p>Max day range: {this.state.maxDayspan+1}</p>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6>Subsets</h6>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.argocore} onChange={(v) => helpers.toggle.bind(this)(v, 'argocore')} type="checkbox" id='argocore'></input>
										<label className="form-check-label" htmlFor='argocore'>Display Argo Core <span style={{'color':this.chooseColor(['argo_core']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.argobgc} onChange={(v) => helpers.toggle.bind(this)(v, 'argobgc')} type="checkbox" id='argobgc'></input>
										<label className="form-check-label" htmlFor='argobgc'>Display Argo BGC <span style={{'color':this.chooseColor(['argo_bgc']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.argodeep} onChange={(v) => helpers.toggle.bind(this)(v, 'argodeep')} type="checkbox" id='argodeep'></input>
										<label className="form-check-label" htmlFor='argodeep'>Display Argo Deep <span style={{'color':this.chooseColor(['argo_deep']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6>Object Filters</h6>
									<div className="form-floating mb-3">
			      						<Autosuggest
									      	id='argoPlatformAS'
									        suggestions={this.state.argoPlatformSuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'argoPlatformSuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'argoPlatformSuggestions')}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'argoPlatform')}
									        inputProps={{placeholder: 'Argo platform ID', value: this.state.argoPlatform, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of Argo platform ID', 'argoPlatform'), id: 'argoPlatform'}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
									</div>
									<div id="coloHelpBlock" className="form-text">
					  					<a target="_blank" rel="noreferrer" href='https://github.com/earthcube2022/ec22_mills_etal/blob/rc/WM_01_intro_to_argovis_api.ipynb'>Colocate Argo with other products</a>
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

export default ArgoExplore