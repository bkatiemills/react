import React from 'react';
import { MapContainer, TileLayer, Popup, CircleMarker, Polygon, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'

class ArgovisExplore extends React.Component {
		// top level element for the Argovis landing page
    constructor(props) {
      super(props);

      let q = new URLSearchParams(window.location.search) // parse out query string
      document.title = 'Argovis - Colocate datasets'

			// limits for polygon / time coupling
			this.minDays = 10
			this.maxDays = 365
			this.minArea = 1000000
			this.maxArea = 10000000
			this.defaultDayspan = 10
			this.defaultPolygon = [[-100.37109375,24.49248193841918],[-97.55859375000001,32.662809707774706],[-88.06640625000001,34.130298918618614],[-81.38671875000001,34.130298918618614],[-76.46484375000001,27.80539400261969],[-76.11328125000001,22.396132592320402],[-85.42968750000001,14.397794716268102],[-95.27343750000001,17.607725265457233],[-100.37109375,24.49248193841918]]
			this.defaultDayspan = helpers.calculateDayspan.bind(this)({'polygon':this.defaultPolygon})

      this.state = {
      	apiKey: localStorage.getItem('apiKey') ? localStorage.getItem('apiKey') : 'guest',					// user's API key, if provided
       	points: {									// arrays of points to paint for each dataset
       		'argo': [],
       		'cchdo': [],
       		'drifters': [],
       		'tc': []
       	},
       	urls: {										// URLs to query for each dataset
       		'argo': [],
       		'cchdo': [],
       		'drifters': [],
       		'tc': []
       	},
       	maxDayspan: q.has('polygon') ? helpers.calculateDayspan.bind(this)( {'polygon':JSON.parse(q.get('polygon'))} ) : this.defaultDayspan,
       	polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : this.defaultPolygon, // [[lon0, lat0], [lon1, lat1], ..., [lonn,latn], [lon0,lat0]]
       	refreshData: true,
       	argocore: q.has('argocore') ? q.get('argocore') === 'true' : false,
       	argobgc: q.has('argobgc') ? q.get('argobgc') === 'true' : false,
       	argodeep: q.has('argodeep') ? q.get('argodeep') === 'true' : false,
       	woce: q.has('woce') ? q.get('woce') === 'true' : false,
       	goship: q.has('goship') ? q.get('goship') === 'true' : false,
       	cchdoother: q.has('cchdoother') ? q.get('cchdoother') === 'true' : false,
       	drifters: q.has('drifters') ? q.get('drifters') === 'true' : false,
       	tc: q.has('tc') ? q.get('tc') === 'true' : false,
       	centerlon: q.has('centerlon') ? q.get('centerlon') : 0
      }
      this.customQueryParams = ['startDate', 'endDate', 'polygon', 'argocore', 'argobgc', 'argodeep', 'cchdoother', 'woce', 'goship', 'drifters', 'tc', 'centerlon']

      helpers.mungeTime.bind(this)(q, this.state.maxDayspan+1) // +1 since we include the end date here.

      if(!window.location.search){
      	console.log('imposing defaults')
      	this.state.argocore = true
      	this.state.argobgc = true
      	this.state.argodeep = true
      	this.state.tc = true
      	this.state.startDate = '2020-08-01'
      	this.state.endDate = '2020-09-30'
      }

      this.formRef = React.createRef()
      this.fgRef = React.createRef()

      this.statusReporting = React.createRef()
      this.apiPrefix = 'https://argovisbeta01.colorado.edu/api/'
      this.vocab = {}

			helpers.setQueryString.bind(this)()
    }

    componentDidMount(){
    	this.componentDidUpdate()
    }

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
				let refresh = [] 		// list of urls that will actually need to be refreshed

				//compare new URLs to old URLs; any that are new, add them to a to-be-updated list, and update urls in state
				for(let dataset in urls){

					if(urls[dataset].length === 0){
						// no data for this dataset, turn it off and zero out its points
						// eslint-disable-next-line
						this.state.urls[dataset] = []
						this.state.points[dataset] = []
						continue
					}

					if(JSON.stringify(urls[dataset].sort())!==JSON.stringify(this.state.urls[dataset].sort())){
						// urls have changed and aren't blank, need to hit the api
						refresh = refresh.concat(urls[dataset])
						// eslint-disable-next-line
						this.state.urls[dataset] = urls[dataset]
					}
				}

				if(refresh.length === 0){
					helpers.manageStatus.bind(this)('ready')

					for(let i=0; i<Object.keys(this.state.rawPoints).length; i++){
						let dataset = Object.keys(this.state.rawPoints)[i]
						this.state.points[dataset] = helpers.circlefy.bind(this)(this.state.rawPoints[dataset])
					}

					helpers.refreshMap.bind(this)()
				} else {
					//promise all across a `fetch` for all new URLs, and update CircleMarkers for all new fetches
					Promise.all(refresh.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
						let datasets = responses.map(x => this.findDataset(x.url))
						Promise.all(responses.map(res => res.json())).then(data => {
							let newPoints = {}
							let newRawPoints = {}

							for(let i=0; i<data.length; i++){
								if(data[i].code === 429){
									console.log(429, urls)
									helpers.manageStatus.bind(this)('error', 'Too many requests too fast; please wait a minute, and consider using an API key (link below).')
									return
								}
								if(data.length>0 && data[i][0].code !== 404){
									let points = data[i].map(x => x.concat([datasets[i]])) // so there's something in the source position for everything other than argo
									let rawPoints = JSON.parse(JSON.stringify(points))
									points = helpers.circlefy.bind(this)(points)
									if(points){
										if(newPoints.hasOwnProperty(datasets[i])){
											newPoints[datasets[i]] = newPoints[datasets[i]].concat(points)
										} else {
											newPoints[datasets[i]] = points
										}

										// preserve these for reprocessing in case center longitude moves
										if(newRawPoints.hasOwnProperty(datasets[i])){
											newRawPoints[datasets[i]] = newRawPoints[datasets[i]].concat(rawPoints)
										} else {
											newRawPoints[datasets[i]] = rawPoints
										}
									}
								} else {
									newPoints[datasets[i]] = []
									newRawPoints[datasets[i]] = []
								}
							}

							// eslint-disable-next-line
							this.state.points = {...this.state.points, ...newPoints}
							this.state.rawPoints = {...this.state.rawPoints, ...newRawPoints}
							helpers.manageStatus.bind(this)('rendering')
							if(Object.keys(newPoints).length>0){
								helpers.refreshMap.bind(this)()
							}
						})
					})
				}
			}
			helpers.setQueryString.bind(this)()
    }

    lookingForEntity(){
    	return false
    }

    // input handlers
    toggle(v){
    	let nextState = {...this.state}
    	nextState[v.target.id] = !nextState[v.target.id]
      this.recalculateTemporospatialLimits.bind(this)(nextState)
    	let s = helpers.manageAllowedDates.bind(this)(this.state.polygon)

    	s[v.target.id] = !s[v.target.id]
    	s.refreshData = true
    	this.setState(s)
    }

    setToken(key, v){
    	// key: state key labeling this input token
    	// v: new value being considered
    	let s = {...this.state}
    	
  	  s[key] = v
  	  s.refreshData = true

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
    generateArgoURLs() {
    	if(!this.state.argocore && !this.state.argobgc && !this.state.argodeep){
    		return []
    	}

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

    generateCCHDOURLs() {
    	if(!this.state.woce && !this.state.goship && !this.state.cchdoother){
    		return []
    	}

    	let url = helpers.generateTemporoSpatialURL.bind(this)('cchdo')

	    // decide on source.source
	    let source = []
	    if(this.state.cchdoother && this.state.woce && this.state.goship){
	    	source = []
	    } else if(this.state.cchdoother && this.state.woce && !this.state.goship){
	    	source = ['~cchdo_woce,~cchdo_go-ship', 'cchdo_woce']
	    } else if(this.state.cchdoother && !this.state.woce && this.state.goship){
	    	source = ['~cchdo_woce,~cchdo_go-ship', 'cchdo_go-ship']
	    } else if(!this.state.cchdoother && this.state.woce && this.state.goship){
	    	source = ['cchdo_go-ship', 'cchdo_woce']
	    } else if(this.state.cchdoother && !this.state.woce && !this.state.goship){
	    	source = ['~cchdo_go-ship,~cchdo_woce']
	    } else if(!this.state.cchdoother && this.state.woce && !this.state.goship){
	    	source = ['cchdo_woce']
	    } else if(!this.state.cchdoother && !this.state.woce && this.state.goship){
	    	source = ['cchdo_go-ship']
	    }

	    if(source.length === 0){
	    	return [url]
	    } else{
	    	return source.map(x => url+'&source='+x)
	    }

    	return [url]
    }

    generateDrifterURLs(){
    	if(!this.state.drifters){
    		return []
    	}

    	let url = helpers.generateTemporoSpatialURL.bind(this)('drifters')

    	return [url]
    }

    generateTCURLs(){
    	if(!this.state.tc){
    		return []
    	}

    	let url = helpers.generateTemporoSpatialURL.bind(this)('tc')

    	return [url]
    }

    generateURLs(){
    	let urls = this.generateArgoURLs().concat(this.generateCCHDOURLs()).concat(this.generateDrifterURLs()).concat(this.generateTCURLs())
    	return urls
    }

    genTooltip(point){
    	return(
		    <Popup>
		      ID: {point[0]} <br />
		      Long / Lat: {point[1]} / {point[2]} <br />
		      Date: {point[3]}
		    </Popup>
    	)
    }

    // leaflet helpers
    chooseColor(datasources){

    	let ds = []
    	if(datasources[datasources.length-1] == 'argo') {
    		ds = datasources[4]
    	} else if(datasources[datasources.length-1] == 'cchdo') {
    		ds = datasources[4]
    	} else if(datasources[datasources.length-1] == 'drifters') {
    		ds = ['drifters']
    	} else if(datasources[datasources.length-1] == 'tc') {
    		ds = ['tc']
    	} 

    	if(ds.includes('argo_bgc')){
    		return 'green'
    	}
    	else if(ds.includes('argo_deep')){
    		return 'blue'
    	}
    	else if(ds.includes('argo_core')){
	    	return 'yellow'
	    }
	    else if(ds.includes('drifters')){
	    	return 'black'
	    }
	    else if(ds.includes('tc')){
	    	return 'red'
	    }
	    else if(ds.includes('cchdo_woce')){
	    	return 'orange'
	    }
	    else if(ds.includes('cchdo_go-ship')){
	    	return 'magenta'
	    }
	    else{
	    	return '#999999'
	    }
    }

    // misc helpers
    findDataset(url){
    	return url.slice(url.search('(?<='+this.apiPrefix+')'), url.search('(?=comp)')-1 )
    }

    recalculateTemporospatialLimits(s){
    	let minDays = []
    	let minArea = []
    	let maxArea = []
    	if(s.argocore || s.argobgc || s.argodeep){
    		minDays.push(10)
    		minArea.push(1000000)
    		maxArea.push(10000000)
    	}
    	if(s.cchdo){
    		minDays.push(30)
    		minArea.push(1000000)
    		maxArea.push(10000000)
    	}
    	if(s.drifters){
    		minDays.push(0)
    		minArea.push(100000)
    		maxArea.push(1000000)
    	}
    	if(s.tc){
    		minDays.push(30)
    		minArea.push(1000000)
    		maxArea.push(10000000)
    	}

    	this.minDays = Math.min(...minDays)
    	this.minArea = Math.min(...minArea)
    	this.maxArea = Math.min(...maxArea)
    }

    dateRangeMultiplyer(s){
    	// allowed date range will be multiplied by this much, as a function of the mutated state s
    	return 1
    }

    toggleCoupling(s){
    	// if changing a toggle for this page needs to trigger a side effect on state, do so here.
    	return s
    }

	render(){
		console.log(this.state)
		return(
			<>
				<div className='row' style={{'width':'100vw'}}>
					
					{/*search option sidebar*/}
					<div className='col-3 overflow-auto'>
						<fieldset ref={this.formRef}>
							<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
							<div className='mapSearchInputs'>
									<h5>Colocate datasets</h5>
									<div className='verticalGroup'>
										<div className="form-floating mb-3">
											<input type="password" className="form-control" id="apiKey" placeholder="" value={this.state.apiKey} onInput={(v) => helpers.setToken.bind(this)('apiKey', v.target.value, null, true)}></input>
											<label htmlFor="apiKey">API Key</label>
											<div id="apiKeyHelpBlock" className="form-text">
							  					<a target="_blank" rel="noreferrer" href='https://argovisbeta02.colorado.edu/'>Get a free API key</a>
											</div>
										</div>

										<h6>Time range</h6>
										<div className="form-floating mb-3">
											<input 
												type="date" 
												className="form-control" 
												id="startDate" 
												value={this.state.startDate} 
												placeholder="" 
												onChange={v => helpers.setDate.bind(this)('startDate', v.target.valueAsNumber, this.state.maxDayspan, false, true)}
												onBlur={e => helpers.setDate.bind(this)('startDate', e.target.valueAsNumber, this.state.maxDayspan, false, false)}
												onKeyPress={e => {if(e.key==='Enter'){helpers.setDate.bind(this)('startDate', e.target.valueAsNumber, this.state.maxDayspan, false, false)}}}
											/>
											<label htmlFor="startDate">Start Date</label>
										</div>
										<div className="form-floating mb-3">
											<input 
												type="date" 
												className="form-control" 
												id="startDate" 
												value={this.state.endDate} 
												placeholder="" 
												onChange={v => helpers.setDate.bind(this)('endDate', v.target.valueAsNumber, this.state.maxDayspan, false, true)}
												onBlur={e => helpers.setDate.bind(this)('endDate', e.target.valueAsNumber, this.state.maxDayspan, false, false)}
												onKeyPress={e => {if(e.key==='Enter'){helpers.setDate.bind(this)('endDate', e.target.valueAsNumber, this.state.maxDayspan, false, false)}}}
											/>
											<label htmlFor="endDate">End Date</label>
										</div>
										<div id="dateRangeHelp" className="form-text">
						  					<p>Max day range: {this.state.maxDayspan+1}</p>
										</div>
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
												helpers.manageStatus.bind(this)('actionRequired', 'Hit return or click outside the current input to update.')
												this.setState({centerlon:e.target.value})}
											} 
											onBlur={e => {
												this.setState({centerlon: helpers.manageCenterlon(e.target.defaultValue), mapkey: Math.random(), refreshData: true})
											}}
											onKeyPress={e => {
												if(e.key==='Enter'){
													this.setState({centerlon: helpers.manageCenterlon(e.target.defaultValue), mapkey: Math.random(), refreshData: true})
												}
											}}
											aria-label="centerlon" 
											aria-describedby="basic-addon1"/>
										<label htmlFor="depth">Center longitude on [-180,180]</label>
									</div>

								<h6>Dataset Filters</h6>

				      	<div className='verticalGroup'>
				      		<h6 style={{'color': '#888888'}}>Argo</h6>
					        <div className="form-check">
										<input className="form-check-input" checked={this.state.argocore} onChange={(v) => this.toggle(v)} type="checkbox" id='argocore'></input>
										<label className="form-check-label" htmlFor='Argo Core'>Display Argo Core <span style={{'color':this.chooseColor([,,,,['argo_core'],'argo']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
						    	<div className="form-check">
										<input className="form-check-input" checked={this.state.argobgc} onChange={(v) => this.toggle(v)} type="checkbox" id='argobgc'></input>
										<label className="form-check-label" htmlFor='Argo BGC'>Display Argo BGC <span style={{'color':this.chooseColor([,,,,['argo_bgc'],'argo']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
			        		<div className="form-check">
										<input className="form-check-input" checked={this.state.argodeep} onChange={(v) => this.toggle(v)} type="checkbox" id='argodeep'></input>
										<label className="form-check-label" htmlFor='Argo Deep'>Display Argo Deep <span style={{'color':this.chooseColor([,,,,['argo_deep'],'argo']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>

				      	<div className='verticalGroup'>
				      		<h6 style={{'color': '#888888'}}>Ship-based profiles</h6>
					        <div className="form-check">
										<input className="form-check-input" checked={this.state.woce} onChange={(v) => this.toggle(v)} type="checkbox" id='woce'></input>
										<label className="form-check-label" htmlFor='woce'>Display WOCE ships <span style={{'color':this.chooseColor([,,,,['cchdo_woce'],'cchdo']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
						    	<div className="form-check">
										<input className="form-check-input" checked={this.state.goship} onChange={(v) => this.toggle(v)} type="checkbox" id='goship'></input>
										<label className="form-check-label" htmlFor='goship'>Display GO-SHIP <span style={{'color':this.chooseColor([,,,,['cchdo_go-ship'],'cchdo']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
			        		<div className="form-check">
										<input className="form-check-input" checked={this.state.cchdoother} onChange={(v) => this.toggle(v)} type="checkbox" id='cchdoother'></input>
										<label className="form-check-label" htmlFor='cchdoother'>Display other ships <span style={{'color':this.chooseColor([,,,,['cchdo_xxx'],'cchdo']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6 style={{'color': '#888888'}}>Global drifter program</h6>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.drifters} onChange={(v) => this.toggle(v)} type="checkbox" id='drifters'></input>
										<label className="form-check-label" htmlFor='Drifters'>Display drifters <span style={{'color':this.chooseColor(['drifters']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6 style={{'color': '#888888'}}>Tropical cyclones</h6>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.tc} onChange={(v) => this.toggle(v)} type="checkbox" id='tc'></input>
										<label className="form-check-label" htmlFor='Tropical Cyclones'>Display tropical cyclones <span style={{'color':this.chooseColor(['tc']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>
							</div>
						</fieldset>
					</div>

					{/*leaflet map*/}
					<div className='col-9'>
						<MapContainer key={this.state.mapkey} center={[25, parseFloat(this.state.centerlon)]} zoom={2} scrollWheelZoom={true}>
						  <TileLayer
						    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						  />
						  <FeatureGroup ref={this.fgRef}>
						    <EditControl
						      position='topleft'
						      onEdited={p => helpers.onPolyEdit.bind(this)(p)}
						      onCreated={p => helpers.onPolyCreate.bind(this)(p)}
						      onDeleted={p => helpers.onPolyDelete.bind(this)(this.defaultPolygon,p)}
						      onDrawStop={p => helpers.onDrawStop.bind(this)(p)}
						      onDrawStart={p => helpers.onDrawStart.bind(this)(p)}
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
						    <Polygon key={JSON.stringify(this.state.polygon)} positions={this.state.polygon.map(x => [x[1],helpers.mutateLongitude(x[0], this.state.centerlon)])} fillOpacity={0}></Polygon>
						  </FeatureGroup>
						  {this.state.points.argo}
						  {this.state.points.cchdo}
						  {this.state.points.drifters}
						  {this.state.points.tc}
						</MapContainer>
					</div>
				</div>
			</>
		)
	}
}

export default ArgovisExplore