import React from 'react';
import { MapContainer, TileLayer, CircleMarker} from 'react-leaflet'
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
			cKey: '',
			xKeySuggestions: [],
			yKeySuggestions: [],
			zKeySuggestions: [],
			cKeySuggestions: [],
			cscaleSuggestions: [],
			xmin: '',
			xmax: '',
			ymin: '',
			ymax: '',
			zmin: '',
			zmax: '',
			cmin: '',
			cmax: '',
			cscale: 'Viridis',
			reverseX: false,
			reverseY: false,
			reverseZ: false,
			reverseC: false,
			title: '',
			data: [{}],
			metadata: {},
			traces: {},
			showAll: true,
			argoPlatform: q.has('argoPlatform') ? q.get('argoPlatform') : '',
			points: []
		}

		this.apiPrefix = 'http://3.88.185.52:8080/'
		this.vocab = {xKey: [], yKey: [], zKey: [], cKey: [], cscale: ['Blackbody','Bluered','Blues','Cividis','Earth','Electric','Greens','Greys','Hot','Jet','Picnic','Portland','Rainbow','RdBu','Reds','Viridis','YlGnBu','YlOrRd']}
		this.statusReporting = React.createRef()
		this.showAll = true // show all autoselect options when field is focused and empty

		let x = Promise.all(this.generateURLs().map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
			Promise.all(responses.map(res => res.json())).then(data => {
				let p = [].concat(...data)
				let traces = {}
				for(let i=0; i<p.length; i++){
					traces[p[i]._id] = {'visible': true}
				}
				let metakeys = Array.from(new Set(p.map(x=>x['metadata'])))
				let vars = this.getDataKeys(p)
				p = p.map(d => this.transpose(d))
				let mappoints = p.map(point => {
					return(
						<CircleMarker key={point._id+Math.random()} center={[point.latitude[0], point.longitude[0]]} radius={1} color={'yellow'}/>
					)
				})

	        	this.vocab['xKey'] = vars
	        	this.vocab['yKey'] = vars
	        	this.vocab['zKey'] = ['[2D plot]'].concat(vars)
	        	this.vocab['cKey'] = vars

	        	let m = Promise.all(this.generateMetadataURLs(metakeys).map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
					Promise.all(responses.map(mres => mres.json())).then(metadata => {
						metadata = [].concat(...metadata)
						let meta = {}
						for(let i=0; i<metadata.length; i++){
							meta[metadata[i]._id] = metadata[i]
						}
			        	this.setState({
			        		data:p, 
			        		variables: vars, 
			        		metadata: meta,
			        		traces: traces,
			        		points: mappoints,
			        		xKey: 'temperature',
			        		yKey: 'salinity',
			        		zKey: '[2D plot]',
			        		cKey: 'latitude'
			        	})
					})
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
		t['metadata'] = profile.metadata
		t['source'] = profile.source

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

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'argo/meta?id=' + x)
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

	toggleTrace(id){
		let s = {...this.state}
		s.traces[id].visible = !s.traces[id].visible
		this.setState(s)
	}

	toggleAll(){
		let s = {...this.state}
		let traces = {}
		if(this.state.showAll){
			for(let i=0; i<this.state.data.length; i++){
				traces[this.state.data[i]._id] = {'visible': false}
			}
			s.traces = traces
			s.showAll = false
		} else {
			for(let i=0; i<this.state.data.length; i++){
				traces[this.state.data[i]._id] = {'visible': true}
			}
			s.traces = traces
			s.showAll = true
		}
		this.setState(s)
	}

	render(){
		console.log(this.state)
		return(
			<>
				<div className='row'>
					<div className='col-3'>
						<fieldset ref={this.formRef}>
							<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
							<MapContainer style={{'height': '30vh'}} center={[0,0]} zoom={0} scrollWheelZoom={true}>
								<TileLayer
								attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
								url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
								/>
								{this.state.points}
							</MapContainer>
							<div className='mapSearchInputs overflow-auto' style={{'height':'55vh'}}>
								<div className='verticalGroup'>
									<div className="form-floating mb-3">
										<div className="form-text">
						  					<span><b>x-axis variable</b></span>
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
			      						<div className='row'>
			      							<div className='col-5' style={{'paddingRight': '0px'}}>
												<div className="form-text">
								  					<span>min</span>
												</div>
												<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.xmin} onChange={e => {this.setState({xmin:e.target.value})}} aria-label="xmin" aria-describedby="basic-addon1"></input>
											</div>
											<div className='col-5' style={{'paddingRight': '0px'}}>
												<div className="form-text">
								  					<span>max</span>
												</div>
												<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.xmax} onChange={e => {this.setState({xmax:e.target.value})}} aria-label="xmax" aria-describedby="basic-addon1"></input>
											</div>
											<div className='col-2'>
												<div className="form-text">
								  					<span>rev.</span>
												</div>
												<input className="form-check-input" checked={this.state.reverseX} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseX')} type="checkbox" id='reverseX'></input>
											</div>
										</div>
									</div>

									<hr/>

									<div className="form-floating mb-3">
										<div className="form-text">
						  					<span><b>y-axis variable</b></span>
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
			      						<div className='row'>
			      							<div className='col-5' style={{'paddingRight': '0px'}}>
												<div className="form-text">
								  					<span>min</span>
												</div>
												<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.ymin} onChange={e => {this.setState({ymin:e.target.value})}} aria-label="ymin" aria-describedby="basic-addon1"></input>
											</div>
											<div className='col-5' style={{'paddingRight': '0px'}}>
												<div className="form-text">
								  					<span>max</span>
												</div>
												<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.ymax} onChange={e => {this.setState({ymax:e.target.value})}} aria-label="ymax" aria-describedby="basic-addon1"></input>
											</div>
											<div className='col-2'>
												<div className="form-text">
								  					<span>rev.</span>
												</div>
												<input className="form-check-input" checked={this.state.reverseY} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseY')} type="checkbox" id='reverseY'></input>
											</div>
										</div>
									</div>

									<hr/>

									<div className="form-floating mb-3">
										<div className="form-text">
						  					<span><b>color variable</b></span>
										</div>
			      						<Autosuggest
									      	id='cKeyAS'
									        suggestions={this.state.cKeySuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'cKeySuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'cKeySuggestions')}
									        shouldRenderSuggestions={x=>true}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'cKey')}
									        inputProps={{placeholder: 'color axis', value: this.state.cKey, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of color axis variable'), id: 'cKey'}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
			      						<div className='row'>
			      							<div className='col-5' style={{'paddingRight': '0px'}}>
												<div className="form-text">
								  					<span>min</span>
												</div>
												<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.cmin} onChange={e => {this.setState({cmin:e.target.value})}} aria-label="cmin" aria-describedby="basic-addon1"></input>
											</div>
											<div className='col-5' style={{'paddingRight': '0px'}}>
												<div className="form-text">
								  					<span>max</span>
												</div>
												<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.cmax} onChange={e => {this.setState({cmax:e.target.value})}} aria-label="cmax" aria-describedby="basic-addon1"></input>
											</div>
											<div className='col-2'>
												<div className="form-text">
								  					<span>rev.</span>
												</div>
												<input className="form-check-input" checked={this.state.reverseC} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseC')} type="checkbox" id='reverseC'></input>
											</div>
										</div>
										<div className="form-text">
						  					<span>color scale</span>
										</div>
			      						<Autosuggest
									      	id='cscaleAS'
									        suggestions={this.state.cscaleSuggestions}
									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'cscaleSuggestions')}
									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'cscaleSuggestions')}
									        shouldRenderSuggestions={x=>true}
									        getSuggestionValue={helpers.getSuggestionValue}
									        renderSuggestion={helpers.renderSuggestion.bind(this, 'cscale')}
									        inputProps={{placeholder: 'color scale', value: this.state.cscale, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of color scale variable'), id: 'cscale'}}
									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      						/>
									</div>

									<hr/>

									<div className="form-floating mb-3">
										<div className="form-text">
						  					<span><b>z-axis variable</b></span>
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
				      						<div className='row'>
				      							<div className='col-5' style={{'paddingRight': '0px'}}>
													<div className="form-text">
									  					<span>min</span>
													</div>
													<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.zmin} onChange={e => {this.setState({zmin:e.target.value})}} aria-label="zmin" aria-describedby="basic-addon1"></input>
												</div>
												<div className='col-5' style={{'paddingRight': '0px'}}>
													<div className="form-text">
									  					<span>max</span>
													</div>
													<input type="text" className="form-control minmax" placeholder="Auto" value={this.state.zmax} onChange={e => {this.setState({zmax:e.target.value})}} aria-label="zmax" aria-describedby="basic-addon1"></input>
												</div>
												<div className='col-2'>
													<div className="form-text">
									  					<span>rev.</span>
													</div>
													<input className="form-check-input" checked={this.state.reverseZ} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseZ')} type="checkbox" id='reverseZ'></input>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</fieldset>
					</div>

					{/* plots */}
					<div className='col-9'>
					    <Plot
					      data={this.state.data.map((d,i) => {
					        return {
					          x: d[this.state.xKey],
					          y: d[this.state.yKey],
					          z: this.state.zKey === '[2D plot]' ? [] : d[this.state.zKey],
					          type: this.state.zKey === '[2D plot]' ? 'scatter2d' : 'scatter3d',
					          mode: 'markers',
					          marker: {
					          	size: 2,
					          	color: d[this.state.cKey],
					          	colorscale: this.state.cscale,
					          	cmin: this.generateRange(this.state.cmin, this.state.cmax, this.state.cKey, false)[0],
					          	cmax: this.generateRange(this.state.cmin, this.state.cmax, this.state.cKey, false)[1],
					          	showscale: i===0,
					          	reversescale: this.state.reverseC,
					          	colorbar: {
					          		title: this.state.cKey,
					          		titleside: 'right',
					          	}
					          },
					          name: d._id,
					          visible: this.state.traces[d._id] ? this.state.traces[d._id].visible : true
					        }
					      })}
					      onRelayout={e=>this.zoomSync(e)}
					      layout={{
					      	datarevision: Math.random(),
					      	autosize: true, 
					      	showlegend: false,
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
					      style={{width: '100%', height: '90vh'}}
					      config={{
					      	showTips: false
					      }}
					    />
					</div>
				</div>
				<div className='row'>
					<div className='col-12' style={{'paddingLeft': '2em', 'paddingRight': '5em', 'height': '50vh', 'overflow': 'auto'}}>
						<table className='table'>
							<thead style={{'position': 'sticky', 'top': 0, 'backgroundColor': '#FFFFFF'}}>
							    <tr>
							    	<th scope="col">
							    		<span style={{'marginRight':'0.5em'}}>Show</span>
										<input className="form-check-input" checked={this.state.showAll} onChange={(v) => this.toggleAll() } type="checkbox"></input>
							    	</th>
									<th scope="col">ID</th>
									<th scope="col">Original Files</th>
									<th scope="col">Longitude</th>
									<th scope="col">Latitude</th>
									<th scope="col">Timestamp</th>
									<th scope="col">DAC</th>
							    </tr>
							</thead>
							<tbody>
								{this.state.data.map(d => {
									if(d && JSON.stringify(d) !== '{}'){
										return(
											<tr key={Math.random()}>
												<td>
													<input key={d._id} className="form-check-input" checked={this.state.traces[d._id].visible} onChange={(v) => this.toggleTrace(d._id)} type="checkbox" id={d._id}></input>
												</td>
												<td>{d._id}</td>
												<td>
													{d.source.map(s => {
														if(s.url.includes('profiles/S')){
															return(<a key={Math.random()} className="btn btn-success" style={{'marginRight':'0.5em'}} href={s.url} role="button">BGC</a>)
														} else {
															return(<a key={Math.random()} className="btn btn-primary" href={s.url} role="button">Core</a>)
														}
													})}
												</td>
												<td>{d.longitude[0]}</td>
												<td>{d.latitude[0]}</td>
												<td>{d.timestamp[0]}</td>
												<td>{this.state.metadata[d.metadata].data_center}</td>
											</tr>
										)
									} else {
										return ''
									}
								})}
							</tbody>
						</table>
					</div>
				</div>
			</>
		)
	}
}

export default AVPlots