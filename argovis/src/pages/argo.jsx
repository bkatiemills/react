import React from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup, Popup, CircleMarker} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';


class ArgoExplore extends React.Component {

	constructor(props) {
		document.title = 'Argovis - Explore Argo profiles'
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
			apiKey: localStorage.getItem('apiKey') ? localStorage.getItem('apiKey') : 'guest',
			argocore: q.has('argocore') ? q.get('argocore') === 'true' : false,
			argobgc: q.has('argobgc') ? q.get('argobgc') === 'true' : false,
			argodeep: q.has('argodeep') ? q.get('argodeep') === 'true' : false,
			argoPlatformSuggestions: [],
			argoPlatform: q.has('argoPlatform') ? q.get('argoPlatform') : '',
			points: [],
            data: [[]],
			polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : [],
			interpolated_polygon: q.has('polygon') ? helpers.insertPointsInPolygon(JSON.parse(q.get('polygon'))) : [],
			urls: [],
			depthRequired: q.has('depthRequired') ? parseFloat(q.get('depthRequired')) : 0,
			centerlon: q.has('centerlon') ? parseFloat(q.get('centerlon')) : -160,
			mapkey: Math.random(),
			nCore: 0,
			nBGC: 0,
			nDeep: 0,
            phase: 'refreshData',
		}

		this.state.maxDayspan = helpers.calculateDayspan.bind(this)(this.state)

		helpers.mungeTime.bind(this)(q, this.state.maxDayspan)

        // if no query string specified at all or no categories selected turn on all argo categories
        if(!window.location.search || (!q.has('argocore') && !q.has('argobgc') && !q.has('argodeep')) ){
        	console.log('imposing defaults')
        	this.state.argocore = true
        	this.state.argobgc = true
        	this.state.argodeep = true
        }

        // some other useful class variables
        this.fgRef = React.createRef()
        this.formRef = React.createRef()
        this.platformRef = React.createRef()
		this.statusReporting = React.createRef()
		this.reautofocus = null
        this.apiPrefix = 'https://argovis-api.colorado.edu/'
        this.vocab = {}
        this.dataset = 'argo'
        this.customQueryParams = ['startDate', 'endDate', 'polygon', 'argocore', 'argobgc', 'argodeep', 'argoPlatform', 'depthRequired', 'centerlon']
        
        // get initial data
        this.state.urls = this.generateURLs(this.state.argoPlatform, this.state.argocore, this.state.argobgc, this.state.argodeep, this.state.startDate, this.state.endDate, this.state.polygon, this.state.depthRequired)
        this.downloadData()

