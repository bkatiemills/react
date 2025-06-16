import React from 'react';
import { MapContainer, TileLayer, Popup, Polygon, FeatureGroup, CircleMarker} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import '../index.css';
import helpers from'./helpers'
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

class ArgovisExplore extends React.Component {
		// top level element for the Argovis landing page
    constructor(props) {
      super(props);

      let q = new URLSearchParams(window.location.search) // parse out query string
      document.title = 'Argovis - Colocate datasets'

        // limits for polygon / time coupling
        this.minDays = 90
        this.maxDays = 365
        this.minArea = 1000000
        this.maxArea = 10000000
        this.defaultDayspan = 10
        this.defaultPolygon = [[-97.673601848372,22.885110124806],[-102.96337821312578,29.423999093502953],[-101.90542294017503,35.08813382357759],[-96.49809598953782,39.66434175349062],[-90.62056669536695,43.70195227382903],[-82.50957626941113,47.56429889487994],[-74.3985858434553,49.739009952924114],[-64.52433662924821,50.716917706856776],[-57.00109913270949,50.4181580475676],[-47.24440050438584,48.74098923312187],[-39.72116300784711,46.36057030355044],[-33.72608312779282,43.18971187199796],[-27.263085342297984,36.613054011709224],[-26.086555175241674,29.11626649340519],[-30.08675774323312,21.360090709822067],[-38.087162879216116,14.654857870125182],[-47.61705723237225,10.524339189723026],[-58.794093819407266,9.250074393405415],[-68.79460023938596,11.447818472507375],[-72.79480280737744,12.94196371139217],[-77.50092347560269,9.598086459248549],[-81.50112604359414,9.829896891316018],[-83.38357431088428,11.332543160952566],[-83.26592129417863,14.768594001462352],[-85.26602257817437,16.805273170537433],[-88.56030704593205,16.467266454192085],[-87.14847084546449,20.15056092317585],[-87.14847084546449,22.12466319561307],[-90.08979626310527,21.360090709822067],[-92.20755056380663,18.93158885095828],[-95.50183503156434,19.375913925110194],[-97.673601848372,22.885110124806]]
        this.defaultDayspan = helpers.calculateDayspan.bind(this)({'polygon':this.defaultPolygon})

      this.state = {
      	apiKey: localStorage.getItem('apiKey') ? localStorage.getItem('apiKey') : 'guest',					// user's API key, if provided
        points: [],
       	urls: [],
       	rawPoints: {
       		'argo': [],
       		'cchdo': [],
       		'drifters': [],
       		'tc': []
       	},
       	maxDayspan: q.has('polygon') ? helpers.calculateDayspan.bind(this)( {'polygon':JSON.parse(q.get('polygon'))} ) : this.defaultDayspan,
       	polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : this.defaultPolygon, // [[lon0, lat0], [lon1, lat1], ..., [lonn,latn], [lon0,lat0]]
       	interpolated_polygon: q.has('polygon') ? helpers.insertPointsInPolygon(JSON.parse(q.get('polygon'))) : helpers.insertPointsInPolygon(this.defaultPolygon),
       	argocore: q.has('argocore') ? q.get('argocore') === 'true' : false,
       	argobgc: q.has('argobgc') ? q.get('argobgc') === 'true' : false,
       	argodeep: q.has('argodeep') ? q.get('argodeep') === 'true' : false,
       	woce: q.has('woce') ? q.get('woce') === 'true' : false,
       	goship: q.has('goship') ? q.get('goship') === 'true' : false,
       	cchdoother: q.has('cchdoother') ? q.get('cchdoother') === 'true' : false,
       	drifters: q.has('drifters') ? q.get('drifters') === 'true' : false,
       	tc: q.has('tc') ? q.get('tc') === 'true' : false,
       	centerlon: q.has('centerlon') ? parseFloat(q.get('centerlon')) : -70,
        phase: 'refreshData',
        data: [[],[],[],[]],
        suppressBlur: false,
      }
      this.customQueryParams = ['startDate', 'endDate', 'polygon', 'argocore', 'argobgc', 'argodeep', 'cchdoother', 'woce', 'goship', 'drifters', 'tc', 'centerlon']

      helpers.mungeTime.bind(this)(q, this.state.maxDayspan+1) // +1 since we include the end date here.

      if(!window.location.search){
      	console.log('imposing defaults')
      	this.state.argocore = true
      	this.state.argobgc = true
      	this.state.argodeep = true
      	this.state.tc = true
      	this.state.goship = true
      	this.state.startDate = '2017-04-01'
      	this.state.endDate = '2017-06-30'
      }

      this.formRef = React.createRef()
      this.fgRef = React.createRef()

      this.statusReporting = React.createRef()
      this.apiPrefix = 'https://argovis-api.colorado.edu/'
      this.drifterApiPrefix = 'https://argovis-drifters.colorado.edu/'
      this.vocab = {}
      this.wocelineLookup = {}
      this.wocegroupLookup = {}

	  helpers.setQueryString.bind(this)()

      // get initial data
      this.state.urls = this.generateURLs(this.state)
      this.downloadData()

      // populate vocabularies, and trigger first render
      let vocabURLs = [this.apiPrefix + 'summary?id=cchdo_occupancies', this.apiPrefix + 'cchdo/vocabulary?parameter=cchdo_cruise']
			Promise.all(vocabURLs.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
				Promise.all(responses.map(res => res.json())).then(data => {
					if(data[0].hasOwnProperty('code') && data[0].code === 401){
						helpers.manageStatus.bind(this)('error', 'Invalid API key; see the "Get a free API key" link below.')
					} else {
						this.vocab['woceline'] = Object.keys(data[0][0].summary).map(key => {
							this.wocegroupLookup[key] = {}
							return data[0][0].summary[key].map((x,i) => {
							let label = key + ' - ' + String(x.startDate.slice(0,7) )
								this.wocelineLookup[label] = data[0][0].summary[key][i]			// for lookups by <woceline - start yyyy-mm>
								this.wocegroupLookup[key][label] = [new Date(data[0][0].summary[key][i].startDate), new Date(data[0][0].summary[key][i].endDate)]   // for lookups by woceline
								return label
							}) 
						})
						this.vocab['woceline'] = [].concat(...this.vocab['woceline'])
						this.vocab['cruise'] = data[1].map(x=>String(x))
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
            phase: 'idle',
            suppressBlur: false
        })
    }

    generateURLs(params){
    	let urls = this.generateArgoURLs(params).concat(this.generateCCHDOURLs(params)).concat(this.generateDrifterURLs(params)).concat(this.generateTCURLs(params))
    	return urls
    }

    generateArgoURLs(params){
        let argocore = params.hasOwnProperty('argocore') ? params.argocore : this.state.argocore
        let argobgc = params.hasOwnProperty('argobgc') ? params.argobgc : this.state.argobgc
        let argodeep = params.hasOwnProperty('argodeep') ? params.argodeep : this.state.argodeep
        let startDate = params.hasOwnProperty('startDate') ? params.startDate : this.state.startDate
        let endDate = params.hasOwnProperty('endDate') ? params.endDate : this.state.endDate
        let polygon = params.hasOwnProperty('polygon') ? params.polygon : this.state.polygon
        let depthRequired = params.hasOwnProperty('depthRequired') ? params.depthRequired : this.state.depthRequired

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

    generateCCHDOURLs(params) {
        let startDate = params.hasOwnProperty('startDate') ? params.startDate : this.state.startDate
        let endDate = params.hasOwnProperty('endDate') ? params.endDate : this.state.endDate
        let polygon = params.hasOwnProperty('polygon') ? params.polygon : this.state.polygon
        let depthRequired = params.hasOwnProperty('depthRequired') ? params.depthRequired : this.state.depthRequired
        let woce = params.hasOwnProperty('woce') ? params.woce : this.state.woce
        let goship = params.hasOwnProperty('goship') ? params.goship : this.state.goship
        let cchdoother = params.hasOwnProperty('cchdoother') ? params.cchdoother : this.state.cchdoother

        let url = helpers.generateTemporoSpatialURL.bind(this)(this.apiPrefix, 'cchdo', startDate, endDate, polygon, depthRequired)	

        // decide on source.source
        let source = []
        if(!cchdoother && !woce && !goship){
            return []
        }else if(cchdoother && woce && goship){
            source = []
        } else if(cchdoother && woce && !goship){
            source = ['~cchdo_woce,~cchdo_go-ship', 'cchdo_woce']
        } else if(cchdoother && !woce && goship){
            source = ['~cchdo_woce,~cchdo_go-ship', 'cchdo_go-ship']
        } else if(!cchdoother && woce && goship){
            source = ['cchdo_go-ship', 'cchdo_woce']
        } else if(cchdoother && !woce && !goship){
            source = ['~cchdo_go-ship,~cchdo_woce']
        } else if(!cchdoother && woce && !goship){
            source = ['cchdo_woce']
        } else if(!cchdoother && !woce && goship){
            source = ['cchdo_go-ship']
        }

        if(source.length === 0){
            return [url]
        } else{
            return source.map(x => url+'&source='+x)
        }
	    
    }

    generateDrifterURLs(params){
        let startDate = params.hasOwnProperty('startDate') ? params.startDate : this.state.startDate
        let endDate = params.hasOwnProperty('endDate') ? params.endDate : this.state.endDate
        let polygon = params.hasOwnProperty('polygon') ? params.polygon : this.state.polygon
        let depthRequired = params.hasOwnProperty('depthRequired') ? params.depthRequired : this.state.depthRequired
        let drifters = params.hasOwnProperty('drifters') ? params.drifters : this.state.drifters

    	if(!drifters){
    		return []
    	}

    	return [helpers.generateTemporoSpatialURL.bind(this)(this.drifterApiPrefix, 'drifters', startDate, endDate, polygon, depthRequired)]	
    }

    generateTCURLs(params){
        let startDate = params.hasOwnProperty('startDate') ? params.startDate : this.state.startDate
        let endDate = params.hasOwnProperty('endDate') ? params.endDate : this.state.endDate
        let polygon = params.hasOwnProperty('polygon') ? params.polygon : this.state.polygon
        let depthRequired = params.hasOwnProperty('depthRequired') ? params.depthRequired : this.state.depthRequired
        let tc = params.hasOwnProperty('tc') ? params.tc : this.state.tc
        
        if(!tc){
    		return []
    	}

    	return [helpers.generateTemporoSpatialURL.bind(this)(this.apiPrefix, 'tc', startDate, endDate, polygon, depthRequired)]
    	
    }

    lookingForEntity(){
    	return false
    }

    // input handlers
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






    genPlotURLs(point, state){
    	if(point[point.length-1] === 'argo'){
    		let regionLink = helpers.genRegionLink(state.polygon, state.startDate, state.endDate, state.centerlon, 'argo')
    		return <div><a target="_blank" rel="noreferrer" href={'/plots/argo?showAll=true&argoPlatform='+point[0].split('_')[0]+'&centerlon='+this.state.centerlon}>Platform Page</a><br /><a target="_blank" rel="noreferrer" href={'/plots/argo?argoPlatform='+point[0].split('_')[0]+'&counterTraces=["'+point[0]+'"]&centerlon='+this.state.centerlon}>Profile Page</a>{regionLink}</div>
    	} else if (point[point.length-1] === 'tc'){
    		let regionLink = helpers.genRegionLink(state.polygon, state.startDate, state.endDate, state.centerlon, 'tc')
    		return <div><a target="_blank" rel="noreferrer" href={'/plots/tc?showAll=true&tcMeta='+point[0].split('_')[0]+'&centerlon='+this.state.centerlon}>Cyclone Page</a>{regionLink}</div>
    	} else if (point[point.length-1] === 'cchdo'){

    		// determine the woceline occupancies for this point, if any; give an extra hour on either end to capture edges. 
    		let woceoccupy = point[5].map(x => {
    			let timespan = helpers.determineWoceGroup(x, new Date(point[3]), this.wocegroupLookup)
    			timespan[0].setHours(timespan[0].getHours() - 1)
    			timespan[1].setHours(timespan[1].getHours() + 1)
    			return [x].concat(timespan)
    		})

    		let regionLink = helpers.genRegionLink(state.polygon, state.startDate, state.endDate, state.centerlon, 'ships')

				return <div>{woceoccupy.map(x => {return(<span key={Math.random()}><a target="_blank" rel="noreferrer" href={'/plots/ships?showAll=true&woceline='+x[0]+'&startDate=' + x[1].toISOString().replace('.000Z', 'Z') + '&endDate=' + x[2].toISOString().replace('.000Z', 'Z')+'&centerlon='+this.state.centerlon}>{'Plots for ' + x[3]}</a><br /></span>)})} <a target="_blank" rel="noreferrer" href={'/plots/ships?showAll=true&cruise='+point[6]+'&centerlon='+this.state.centerlon}>{'Plots for cruise ' + point[6]}</a><br /><a target="_blank" rel="noreferrer" href={'/plots/ships?cruise='+point[6]+'&centerlon='+this.state.centerlon+'&counterTraces=["'+point[0]+'"]'}>Profile Page</a>{regionLink}</div>
    	}
    }

    genTooltip(point){
    	return(
		    <Popup>
		      ID: {point[0]} <br />
		      Long / Lat: {helpers.mungePrecision(point[1])} / {helpers.mungePrecision(point[2])} <br />
		      Date: {point[3]}<br />
		      {this.genPlotURLs(point, this.state)}
		    </Popup>
    	)
    }

    // leaflet helpers
    chooseColor(datasources){

    	let ds = []
    	if(JSON.stringify(datasources).includes('argo') || JSON.stringify(datasources).includes('cchdo')){
    		ds = datasources[4]
    	} else if(Number.isNaN(parseInt(datasources[datasources.length-1][0]))){ 
    		ds = ['tc']
    	} else {
    		ds = ['drifters']
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
    	let u = url.split('/').pop();
    	u = u.slice(0,u.search('[?].'))
    	return u
    }

    recalculateTemporospatialLimits(params){
        let argocore = params.hasOwnProperty('argocore') ? params.argocore : this.state.argocore
        let argobgc = params.hasOwnProperty('argobgc') ? params.argobgc : this.state.argobgc
        let argodeep = params.hasOwnProperty('argodeep') ? params.argodeep : this.state.argodeep
        let woce = params.hasOwnProperty('woce') ? params.woce : this.state.woce
        let goship = params.hasOwnProperty('goship') ? params.goship : this.state.goship
        let cchdoother = params.hasOwnProperty('cchdoother') ? params.cchdoother : this.state.cchdoother
        let drifters = params.hasOwnProperty('drifters') ? params.drifters : this.state.drifters
        let tc = params.hasOwnProperty('tc') ? params.tc : this.state.tc

    	let minDays = []
    	let minArea = []
    	let maxArea = []
    	if(argocore || argobgc || argodeep){
    		minDays.push(10)
    		minArea.push(1000000)
    		maxArea.push(10000000)
    	}
    	if(woce || goship || cchdoother){
    		minDays.push(30)
    		minArea.push(1000000)
    		maxArea.push(10000000)
    	}
    	if(drifters){
    		minDays.push(0)
    		minArea.push(100000)
    		maxArea.push(1000000)
    	}
    	if(tc){
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

    toggle(program){
        let params = {}
        params[program] = !this.state[program]
        this.recalculateTemporospatialLimits.bind(this)(params)

    	let s = helpers.manageAllowedDates.bind(this)(this.state.polygon)
        s[program] = !s[program]
        
        s.urls = this.generateURLs(s)
        s.phase = 'refreshData'

        this.setState(s)
    }

	render(){
		console.log(this.state)
		return(
			<>
				<div style={{'width':'100vw', 'textAlign': 'center', 'padding':'0.5em', 'fontStyle':'italic'}} className='d-lg-none'>Use the right-hand scroll bar to scroll down for search controls</div>
				<div className='row' style={{'width':'100vw'}}>
					{/*search option sidebar*/}
					<div className='col-lg-3 order-last order-lg-first'>
						<fieldset ref={this.formRef}>
							<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
							<div className='mapSearchInputs scrollit' style={{'height':'90vh'}}>
									<h5>
									<OverlayTrigger
										placement="right"
										overlay={
											<Tooltip id="compression-tooltip" className="wide-tooltip">
												Use this map to colocate Argo probes, ship based profiles, Global Drifter Program estimates, and tropical cyclones. Adjust your search terms using the form below, or specify a geographic region by first clicking on the pentagon button in the top left of the map, then choosing the vertexes of your region of interest. Click on points that appear to see links to more information. 
											</Tooltip>
										}
										trigger="click"
									>
										<i  style={{'float':'right'}} className="fa fa-question-circle" aria-hidden="true"></i>
                                    </OverlayTrigger>
										Colocate datasets
									</h5>
									<div className='verticalGroup'>
										<div className="form-floating mb-3">
											<input 
                                                type="password" 
                                                className="form-control" 
                                                id="apiKey" 
                                                value={this.state.apiKey} 
                                                placeholder="" 
                                                onInput={helpers.changeAPIkey.bind(this)}
                                            ></input>
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
                                                onBlur={e => {
                                                    if(!this.state.suppressBlur){
                                                        helpers.changeDates.bind(this)('startDate', e)
                                                    }
                                                }}
                                                onKeyPress={e => {
                                                    if(e.key==='Enter'){
                                                        helpers.changeDates.bind(this)('startDate', e)
                                                    }
                                                }}
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
                                                onBlur={e => {
                                                    if(!this.state.suppressBlur){
                                                        helpers.changeDates.bind(this)('endDate', e)
                                                    }
                                                }}
                                                onKeyPress={e => {
                                                    if(e.key==='Enter')
                                                        {helpers.changeDates.bind(this)('endDate', e)
                                                    }
                                                }}
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
											disabled={this.state.observingEntity} 
											className="form-control" 
											placeholder="0" 
											value={this.state.centerlon} 
                                            onChange={e => {this.setState({centerlon:e.target.value, phase: 'awaitingUserInput'})}} 
											onBlur={e => {
												this.setState({
                                                    centerlon: helpers.manageCenterlon(e.target.value), 
                                                    mapkey: Math.random(), 
                                                    phase: 'remapData'
                                                })
											}}
											onKeyPress={e => {
												if(e.key==='Enter'){
													this.setState({
                                                        centerlon: helpers.manageCenterlon(e.target.value), 
                                                        mapkey: Math.random(), 
                                                        phase: 'remapData',
                                                        suppressBlur: true
                                                    })
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
                                        <input className="form-check-input" checked={this.state.argocore} onChange={(v) => this.toggle.bind(this)('argocore')} type="checkbox" id='argocore'></input>
                                        <label className="form-check-label" htmlFor='argocore'>Display Argo Core <span style={{'color':this.chooseColor([null,null,null,null,['argo_core']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" checked={this.state.argobgc} onChange={(v) => this.toggle.bind(this)('argobgc')} type="checkbox" id='argobgc'></input>
                                        <label className="form-check-label" htmlFor='argobgc'>Display Argo BGC <span style={{'color':this.chooseColor([null,null,null,null,['argo_bgc']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" checked={this.state.argodeep} onChange={(v) => this.toggle.bind(this)('argodeep')} type="checkbox" id='argodeep'></input>
                                        <label className="form-check-label" htmlFor='argodeep'>Display Argo Deep <span style={{'color':this.chooseColor([null,null,null,null,['argo_deep']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
                                    </div>
                                </div>

                                <div className='verticalGroup'>
                                    <h6 style={{'color': '#888888'}}>Ship-based profiles</h6>
                                    <div className="form-check">
                                        <input className="form-check-input" checked={this.state.woce} onChange={(v) => this.toggle.bind(this)('woce')} type="checkbox" id='woce'></input>
                                        <label className="form-check-label" htmlFor='woce'>Display WOCE <span style={{'color':this.chooseColor([null,null,null,null,['cchdo_woce']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" checked={this.state.goship} onChange={(v) => this.toggle.bind(this)('goship')} type="checkbox" id='goship'></input>
                                        <label className="form-check-label" htmlFor='goship'>Display GO-SHIP <span style={{'color':this.chooseColor([null,null,null,null,['cchdo_go-ship']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
                                    </div>
                                    <div className="form-check">
                                        <input className="form-check-input" checked={this.state.cchdoother} onChange={(v) => this.toggle.bind(this)('cchdoother')} type="checkbox" id='cchdoother'></input>
                                        <label className="form-check-label" htmlFor='cchdoother'>Display other ships <span style={{'color':this.chooseColor([null,null,null,null,['cchdo_x']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
                                    </div>
                                </div>

								<div className='verticalGroup'>
									<h6 style={{'color': '#888888'}}>Global drifter program</h6>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.drifters} onChange={(v) => this.toggle.bind(this)('drifters')} type="checkbox" id='drifters'></input>
										<label className="form-check-label" htmlFor='Drifters'>Display drifters <span style={{'color':this.chooseColor([null,null,null,null,null,['1234']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6 style={{'color': '#888888'}}>Tropical cyclones</h6>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.tc} onChange={(v) => this.toggle.bind(this)('tc')} type="checkbox" id='tc'></input>
										<label className="form-check-label" htmlFor='Tropical Cyclones'>Display tropical cyclones <span style={{'color':this.chooseColor([null,null,null,null,['x']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
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
						      edit={{
										edit: false
									}}
						    />
						    <Polygon key={Math.random()} positions={this.state.interpolated_polygon.map(x => [x[1],helpers.mutateLongitude(x[0], this.state.centerlon)])} fillOpacity={0}></Polygon>
						  </FeatureGroup>
						  {this.state.points}
						</MapContainer>
					</div>
				</div>
			</>
		)
	}
}

export default ArgovisExplore