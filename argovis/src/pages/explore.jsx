import React from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polygon, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'

class ArgovisExplore extends React.Component {
    constructor(props) {
      super(props);

      let q = new URLSearchParams(window.location.search)

      this.state = {
      	argoPlatform: q.has('argoPlatform') ? q.get('argoPlatform') : '',
      	apiKey: 'guest',
      	cchdoWOCE: q.has('cchdoWOCE') ? q.get('cchdoWOCE') : '',
      	cchdoCruise: q.has('cchdoCruise') ? q.get('cchdoCruise') : '',
       	drifterWMO: q.has('drifterWMO') ? q.get('drifterWMO') : '',
       	drifterPlatform: q.has('drifterPlatform') ? q.get('drifterPlatform') : '',
       	endDate: ['2012-01-11', '2012-01-11T00:00:00Z'],
       	points: {
       		'argo': [],
       		'cchdo': [],
       		'drifters': [],
       		'tc': []
       	},
       	polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : [], // [[lon0, lat0], [lon1, lat1], ..., [lonn,latn], [lon0,lat0]]
       	refreshData: true,
       	startDate: ['2012-01-01', '2012-01-01T00:00:00Z'],
       	tcName: q.has('tcName') ? q.get('tcName') : '',
       	argocore: q.has('argocore') ? q.get('argocore') === 'true' : false,
       	argobgc: q.has('argobgc') ? q.get('argobgc') === 'true' : false,
       	argodeep: q.has('argodeep') ? q.get('argodeep') === 'true' : false,
       	cchdo: q.has('cchdo') ? q.get('cchdo') === 'true' : false,
       	drifters: q.has('drifters') ? q.get('drifters') === 'true' : false,
       	tc: q.has('tc') ? q.get('tc') === 'true' : false,
       	urls: {
       		'argo': [],
       		'cchdo': [],
       		'drifters': [],
       		'tc': []
       	},
       	/////////////
       	suggestions:[]
       	/////////////
      }

      if(q.has('endDate') && q.has('startDate')){
      	this.state.startDate = [q.get('startDate'), q.get('startDate')+'T00:00:00Z'] 
      	this.state.endDate = [q.get('endDate'), q.get('endDate')+'T00:00:00Z'] 
      } else {
	      let last = new Date()
  	    let first = new Date(last.getTime() - (10 * 24 * 60 * 60 * 1000));
  	    this.state.startDate = [first.toISOString().slice(0,10), first.toISOString().slice(0,-5)+'Z']
  	    this.state.endDate = [last.toISOString().slice(0,10), last.toISOString().slice(0,-5)+'Z']
      }

      if(!window.location.search){
      	console.log('imposing defaults')
      	this.state.argocore = true
      	this.state.argobgc = true
      	this.state.argodeep = true
      }

      this.fgRef = React.createRef()
      this.fieldNames = {
      	'argoPlatform': 'Argo Platform ID',
      	'cchdoWOCE': 'CCHDO WOCE line',
      	'cchdoCruise': 'CCHDO Cruise No.',
      	'drifterWMO': 'WMO ID',
      	'drifterPlatform': 'Platform ID',
      	'tcName': 'Tropical Cyclone name'

      }
      this.statusReporting = React.createRef()
      //this.apiPrefix = 'https://argovis-api.colorado.edu/'
      this.apiPrefix = 'http://3.88.185.52:8080/'
      this.vocab = {}

			this.setQueryString()

      this.componentDidUpdate()

      fetch(this.apiPrefix + 'argo/vocabulary?parameter=platform', {headers:{'x-argokey': this.state.apiKey}})
      .then(response => response.json())
      .then(data => this.vocab['argoPlatform'] = data)
    }
    //////////////////////////
		getSuggestions = value => {
		  const inputValue = value.trim().toLowerCase();
		  const inputLength = inputValue.length;

		  return inputLength === 0 ? [] : this.vocab['argoPlatform'].filter(argoPlatform =>
		    argoPlatform.toLowerCase().slice(0, inputLength) === inputValue
		  );
		};
		getSuggestionValue = suggestion => suggestion;
		renderSuggestion = suggestion => (
		  <div>
		    {suggestion}
		  </div>
		);
	  onChange = (event, { newValue }) => {
	    // this.setState({
	    //   argoPlatform: newValue
	    // });
	    this.setToken('argoPlatform', {target:{value:newValue}})

	  };
	  onSuggestionsFetchRequested = ({ value }) => {
	    this.setState({
	      suggestions: this.getSuggestions(value)
	    });
	  };
	  onSuggestionsClearRequested = () => {
	    this.setState({
	      suggestions: []
	    });
	  };
    /////////////////////
    componentDidUpdate(prevProps, prevState, snapshot){
    	if(this.state.refreshData){
    		if(this.statusReporting.current){
					helpers.manageStatus.bind(this)('downloading')
				}
				// reformualte all URLs
				let urls = {
					'argo': this.generateArgoURLs(),
					'cchdo': this.generateCCHDOURLs(),
					'drifters':  this.generateDrifterURLs(),
					'tc': this.generateTCURLs()
				}
				let refresh = []

				//compare new URLs to old URLs; any that are new, add them to a to-be-updated list, and update urls in state
				for(let dataset in urls){
					let refetch = false
					if(JSON.stringify(urls[dataset].sort())!==JSON.stringify(this.state.urls[dataset].sort())){
						refetch = true
					}
					if(urls[dataset].length === 0){
						// eslint-disable-next-line
						this.state.points[dataset] = []
						refetch = true
					}
					if(refetch){
						refresh = refresh.concat(urls[dataset])
						// eslint-disable-next-line
						this.state.urls[dataset] = urls[dataset]
					}
				}
				if(refresh.length === 0){
					helpers.manageStatus.bind(this)('ready')
					if(this.state.points.length>0){
						this.refreshMap(false)
					}
				} else {
					//promise all across a `fetch` for all new URLs, and update CircleMarkers for all new fetches
					Promise.all(refresh.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
						let datasets = responses.map(x => this.findDataset(x.url))
						Promise.all(responses.map(res => res.json())).then(data => {
							let newPoints = {}
							if(data.length>0 && data[0][0].code !== 404){
								for(let i=0; i<data.length; i++){
									let points = data[i].map(x => x.concat([datasets[i]])) // so there's something in the source position for everything other than argo
									points = this.circlefy(points)
									if(points){
										if(newPoints.hasOwnProperty(datasets[i])){
											newPoints[datasets[i]] = newPoints[datasets[i]].concat(points)
										} else {
											newPoints[datasets[i]] = points
										}
									}
								}
							}
							// eslint-disable-next-line
							this.state.points = {...this.state.points, ...newPoints}
							helpers.manageStatus.bind(this)('rendering')
							if(Object.keys(newPoints).length>0){
								this.refreshMap(false)
							}
						})
					})
				}
			}
			this.setQueryString()
    }

    setQueryString(){
      let queryManagement = new URL(window.location)

      queryManagement.searchParams.set('startDate', this.state.startDate[0])
     	queryManagement.searchParams.set('endDate', this.state.endDate[0])

      let qparams = ['argocore', 'argobgc', 'argodeep', 'cchdo', 'drifters', 'tc', 'cchdoWOCE', 'cchdoCruise', 'argoPlatform', 'drifterWMO', 'drifterPlatform', 'tcName']
      for(let i=0; i<qparams.length; i++){
      	if(this.state[qparams[i]]){
      		queryManagement.searchParams.set(qparams[i], this.state[qparams[i]])
      	} else{
      		queryManagement.searchParams.delete(qparams[i])
      	}
      } 

      if(JSON.stringify(this.state.polygon) !== '[]'){
      	queryManagement.searchParams.set('polygon', JSON.stringify(this.state.polygon))
      } else {
      	queryManagement.searchParams.delete('polygon')
      }
      window.history.pushState(null, '', queryManagement.toString());
    }

    // input handlers
    toggle(v){
    	let s = {...this.state}
    	s[v.target.id] = !s[v.target.id]
    	s.refreshData = true
    	this.setState(s)
    }

    setDate(date, v){
    	// when setting dates from the UI, don't let the user ask for a timespan longer than some cutoff. 
    	// If they do, move the other time bound to match.
    	let start = new Date(this.state.startDate[0])
    	let end = new Date(this.state.endDate[0])
    	let delta = end.getTime() - start.getTime()
    	let cutoff = 10*24*60*60*1000
    	if(isNaN(v.target.valueAsNumber)){
    		console.log('undefined time', v.target.valueAsNumber)
    		return
    	} else{
    		if(date === 'startDate'){
		    	start = new Date(v.target.valueAsNumber)
		    	if(end.getTime() - start.getTime() > cutoff){
		    		end = new Date(v.target.valueAsNumber + cutoff)
		    	} else if (start.getTime() > end.getTime()){
		    		end = new Date(v.target.valueAsNumber + delta)
		    	}  	
		    } else if(date === 'endDate'){
		    	end = new Date(v.target.valueAsNumber)
		    	if(end.getTime() - start.getTime() > cutoff){
		    		start = new Date(v.target.valueAsNumber - cutoff)
		    	} else if (start.getTime() > end.getTime()){
		    		start = new Date(v.target.valueAsNumber - delta)
		    	}  	
		    }
		    start = start.toISOString().replace('.000Z', 'Z')
		   	end = end.toISOString().replace('.000Z', 'Z')
	    }
	    let s = {...this.state}
	    s.startDate = [start.slice(0,10), start]
	    s.endDate = [end.slice(0,10), end]
	    s.refreshData = true
	    this.setState(s)
    }

    setToken(key, v){
    	let s = {...this.state}
  	  s[key] = v.target.value
    	if(v.target.value && !this.vocab[key].includes(v.target.value)){
    		helpers.manageStatus.bind(this)('error', this.fieldNames[key])
    		s.refreshData = false
	    } else {
    		s.refreshData = true
    	}
    	this.setState(s)
    }

    refreshMap(needNewData){
  		if(needNewData){
    		helpers.manageStatus.bind(this)('downloading')
    	} else {
    		helpers.manageStatus.bind(this)('rendering')
    	}

    	this.setState({refreshData: needNewData}, () => {
				helpers.manageStatus.bind(this)('ready')
			})
    }

    // API URL generation
    generateTemporoSpatialURL(route){
    	//returns the api root, compression, time and space filters common to all endpoint queries

    	let url = this.apiPrefix + route + '?compression=minimal'

    	if(this.state.startDate !== ''){
    		url += '&startDate=' + this.state.startDate[1]
    	}

    	if(this.state.endDate !== ''){
    		url += '&endDate=' + this.state.endDate[1]
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

    generateCCHDOURLs() {
    	if(!this.state.cchdo){
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
    	if(!this.state.drifters){
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
    	if(!this.state.tc){
    		return []
    	}

    	let url = this.generateTemporoSpatialURL('tc')

    	if(this.state.tcName !== ''){
    		url += '&name=' + this.state.tcName
    	}

    	return [url]
    }	

    // leaflet helpers
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
	    else if(datasources.includes('drifters')){
	    	return 'black'
	    }
	    else if(datasources.includes('cchdo')){
	    	return 'grey'
	    }
	    else if(datasources.includes('tc')){
	    	return 'red'
	    }
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

    circlefy(points){
			if(points.hasOwnProperty('code') || points[0].hasOwnProperty('code')){
				return null
			}
			else {
				points = points.map(point => {return(
				  <CircleMarker key={point[0]+Math.random()} center={[point[2], point[1]]} radius={1} color={this.chooseColor(point[4])}>
				    <Popup>
				      ID: {point[0]} <br />
				      Long / Lat: {point[1]} / {point[2]} <br />
				      Date: {point[3]} <br />
				      Data Sources: {point[4]}
				    </Popup>
				  </CircleMarker>
				)})
				return points
			}
    }

    // misc helpers
    findDataset(url){
    	return url.slice(url.search('(?<='+this.apiPrefix+')'), url.search('(?=comp)')-1 )
    }

	render(){

    const inputProps = {
      placeholder: 'Argo platform ID',
      value: this.state.argoPlatform,
      onChange: this.onChange
    };

		return(
			<div>
				<div className='row'>
					
					{/*search option sidebar*/}
					<div className='col-3 overflow-auto'>
						<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
						<div className='mapSearchInputs'>
							<h5>Search Control</h5>
							<div className='verticalGroup'>
								<div className="form-floating mb-3">
									<input type="date" className="form-control" id="startDate" value={this.state.startDate[0]} placeholder="" onChange={(v) => this.setDate('startDate', v)}></input>
									<label htmlFor="startDate">Start Date</label>
								</div>
								<div className="form-floating mb-3">
									<input type="date" className="form-control" id="endDate" value={this.state.endDate[0]} placeholder="" onChange={(v) => this.setDate('endDate', v)}></input>
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
											<input className="form-check-input" checked={this.state.argocore} onChange={(v) => this.toggle(v)} type="checkbox" id='argocore'></input>
											<label className="form-check-label" htmlFor='Argo Core'>Display Argo Core</label>
										</div>
									    <div className="form-check">
											<input className="form-check-input" checked={this.state.argobgc} onChange={(v) => this.toggle(v)} type="checkbox" id='argobgc'></input>
											<label className="form-check-label" htmlFor='Argo BGC'>Display Argo BGC</label>
										</div>
						        		<div className="form-check">
											<input className="form-check-input" checked={this.state.argodeep} onChange={(v) => this.toggle(v)} type="checkbox" id='argodeep'></input>
											<label className="form-check-label" htmlFor='Argo Deep'>Display Argo Deep</label>
										</div>
									</div>
									<div className='verticalGroup'>
										<div className="form-floating mb-3">
									      <Autosuggest
									      	id='argoPlatform'
									        suggestions={this.state.suggestions}
									        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested}
									        onSuggestionsClearRequested={this.onSuggestionsClearRequested}
									        getSuggestionValue={this.getSuggestionValue}
									        renderSuggestion={this.renderSuggestion}
									        inputProps={inputProps}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
									      />
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
											<input className="form-check-input" checked={this.state.cchdo} onChange={(v) => this.toggle(v)} type="checkbox" id='cchdo'></input>
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
											<input className="form-check-input" checked={this.state.drifters} onChange={(v) => this.toggle(v)} type="checkbox" id='drifters'></input>
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
											<input className="form-check-input" checked={this.state.tc} onChange={(v) => this.toggle(v)} type="checkbox" id='tc'></input>
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
						  {this.state.points.argo}
						  {this.state.points.cchdo}
						  {this.state.points.drifters}
						  {this.state.points.tc}
						</MapContainer>
					</div>
				</div>
			</div>
		)
	}
}

export default ArgovisExplore