        // populate vocabularies for UI
        let vocabURLs = [this.apiPrefix + 'argo/vocabulary?parameter=platform', this.apiPrefix + 'argo/overview']
		Promise.all(vocabURLs.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
			Promise.all(responses.map(res => res.json())).then(data => {
				if(data[0].hasOwnProperty('code') && data[0].code === 401){
					helpers.manageStatus.bind(this)('error', 'Invalid API key; see the "Get a free API key" link below.')
				} else {
					this.vocab['argoPlatform'] = data[0]
					this.setState({
						nCore: data[1][0].summary.nCore,
						nBGC: data[1][0].summary.nBGC,
						nDeep: data[1][0].summary.nDeep
					})
				}
			})
		})

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
        let points = []

        if(!(JSON.stringify(this.state.data) === '[[]]' || JSON.stringify(this.state.data) === '[]' || this.state.data.hasOwnProperty('code') || this.state.data[0].hasOwnProperty('code'))){
            for(let i=0; i<this.state.data.length; i++){
                let newpoints = this.state.data[i].map(point => {return(
                    <CircleMarker key={point[0]+Math.random()} center={[point[2], helpers.mutateLongitude(point[1], parseFloat(this.state.centerlon)) ]} radius={2} color={this.chooseColor(point)}>
                        {this.genTooltip.bind(this)(point)}
                    </CircleMarker>
                  )})
                points = points.concat(newpoints)
            }
        }

        this.setState({ 
            points: points, 
            phase: 'idle'
        })
    }

    generateURLs(argoPlatform, argocore, argobgc, argodeep, startDate, endDate, polygon, depthRequired){
        if(argoPlatform !== ''){
    		return [this.apiPrefix +'argo?compression=minimal&platform=' + argoPlatform]
    	} else {

	    	let url = helpers.generateTemporoSpatialURL.bind(this)(this.apiPrefix, 'argo', startDate, endDate, polygon, depthRequired)	

	    	// decide on source.source
	    	let source = []
	    	if(!argocore && !argobgc && !argodeep){
	    		return []
	    	} else if(argocore && argobgc && argodeep){
	    		source = ['argo_core']
	    	} else if(argocore && argobgc && !argodeep){
	    		source = ['argo_core,~argo_deep', 'argo_bgc']
	    	} else if(argocore && !argobgc && argodeep){
	    		source = ['argo_core,~argo_bgc', 'argo_deep']
	    	} else if(!argocore && argobgc && argodeep){
	    		source = ['argo_bgc', 'argo_deep']
	    	} else if(argocore && !argobgc && !argodeep){
	    		source = ['argo_core,~argo_bgc,~argo_deep']
	    	} else if(!argocore && argobgc && !argodeep){
	    		source = ['argo_bgc']
	    	} else if(!argocore && !argobgc && argodeep){
	    		source = ['argo_deep']
	    	}

	    	if(source.length === 0){
	    		url = [url]
	    	} else{
	    		url = source.map(x => url+'&source='+x)
	    	}

	    	return url
	    }
    }








    // componentDidUpdate(prevProps, prevState, snapshot){
    // 	helpers.componentDidUpdate.bind(this)()
    // }

	refreshMap(state){
		helpers.refreshMap.bind(this)(state)
	}

    lookingForEntity(state){
    	// return true if any token, valid or not, is specified for any entity query string parameter
    	return Boolean(state.argoPlatform)
    }

	mapmarkers(points, state){
		return helpers.circlefy.bind(this)(points, state)
	}

    chooseColor(point){
    	if(point[4].includes('argo_bgc')){
    		return 'green'
    	}
    	else if(point[4].includes('argo_deep')){
    		return 'blue'
    	}
    	else if(point[4].includes('argo_core')){
	    	return 'yellow'
	    }
    }

    genTooltip(point){
    	// given an array <point> corresponding to a single point returned by an API data route with compression=minimal,
    	// return the jsx for an appropriate tooltip for this point.

    	let regionLink = helpers.genRegionLink(this.state.polygon, this.state.startDate, this.state.endDate, this.state.centerlon, 'argo')

    	return(
		    <Popup>
		      ID: {point[0]} <br />
		      Long / Lat: {helpers.mungePrecision(point[1])} / {helpers.mungePrecision(point[2])} <br />
		      Date: {point[3]} <br />
		      Data Sources: {point[4].join(', ')} <br />
		      <a target="_blank" rel="noreferrer" href={'/plots/argo?showAll=true&argoPlatform='+point[0].split('_')[0]+'&centerlon='+this.state.centerlon}>Platform Page</a><br />
		      <a target="_blank" rel="noreferrer" href={'/plots/argo?argoPlatform='+point[0].split('_')[0]+'&counterTraces=["'+point[0]+'"]&centerlon='+this.state.centerlon}>Profile Page</a>
		      {regionLink}
		    </Popup>
    	)
    }

    dateRangeMultiplyer(s){
    	// allowed date range will be multiplied by this much, as a function of the mutated state s
    	let m = 1
    	if(!s.argocore){
    		m = 5 // 5x date range when not asking for core.
    	}
    	return m
    }

    toggleCoupling(s){
    	// if changing a toggle for this page needs to trigger a side effect on state, do so here.

    	s.maxDayspan = helpers.calculateDayspan.bind(this)(s)

    	return s
    }

    changeDates(date, e){
        let daterange = helpers.setDate.bind(this)(date, e.target.valueAsNumber, this.state.maxDayspan)
        let s = {...this.state}
        s.startDate = daterange[0]
        s.endDate = daterange[1]
        s.phase = 'refreshData'
        s.urls = this.generateURLs(s.argoPlatform, s.argocore, s.argobgc, s.argodeep, daterange[0], daterange[1], s.polygon, s.depthRequired)

        this.setState(s)
    }

    changeDepth(e){
        this.setState({
            depthRequired:e.target.value, 
            phase: 'refreshData',
            urls: this.generateURLs(this.state.argoPlatform, this.state.argocore, this.state.argobgc, this.state.argodeep, this.state.startDate, this.state.endDate, this.state.polygon, e.target.value)
        })
    }

    inputPlatform(fieldID, ref, event, change){
        // autosuggest management

        if(change.newValue !== ''){
            this.reautofocus = ref
        } else {
            this.reautofocus = null
        }

        let s = {...this.state}
        s[fieldID] = change.newValue
        s.observingEntity = Boolean(change.newValue)

        this.changePlatform(fieldID, s, event)
    }

    changePlatform(fieldID, interimState, event){
        // actually go looking for a platform on not-a-kwystroke events, or hits enter, and only if the specified platform is valid

        if( !event.hasOwnProperty('key') || 
            (event.hasOwnProperty('key') && event.key === 'Enter')){
            if(this.vocab.argoPlatform.includes(interimState[fieldID]) ){
                interimState.urls = this.generateURLs(interimState[fieldID], interimState.argocore, interimState.argobgc, interimState.argodeep, interimState.startDate, interimState.endDate, interimState.polygon, interimState.depthRequired)
                interimState.phase = 'refreshData'
            } else if(interimState[fieldID] == '' && (event.type === 'blur' || event.type === 'keypress')){
                interimState.urls = this.generateURLs(interimState.argoPlatform, interimState.argocore, interimState.argobgc, interimState.argodeep, interimState.startDate, interimState.endDate, interimState.polygon, interimState.depthRequired)
                interimState.phase = 'refreshData'
            }
        }
    
        this.setState(interimState)
    }

    toggleArgoProgram(program){
    	let s = {...this.state}
        
        s[program] = !s[program]
        s.urls = this.generateURLs(s.argoPlatform, s.argocore, s.argobgc, s.argodeep, s.startDate, s.endDate, s.polygon, s.depthRequired)
        s.phase = 'refreshData'

        this.setState(s)
    }    

    onPolyCreate(p){
    
        // make a ring, insert extra points, and redraw the polygon
        let original_vertexes = p.layer.getLatLngs()[0].map(x => [x['lng'], x['lat']])
        original_vertexes.push(original_vertexes[0])
        let vertexes = original_vertexes.slice(0, original_vertexes.length-1)
        vertexes = helpers.insertPointsInPolygon(vertexes)
        p.layer.setLatLngs(vertexes.map(x => ({'lng': x[0], 'lat': x[1]})))
       
        let s = {...this.state}
        s.polygon = original_vertexes // use these to search mongo
        s.interpolated_polygon = vertexes // use these to draw something in leaflet that roughly resembles the mongo search region
    
        let maxdays = helpers.calculateDayspan.bind(this)(s)
        s.maxDayspan = maxdays
    
        if(maxdays < this.state.maxDayspan){
            // rethink the end date in case they drew a bigger polygon and the date range needs to be forcibly contracted
            let timebox = helpers.setDate.bind(this)('startDate', document.getElementById('startDate').valueAsNumber, maxdays)
            s.endDate = timebox[1]
        }
        s.phase = 'refreshData'
        s.urls = this.generateURLs(s.argoPlatform, s.argocore, s.argobgc, s.argodeep, s.startDate, s.endDate, s.polygon, s.depthRequired)
    
        this.setState(s)
    }

    onPolyDelete(defaultPoly){

        this.setState({
            polygon: defaultPoly, 
            interpolated_polygon: helpers.insertPointsInPolygon(defaultPoly), 
            maxDayspan: this.defaultDayspan, 
            urls: this.generateURLs(this.state.argoPlatform, this.state.argocore, this.state.argobgc, this.state.argodeep, this.state.startDate, this.state.endDate, defaultPoly, this.state.depthRequired),
            phase: 'refreshData'
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
												The Argo array is a collection of autonomous profiling floats measuring physical and biogeochmeical properties across the ocean. Narrow down your search using the form below, or specify a geographic region by first clicking on the pentagon button in the top left of the map, then choosing the vertexes of your region of interest. Click on points that appear to see links to more information.
											</Tooltip>
										}
										trigger="click"
									>
										<i style={{'float':'right'}} className="fa fa-question-circle" aria-hidden="true"></i>
                                    </OverlayTrigger>
									Explore Argo Profiles	
								</h5>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
										<input type="password" className="form-control" id="apiKey" value={this.state.apiKey} placeholder="" onInput={(v) => helpers.setToken.bind(this)('apiKey', v.target.value, null, true)}></input>
										<label htmlFor="apiKey">API Key</label>
										<div id="apiKeyHelpBlock" className="form-text">
						  					<a target="_blank" rel="noreferrer" href='https://argovis-keygen.colorado.edu/'>Get a free API key</a>
										</div>
									</div>

									<h6>Time range</h6>
									<div className="form-floating mb-3">
										<input 
											type="date" 
											disabled={this.state.observingEntity} 
											className="form-control" 
											id="startDate" 
											value={this.state.startDate} 
											placeholder="" 
                                            onChange={e => {this.setState({startDate:e.target.value, phase: 'awaitingUserInput'})}} 
                                            onBlur={e => {this.changeDates.bind(this)('startDate', e)}}
                                            onKeyPress={e => {if(e.key==='Enter'){this.changeDates.bind(this)('startDate', e)}}}
										/>
										<label htmlFor="startDate">Start Date</label>
									</div>
									<div className="form-floating mb-3">
										<input 
											type="date" 
											disabled={this.state.observingEntity} 
											className="form-control" 
											id="endDate" 
											value={this.state.endDate} 
											placeholder="" 
                                            onChange={e => {this.setState({endDate:e.target.value, phase: 'awaitingUserInput'})}} 
                                            onBlur={e => {this.changeDates.bind(this)('endDate', e)}}
                                            onKeyPress={e => {if(e.key==='Enter'){this.changeDates.bind(this)('endDate', e)}}}
										/>
										<label htmlFor="endDate">End Date</label>
									</div>
									<div id="dateRangeHelp" className="form-text">
					  					<p>Max day range: {this.state.maxDayspan+1}</p>
									</div>

									<h6>Depth</h6>
									<div className="form-floating mb-3">
										<input 
											id="depth"
											type="text"
											disabled={this.state.observingEntity} 
											className="form-control" 
											placeholder="0" 
											value={this.state.depthRequired} 
                                            onChange={e => {this.setState({depthRequired:e.target.value, phase: 'awaitingUserInput'})}} 
											onBlur={e => {this.changeDepth.bind(this)(e)}}
                                            onKeyPress={e => {if(e.key==='Enter'){this.changeDepth.bind(this)(e)}}}
											aria-label="depthRequired" 
											aria-describedby="basic-addon1"/>
										<label htmlFor="depth">Require levels deeper than [m]:</label>
									</div>

									<h6>Map Center Longitude</h6>
									<div className="form-floating mb-3">
										<input 
											id="centerlon"
											type="text"
											disabled={this.state.observingEntity} 
											className="form-control" 
											placeholder="0" 
											value={this.state.centerlon} 
                                            onChange={e => {this.setState({centerlon:e.target.value, phase: 'awaitingUserInput'})}} 
											onBlur={e => {
												this.setState({centerlon: helpers.manageCenterlon(e.target.value), mapkey: Math.random(), phase: 'remapData'})
											}}
											onKeyPress={e => {
												if(e.key==='Enter'){
													this.setState({centerlon: helpers.manageCenterlon(e.target.value), mapkey: Math.random(), phase: 'remapData'})
												}
											}}
											aria-label="centerlon" 
											aria-describedby="basic-addon1"/>
										<label htmlFor="depth">Center longitude on [-180,180]</label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6>Subsets</h6>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.argocore} onChange={(v) => this.toggleArgoProgram.bind(this)('argocore')} type="checkbox" id='argocore'></input>
										<label className="form-check-label" htmlFor='argocore'>Display Argo Core <span style={{'color':this.chooseColor([null,null,null,null,['argo_core']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.argobgc} onChange={(v) => this.toggleArgoProgram.bind(this)('argobgc')} type="checkbox" id='argobgc'></input>
										<label className="form-check-label" htmlFor='argobgc'>Display Argo BGC <span style={{'color':this.chooseColor([null,null,null,null,['argo_bgc']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.argodeep} onChange={(v) => this.toggleArgoProgram.bind(this)('argodeep')} type="checkbox" id='argodeep'></input>
										<label className="form-check-label" htmlFor='argodeep'>Display Argo Deep <span style={{'color':this.chooseColor([null,null,null,null,['argo_deep']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6>Object Filters</h6>
									<div className="form-floating mb-3">
			      						<Autosuggest
									      	id='argoPlatformAS'
									      	ref={this.platformRef}
									        suggestions={this.state.argoPlatformSuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'argoPlatformSuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'argoPlatformSuggestions')}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'argoPlatform')}
									        inputProps={{
                                                placeholder: 'Argo platform ID', 
                                                value: this.state.argoPlatform, 
                                                onKeyPress:this.changePlatform.bind(this, 'argoPlatform', this.state),  
                                                onBlur:this.changePlatform.bind(this, 'argoPlatform', this.state), 
                                                onChange: this.inputPlatform.bind(this, 'argoPlatform', this.platformRef), 
                                                id: 'argoPlatform'
                                            }}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
									</div>
									<a className="btn btn-primary" href="/argo" role="button">Reset Map</a>
								</div>

								<div className='verticalGroup'>
									<h6>Database stats</h6>
									<span>Number of core profiles: {this.state.nCore}</span><br/>
									<span>Number of BGC profiles: {this.state.nBGC}</span><br/>
									<span>Number of deep profiles: {this.state.nDeep}</span><br/>
									<span><i>Argo data is synced nightly from IFREMER</i></span>
								</div>
							</div>
						</fieldset>
					</div>

					{/*leaflet map*/}
					<div className='col-lg-9'>
						<MapContainer key={this.state.mapkey} center={[25, parseFloat(this.state.centerlon)]} maxBounds={[[-90,this.state.centerlon-180],[90,this.state.centerlon+180]]} zoomSnap={0.01} zoomDelta={1} zoom={2.05} minZoom={2.05} scrollWheelZoom={true}>
							<TileLayer
							attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
							url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
							/>
							<FeatureGroup ref={this.fgRef}>
								<EditControl
								position='topleft'
								onCreated={p => this.onPolyCreate.bind(this)(p)}
								onDeleted={p => this.onPolyDelete.bind(this)([],p)}
								onDrawStop={p => helpers.onDrawStop.bind(this)(p)}
								onDrawStart={p => helpers.onDrawStart.bind(this)(p)}
								draw={{
									rectangle: false,
									circle: false,
									polyline: false,
									circlemarker: false,
									marker: false,
									polygon: this.state.observingEntity ? false: {
										shapeOptions: {
											fillOpacity: 0
										}
									}
								}}
								edit={{
									edit: false
								}}
								/>
								<Polygon key={Math.random()} positions={this.state.interpolated_polygon.map(x => [x[1],x[0]])} fillOpacity={0}></Polygon>
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