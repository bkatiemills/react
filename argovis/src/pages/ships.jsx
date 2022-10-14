import React from 'react';
import { MapContainer, TileLayer, Polygon, FeatureGroup} from 'react-leaflet'
import { EditControl } from "react-leaflet-draw";
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'

class ShipsExplore extends React.Component {

	constructor(props) {
		super(props);

		let q = new URLSearchParams(window.location.search) // parse out query string

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
			urls: []
		}

		this.maxDayspan = 30
		helpers.mungeTime.bind(this)(q, this.maxDayspan, '1993-07-31')

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
        this.dataset = 'cchdo'
        this.customQueryParams = ['woce', 'goship', 'other', 'woceline', 'cruise']

        // populate vocabularies, and trigger first render
        let vocabURLs = [this.apiPrefix + 'cchdo/vocabulary?parameter=woceline', this.apiPrefix + 'cchdo/vocabulary?parameter=cchdo_cruise']
		Promise.all(vocabURLs.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
			Promise.all(responses.map(res => res.json())).then(data => {
				this.vocab['woceline'] = data[0]
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
    		return [this.apiPrefix +'cchdo?compression=minimal&woceline=' + this.state.woceline]
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

    toggle(v){
    	let s = {...this.state}
    	s[v.target.id] = !s[v.target.id]
    	s.refreshData = true
    	this.setState(s)
    }

    chooseColor(datasources){
    	if(datasources.includes('cchdo_woce')){
    		return 'green'
    	} else if(datasources.includes('cchdo_go-ship')){
    		return 'blue'
    	} else{
	    	return 'yellow'
	    }
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
									<h6>Subsets</h6>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.woce} onChange={(v) => this.toggle(v, 'woce')} type="checkbox" id='woce'></input>
										<label className="form-check-label" htmlFor='woce'>Display WOCE ships <span style={{'color':this.chooseColor(['cchdo_woce']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.goship} onChange={(v) => this.toggle(v, 'goship')} type="checkbox" id='goship'></input>
										<label className="form-check-label" htmlFor='goship'>Display GO-SHIP <span style={{'color':this.chooseColor(['cchdo_go-ship']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
									</div>
									<div className="form-check">
										<input className="form-check-input" checked={this.state.other} onChange={(v) => this.toggle(v, 'other')} type="checkbox" id='other'></input>
										<label className="form-check-label" htmlFor='other'>Display other ships <span style={{'color':this.chooseColor(['cchdo_x']), 'WebkitTextStroke': '1px black'}}>&#9679;</span></label>
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
									        inputProps={{placeholder: 'WOCE Line', value: this.state.woceline, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of WOCE line'), id: 'woceline', disabled: Boolean(this.state.cruise)}}
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
									        inputProps={{placeholder: 'Cruise ID', value: this.state.cruise, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of Cruise ID'), id: 'cruise',  disabled: Boolean(this.state.woceline)}}
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