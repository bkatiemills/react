import React from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup, Popup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'

class ShipsExplore extends React.Component {

	constructor(props) {
		super(props);

		let q = new URLSearchParams(window.location.search) // parse out query string

		// limits for polygon / time coupling
		this.minDays = 30
		this.maxDays = 365
		this.minArea = 1000000
		this.maxArea = 10000000
		this.defaultDayspan = 30

		// default state, pulling in query string specifications
		this.state = {
			observingEntity: false,
			apiKey: 'guest',
			woce: q.has('woce') ? q.get('woce') === 'true' : false,
			goship: q.has('goship') ? q.get('goship') === 'true' : false,
			other: q.has('other') ? q.get('other') === 'true' : false,
			wocelineSuggestions: [],
			woceline: q.has('woceline') ? q.get('woceline') : '',
			cruiseSuggestions: [],
			cruise: q.has('cruise') ? q.get('cruise') : '',
			refreshData: true,
			points: [],
			polygon: q.has('polygon') ? JSON.parse(q.get('polygon')) : [],
			urls: [],
			maxDayspan: q.has('polygon') ? helpers.calculateDayspan.bind(this)(JSON.parse(q.get('polygon'))) : this.defaultDayspan,
			depthRequired: q.has('depthRequired') ? q.get('depthRequired') : 0
		}

		helpers.mungeTime.bind(this)(q, this.state.maxDayspan+1, '1993-07-31') // +1 since we include the end date here.

        // if no query string specified at all or no categories selected turn on all cchdo categories
        if(!window.location.search || !q.has('woce') && !q.has('goship') && !q.has('other') ){
        	console.log('imposing defaults')
        	this.state.woce = true
        	this.state.goship = true
        	this.state.other = true
        }

        // some other useful class variables
        this.fgRef = React.createRef()
        this.formRef = React.createRef()
		this.statusReporting = React.createRef()
        //this.apiPrefix = 'https://argovis-api.colorado.edu/'
        this.apiPrefix = 'http://3.88.185.52:8080/'
        this.vocab = {}
        this.wocelineLookup = {}
        this.wocegroupLookup = {}
        this.dataset = 'cchdo'
        this.customQueryParams = ['startDate', 'endDate', 'polygon', 'depthRequired', 'woce', 'goship', 'other', 'woceline', 'cruise']

        // populate vocabularies, and trigger first render
        let vocabURLs = [this.apiPrefix + 'summary?id=cchdo_occupancies', this.apiPrefix + 'cchdo/vocabulary?parameter=cchdo_cruise']
		Promise.all(vocabURLs.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
			Promise.all(responses.map(res => res.json())).then(data => {
				this.vocab['woceline'] = Object.keys(data[0][0].summary).map(key => {
					this.wocegroupLookup[key] = {}
					return data[0][0].summary[key].map((x,i) => {
						let label = key + ' - ' + String(x.startDate.slice(0,7) )
						this.wocelineLookup[label] = data[0][0].summary[key][i]			// for lookups by <woceline - start yyyy-mm>
						this.wocegroupLookup[key][label] = [new Date(data[0][0].summary[key][i].startDate), new Date(data[0][0].summary[key][i].endDate)]   // for lookups by woceline
						return label
					}) 
				})
				console.log(this.wocegroupLookup)
				this.vocab['woceline'] = [].concat(...this.vocab['woceline'])
				this.vocab['cruise'] = data[1].map(x=>String(x))
				this.setState({refreshData:true})
			})
		})
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	helpers.componentDidUpdate.bind(this)()
    }

    lookingForEntity(){
    	// return true if any token, valid or not, is specified for any entity query string parameter
    	return Boolean(this.state.woceline || this.state.cruise)
    }

    generateURLs() {
    	if(this.state.woceline !== ''){
    		// parse out what WOCE line and date range is meant by the autocomplete, and give an extra hour on either end
    		let woceline = this.state.woceline.split(' ')[0]
    		let startDate = new Date(this.wocelineLookup[this.state.woceline].startDate)
    		let endDate = new Date(this.wocelineLookup[this.state.woceline].endDate)
    		startDate.setHours(startDate.getHours() - 1)
    		endDate.setHours(endDate.getHours() + 1)
    		return [this.apiPrefix +'cchdo?compression=minimal&woceline=' + woceline + '&startDate=' + startDate.toISOString().replace('.000Z', 'Z') + '&endDate=' + endDate.toISOString().replace('.000Z', 'Z')]
    	} else if(this.state.cruise !== '') {
    		return [this.apiPrefix +'cchdo?compression=minimal&cchdo_cruise=' + this.state.cruise]
    	} else {

	    	let url = helpers.generateTemporoSpatialURL.bind(this)('cchdo')	

	    	// decide on source.source
	    	let source = []
	    	if(this.state.other && this.state.woce && this.state.goship){
	    		source = []
	    	} else if(this.state.other && this.state.woce && !this.state.goship){
	    		source = ['~cchdo_woce,~cchdo_go-ship', 'cchdo_woce']
	    	} else if(this.state.other && !this.state.woce && this.state.goship){
	    		source = ['~cchdo_woce,~cchdo_go-ship', 'cchdo_go-ship']
	    	} else if(!this.state.other && this.state.woce && this.state.goship){
	    		source = ['cchdo_go-ship', 'cchdo_woce']
	    	} else if(this.state.other && !this.state.woce && !this.state.goship){
	    		source = ['~cchdo_go-ship,~cchdo_woce']
	    	} else if(!this.state.other && this.state.woce && !this.state.goship){
	    		source = ['cchdo_woce']
	    	} else if(!this.state.other && !this.state.woce && this.state.goship){
	    		source = ['cchdo_go-ship']
	    	}

	    	if(source.length === 0){
	    		return [url]
	    	} else{
	    		return source.map(x => url+'&source='+x)
	    	}
	    }
    }

    chooseColor(point){
    	if(point[4].includes('cchdo_woce')){
    		return 'green'
    	} else if(point[4].includes('cchdo_go-ship')){
    		return 'blue'
    	} else{
	    	return 'yellow'
	    }
    }

    determineWoceGroup(woce, date){
    	// given the woce tag and date of a measurement,
    	// determine the start and end date of the group of measurements this measurement belongs to

    	let groups = this.wocegroupLookup[woce]
    	for(let i=0; i<Object.keys(groups).length; i++){
    		let key = Object.keys(groups)[i]
    		if(date >= groups[key][0] && date <= groups[key][1]){
    			return groups[key].concat(key)
    		}
    	}
    }

    genTooltip(point){
    	// given an array <point> corresponding to a single point returned by an API data route with compression=minimal,
    	// return the jsx for an appropriate tooltip for this point.

    	// determine the woceline occupancies for this point, if any; give an extra hour on either end to capture edges. 
    	let woceoccupy = point[5].map(x => {
    		let timespan = this.determineWoceGroup(x, new Date(point[3]))
    		timespan[0].setHours(timespan[0].getHours() - 1)
    		timespan[1].setHours(timespan[1].getHours() + 1)
    		return [x].concat(timespan)
    	})

    	return(
		    <Popup>
		      ID: {point[0]} <br />
		      Long / Lat: {point[1]} / {point[2]} <br />
		      Date: {point[3]} <br />
		      {woceoccupy.map(x => {
		      	return(<><a key={Math.random()} target="_blank" rel="noreferrer" href={'/plots/ships?showAll=true&woceline='+x[0]+'&startDate=' + x[1].toISOString().replace('.000Z', 'Z') + '&endDate=' + x[2].toISOString().replace('.000Z', 'Z')}>{'Plots for ' + x[3]}</a><br /></>)
		      })}
		      <a target="_blank" rel="noreferrer" href={'/plots/ships?showAll=true&cruise='+point[6]}>{'Plots for cruise ' + point[6]}</a><br />
		      Data Sources: {point[4]}
		    </Popup>
    	)
    }

	render(){
		console.log(this.state)
		return(
			<>
				<div className='row' style={{'width':'100vw'}}>
					<div className='col-3 overflow-auto'>
						<fieldset ref={this.formRef}>
							<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
							<div className='mapSearchInputs'>
								<h5>Explore Ship-Based Profiles</h5>
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
										<input 
											type="date" 
											disabled={this.state.observingEntity} 
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
											disabled={this.state.observingEntity} 
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

									<h6>Depth</h6>
									<div className="form-floating mb-3">
										<input 
											id="depth"
											type="text"
											disabled={this.state.observingEntity} 
											className="form-control" 
											placeholder="0" 
											value={this.state.depthRequired} 
											onChange={e => {
												helpers.manageStatus.bind(this)('actionRequired', 'Hit return or click outside the current input to update.')
												this.setState({depthRequired:e.target.value})}
											} 
											onBlur={e => {this.setState({depthRequired:e.target.defaultValue, refreshData: true})}}
											onKeyPress={e => {if(e.key==='Enter'){this.setState({depthRequired:e.target.defaultValue, refreshData: true})}}}
											aria-label="depthRequired" 
											aria-describedby="basic-addon1"/>
										<label htmlFor="depth">Require levels deeper than [m]:</label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6>Subsets</h6>
									<div className="form-check">
										<input className="form-check-input" disabled={this.state.observingEntity} checked={this.state.woce} onChange={(v) => helpers.toggle.bind(this)(v, 'woce')} type="checkbox" id='woce'></input>
										<label className="form-check-label" htmlFor='woce'>Display WOCE ships <span style={{'color':this.chooseColor([,,,,['cchdo_woce']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" disabled={this.state.observingEntity} checked={this.state.goship} onChange={(v) => helpers.toggle.bind(this)(v, 'goship')} type="checkbox" id='goship'></input>
										<label className="form-check-label" htmlFor='goship'>Display GO-SHIP <span style={{'color':this.chooseColor([,,,,['cchdo_go-ship']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" disabled={this.state.observingEntity} checked={this.state.other} onChange={(v) => helpers.toggle.bind(this)(v, 'other')} type="checkbox" id='other'></input>
										<label className="form-check-label" htmlFor='other'>Display other ships <span style={{'color':this.chooseColor([,,,,['cchdo_x']]), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
								</div>

								<div className='verticalGroup'>
									<h6>Object Filters</h6>
									<div className="form-floating mb-3">
			      						<Autosuggest
									      	id='woceAS'
									      	key='woce'
									        suggestions={this.state.wocelineSuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'wocelineSuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'wocelineSuggestions')}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'woceline')}
									        inputProps={{placeholder: 'WOCE Line', value: this.state.woceline, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of WOCE line', 'woceline'), id: 'woceline', disabled: Boolean(this.state.cruise)}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
									</div>

									<div className="form-floating mb-3">
			      						<Autosuggest
									      	id='cruiseAS'
									      	key='cruise'
									        suggestions={this.state.cruiseSuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'cruiseSuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'cruiseSuggestions')}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'cruise')}
									        inputProps={{placeholder: 'Cruise ID', value: this.state.cruise, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of Cruise ID', 'cruise'), id: 'cruise',  disabled: Boolean(this.state.woceline)}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
									</div>

									<div id="coloHelpBlock" className="form-text">
					  					<a target="_blank" rel="noreferrer" href='https://github.com/argovis/demo_notebooks/blob/main/CCHDO_Intro.ipynb'>Colocate ship profiles with other products</a>
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

export default ShipsExplore