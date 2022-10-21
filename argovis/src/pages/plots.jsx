import React from 'react';
import Autosuggest from 'react-autosuggest';
import '../index.css';
import helpers from'./helpers'
import Plot from 'react-plotly.js';

class AVPlots extends React.Component {

	constructor(props) {
		super(props);

		let q = new URLSearchParams(window.location.search) // parse out query string

		// default state, pulling in query string specifications
		this.state = {
			apiKey: 'guest',
			xKey: '',
			yKey: '',
			zKey: '',
			xKeySuggestions: [],
			yKeySuggestions: [],
			zKeySuggestions: [],
			xmin: '',
			xmax: '',
			ymin: '',
			ymax: '',
			zmin: '',
			zmax: '',
			reverseX: false,
			reverseY: false,
			reverseZ: false,
			title: '',
			data: [{}],
			argoPlatform: q.has('argoPlatform') ? q.get('argoPlatform') : ''
		}

		this.apiPrefix = 'http://3.88.185.52:8080/'
		this.vocab = {xKey: [], yKey: [], zKey: []}
		this.statusReporting = React.createRef()
		this.showAll = true // show all autoselect options when field is focused and empty

		let x = Promise.all(this.generateURLs().map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
			Promise.all(responses.map(res => res.json())).then(data => {
				let p = [].concat(...data)
				let vars = this.getDataKeys(p)
				p = p.map(d => this.transpose(d))
	        	this.vocab['xKey'] = vars
	        	this.vocab['yKey'] = vars
	        	this.vocab['zKey'] = ['[2D plot]'].concat(vars)
	        	this.setState({
	        		data:p, 
	        		variables: vars, 
	        		xKey: 'temperature',
	        		yKey: 'salinity',
	        		zKey: '[2D plot]'
	        	})
			})
		})
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	helpers.manageStatus.bind(this)('ready')
    }

	transpose(profile){
		// given a <profile> object returned with data from the API and compression=all,
		// transpose the data record into an object keyed by data_key, and values as depth-ordered list of measurements

		let t = {}
		for(let i=0; i<profile.data_keys.length; i++){
			t[profile.data_keys[i]] = profile.data.map(x => x[i])
		}
		t['longitude'] = Array(profile.data.length).fill(profile.geolocation.coordinates[0],0)
		t['latitude'] = Array(profile.data.length).fill(profile.geolocation.coordinates[1],0)
		t['timestamp'] = Array(profile.data.length).fill(profile.timestamp,0)
		t['_id'] = profile._id

		return t
	}

	getDataKeys(data){
		// given an array of profile objects <data>. return a global list of keys, plus coordinates

		let keys = ['longitude', 'latitude', 'timestamp']
		for(let i=0; i<data.length; i++){
			keys = keys.concat(data[i].data_keys)
		}
		let s = new Set(keys)
		return Array.from(s)
	}

	generateURLs(){
		// return an array of API URLs to be fetched based on current state variables.

		let urls = []

		if(this.state.argoPlatform){
			urls = urls.concat(this.apiPrefix + 'argo/?compression=array&data=all&platform=' + this.state.argoPlatform)
		}

		return urls
	}

	generateRange(min, max, dataKey, reverse){
		// returns an array [minimum, maximum] as defined by <min> and <max>,
		// unless min and or max is null, in which case an appropriate limit is computed from <dataKey>

		if(min !== '' && max !== ''){
			if(reverse){
				return [max, min]
			} else {
				return [min, max]
			}
		}

		let range = []
		let data = this.state.data.map(x=>x[dataKey])
		let dataMin = Math.min(...([].concat(...data)).filter(x=>typeof x === 'number') )
		let dataMax = Math.max(...([].concat(...data)).filter(x=>typeof x === 'number') )
		let buffer = (dataMax - dataMin)*0.05
		range[0] = min === '' ? dataMin - buffer : min
		range[1] = max === '' ? dataMax + buffer : max

		if(reverse){
			return [range[1], range[0]]
		} else {
			return range
		}
	}

	zoomSync(event){
		// when plotly generates an <event> from click-and-drag zoom,
		// make sure the manual inputs keep up
		if(JSON.stringify(Object.keys(event).sort()) === '["xaxis.range[0]","xaxis.range[1]","yaxis.range[0]","yaxis.range[1]"]'){
			this.setState({
				xmin: event["xaxis.range[0]"] ? event["xaxis.range[0]"]: '',
				xmax: event["xaxis.range[1]"] ? event["xaxis.range[1]"]: '',
				ymin: event["yaxis.range[0]"] ? event["yaxis.range[0]"]: '',
				ymax: event["yaxis.range[1]"] ? event["yaxis.range[1]"]: ''
			})
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
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
										<div className="form-text">
						  					<span>x-axis variable</span>
										</div>
			      						<Autosuggest
									      	id='xKeyAS'
									        suggestions={this.state.xKeySuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'xKeySuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'xKeySuggestions')}
									        shouldRenderSuggestions={x=>true}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'xKey')}
									        inputProps={{placeholder: 'x-axis', value: this.state.xKey, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of x axis variable'), id: 'xKey'}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
										<div className="input-group mb-3" style={{'marginTop':'1em'}}>
											<div className="input-group-prepend">
											  <span className="input-group-text" id="basic-addon1">min</span>
											</div>
											<input type="text" className="form-control" style={{'marginRight': '0.5em'}} placeholder="Auto" value={this.state.xmin} onChange={e => {this.setState({xmin:e.target.value})}} aria-label="xmin" aria-describedby="basic-addon1"></input>
											
											<div className="input-group-prepend">
											  <span className="input-group-text" id="basic-addon1">max</span>
											</div>
											<input type="text" className="form-control" placeholder="Auto" value={this.state.xmax} onChange={e => {this.setState({xmax:e.target.value})}} aria-label="xmax" aria-describedby="basic-addon1"></input>
										</div>
										<div className="form-check">
											<input className="form-check-input" checked={this.state.reverseX} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseX')} type="checkbox" id='reverseX'></input>
											<label className="form-check-label" htmlFor='reverseX'>Reverse</label>
										</div>
									</div>

									<div className="form-floating mb-3">
										<div className="form-text">
						  					<span>y-axis variable</span>
										</div>
			      						<Autosuggest
									      	id='yKeyAS'
									        suggestions={this.state.yKeySuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'yKeySuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'yKeySuggestions')}
									        shouldRenderSuggestions={x=>true}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'yKey')}
									        inputProps={{placeholder: 'y-axis', value: this.state.yKey, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of y axis variable'), id: 'yKey'}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
										<div className="input-group mb-3" style={{'marginTop':'1em'}}>
										  <div className="input-group-prepend">
										    <span className="input-group-text" id="basic-addon1">min</span>
										  </div>
										  <input type="text" className="form-control" style={{'marginRight': '0.5em'}} placeholder="Auto" value={this.state.ymin} onChange={e => {this.setState({ymin:e.target.value})}} aria-label="ymin" aria-describedby="basic-addon1"></input>
										  <div className="input-group-prepend">
										    <span className="input-group-text" id="basic-addon1">max</span>
										  </div>
										  <input type="text" className="form-control" placeholder="Auto" value={this.state.ymax} onChange={e => {this.setState({ymax:e.target.value})}} aria-label="ymax" aria-describedby="basic-addon1"></input>
										</div>
										<div className="form-check">
											<input className="form-check-input" checked={this.state.reverseY} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseY')} type="checkbox" id='reverseY'></input>
											<label className="form-check-label" htmlFor='reverseY'>Reverse</label>
										</div>
									</div>

									<div className="form-floating mb-3">
										<div className="form-text">
						  					<span>z-axis variable</span>
										</div>
			      						<Autosuggest
									      	id='zKeyAS'
									        suggestions={this.state.zKeySuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'zKeySuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'zKeySuggestions')}
									        shouldRenderSuggestions={x=>true}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'zKey')}
									        inputProps={{placeholder: 'z-axis', value: this.state.zKey, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of z axis variable'), id: 'zKey'}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
										<div className={this.state.zKey === '[2D plot]' ? "input-group mb-3 hidden": "input-group mb-3"} style={{'marginTop':'1em'}}>
										  <div className="input-group-prepend">
										    <span className="input-group-text" id="basic-addon1">min</span>
										  </div>
										  <input type="text" className="form-control" style={{'marginRight': '0.5em'}} placeholder="Auto" value={this.state.zmin} onChange={e => {this.setState({zmin:e.target.value})}} aria-label="zmin" aria-describedby="basic-addon1"></input>
										  <div className="input-group-prepend">
										    <span className="input-group-text" id="basic-addon1">max</span>
										  </div>
										  <input type="text" className="form-control" placeholder="Auto" value={this.state.zmax} onChange={e => {this.setState({zmax:e.target.value})}} aria-label="zmax" aria-describedby="basic-addon1"></input>
										</div>
										<div className={this.state.zKey === '[2D plot]' ? "input-group mb-3 hidden": "input-group mb-3"}>
											<input className="form-check-input" checked={this.state.reverseZ} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseZ')} type="checkbox" id='reverseZ'></input>
											<label className="form-check-label" htmlFor='reverseZ'>&nbsp;Reverse</label>
										</div>
									</div>
								</div>
							</div>
						</fieldset>
					</div>

					{/* plots */}
					<div className='col-9'>
					    <Plot
					      data={this.state.data.map(d => {
					        return {
					          x: d[this.state.xKey],
					          y: d[this.state.yKey],
					          z: this.state.zKey === '[2D plot]' ? [] : d[this.state.zKey],
					          type: this.state.zKey === '[2D plot]' ? 'scatter2d' : 'scatter3d',
					          mode: 'markers',
					          marker: {size: 2},
					          name: d._id
					        }
					      })}
					      onRelayout={e=>this.zoomSync(e)}
					      layout={{
					      	datarevision: Math.random(),
					      	autosize: true, 
							xaxis: {
							  title: {text: this.state.xKey},
							  range: this.generateRange(this.state.xmin, this.state.xmax, this.state.xKey, this.state.reverseX)
							},
							yaxis: {
							  title: {text: this.state.yKey},
							  range: this.generateRange(this.state.ymin, this.state.ymax, this.state.yKey, this.state.reverseY)
							},
						    margin: {t: 30, l: 0},
					      	scene: {
	    				      	xaxis:{
	    				      		title: {text: this.state.xKey},
	    				      		range: this.generateRange(this.state.xmin, this.state.xmax, this.state.xKey, this.state.reverseX)
	    				      	},
						      	yaxis:{
						      		title: {text: this.state.yKey},
						      		range: this.generateRange(this.state.ymin, this.state.ymax, this.state.yKey, this.state.reverseY)
						      	},
						      	zaxis:{
						      		title: {text: this.state.zKey},
						      		range: this.generateRange(this.state.zmin, this.state.zmax, this.state.zKey, this.state.reverseZ)
						      	}
						    }
					      }}
					      style={{width: '100%', height: '90%'}}
					      config={{
					      	showTips: false
					      }}
					    />
					</div>
				</div>
			</>
		)
	}
}

export default AVPlots