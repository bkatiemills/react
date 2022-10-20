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
			xKey2d: '',
			yKey2d: '',
			xKey3d: '',
			yKey3d: '',
			zKey3d: '',
			xKey2dSuggestions: [],
			yKey2dSuggestions: [],
			xKey3dSuggestions: [],
			yKey3dSuggestions: [],
			zKey3dSuggestions: [],
			title: '',
			data: [{}],
			argoPlatform: q.has('argoPlatform') ? q.get('argoPlatform') : ''
		}

		console.log(this.state)

		this.apiPrefix = 'http://3.88.185.52:8080/'
		this.vocab = {xKey2d: [], yKey2d: [], xKey3d: [], yKey3d: [], zKey3d: []}
		this.statusReporting = React.createRef()
		this.showAll = true // show all autoselect options when field is focused and empty

		let x = Promise.all(this.generateURLs().map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
			Promise.all(responses.map(res => res.json())).then(data => {
				let p = [].concat(...data)
				let vars = this.getDataKeys(p)
				p = p.map(d => this.transpose(d))
	        	this.vocab['xKey2d'] = vars
	        	this.vocab['yKey2d'] = vars
	        	this.vocab['xKey3d'] = vars
	        	this.vocab['yKey3d'] = vars
	        	this.vocab['zKey3d'] = vars
	        	this.setState({
	        		data:p, 
	        		variables: vars, 
	        		xKey2d: 'temperature',
	        		yKey2d: 'salinity',
	        		xKey3d: 'temperature',
	        		yKey3d: 'salinity',
	        		zKey3d: 'pressure'
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

		console.log(t)

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

	render(){
		return(
			<>
				<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
				<div className="accordion" id="plotAccordion">
				  <div className="accordion-item">
				    <h2 className="accordion-header" id="itemTable">
				      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseItemTable" aria-expanded="false" aria-controls="collapseItemTable">
				        Data Objects
				      </button>
				    </h2>
				    <div id="collapseItemTable" className="accordion-collapse collapse" aria-labelledby="itemTable" data-bs-parent="#accordionExample">
				      <div className="accordion-body">
				        <p>tbd</p>
				      </div>
				    </div>
				  </div>
				  <div className="accordion-item">
				    <h2 className="accordion-header" id="2dPlot">
				      <button className="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse2dPlot" aria-expanded="true" aria-controls="collapse2dPlot">
				        2D Plot
				      </button>
				    </h2>
				    <div id="collapse2dPlot" className="accordion-collapse collapse show" aria-labelledby="2dPlot" data-bs-parent="#accordionExample">
				      <div className="accordion-body">
        				<div className='row'>
        					<div className='col-3 overflow-auto'>
        						<fieldset ref={this.formRef}>
        							<div className='mapSearchInputs'>
        								<div className='verticalGroup'>
        									<div className="form-floating mb-3">
        										<div className="form-text">
        						  					<span>x-axis variable</span>
        										</div>
        			      						<Autosuggest
        									      	id='xKey3dAS'
        									        suggestions={this.state.xKey3dSuggestions}
        									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'xKey3dSuggestions')}
        									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'xKey3dSuggestions')}
        									        shouldRenderSuggestions={x=>true}
        									        getSuggestionValue={helpers.getSuggestionValue}
        									        renderSuggestion={helpers.renderSuggestion.bind(this, 'xKey3d')}
        									        inputProps={{placeholder: 'x-axis', value: this.state.xKey3d, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of x axis variable'), id: 'xKey3d'}}
        									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
        			      						/>
        									</div>        

        									<div className="form-floating mb-3">
        										<div className="form-text">
        						  					<span>y-axis variable</span>
        										</div>
        			      						<Autosuggest
        									      	id='yKey3dAS'
        									        suggestions={this.state.yKey3dSuggestions}
        									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'yKey3dSuggestions')}
        									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'yKey3dSuggestions')}
        									        shouldRenderSuggestions={x=>true}
        									        getSuggestionValue={helpers.getSuggestionValue}
        									        renderSuggestion={helpers.renderSuggestion.bind(this, 'yKey3d')}
        									        inputProps={{placeholder: 'y-axis', value: this.state.yKey3d, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of y axis variable'), id: 'yKey3d'}}
        									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
        			      						/>
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
            				          x: d[this.state.xKey2d],
            				          y: d[this.state.yKey2d],
            				          type: 'scatter2d',
            				          mode: 'markers',
            				          marker: {size: 2},
            				          name: d._id
            				        }
            				      })}
            				      layout={{
            				      	autosize: true, 
    								xaxis: {
    								  title: {
    								    text: this.state.xKey2d
    								  },
    								},
    								yaxis: {
    								  title: {
    								    text: this.state.yKey2d
    								  }
    								},
            					    margin: {t: 30, l: 0}
            				      }}
            				      style={{width: '100%', height: '90%'}}
            				    />
        					</div>
        				</div>
				      </div>
				    </div>
				  </div>
				  <div className="accordion-item">
				    <h2 className="accordion-header" id="3dPlot">
				      <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse3dPlot" aria-expanded="false" aria-controls="collapse3dPlot">
				        3D Plot
				      </button>
				    </h2>
				    <div id="collapse3dPlot" className="accordion-collapse collapse" aria-labelledby="3dPlot" data-bs-parent="#accordionExample">
				      <div className="accordion-body">
        				<div className='row'>
        					<div className='col-3 overflow-auto'>
        						<fieldset ref={this.formRef}>
        							<div className='mapSearchInputs'>
        								<div className='verticalGroup'>
        									<div className="form-floating mb-3">
        										<div className="form-text">
        						  					<span>x-axis variable</span>
        										</div>
        			      						<Autosuggest
        									      	id='xKey3dAS'
        									        suggestions={this.state.xKey3dSuggestions}
        									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'xKey3dSuggestions')}
        									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'xKey3dSuggestions')}
        									        shouldRenderSuggestions={x=>true}
        									        getSuggestionValue={helpers.getSuggestionValue}
        									        renderSuggestion={helpers.renderSuggestion.bind(this, 'xKey3d')}
        									        inputProps={{placeholder: 'x-axis', value: this.state.xKey3d, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of x axis variable'), id: 'xKey3d'}}
        									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
        			      						/>
        									</div>        

        									<div className="form-floating mb-3">
        										<div className="form-text">
        						  					<span>y-axis variable</span>
        										</div>
        			      						<Autosuggest
        									      	id='yKey3dAS'
        									        suggestions={this.state.yKey3dSuggestions}
        									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'yKey3dSuggestions')}
        									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'yKey3dSuggestions')}
        									        shouldRenderSuggestions={x=>true}
        									        getSuggestionValue={helpers.getSuggestionValue}
        									        renderSuggestion={helpers.renderSuggestion.bind(this, 'yKey3d')}
        									        inputProps={{placeholder: 'y-axis', value: this.state.yKey3d, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of y axis variable'), id: 'yKey3d'}}
        									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
        			      						/>
        									</div>        

        									<div className="form-floating mb-3">
        										<div className="form-text">
        						  					<span>z-axis variable</span>
        										</div>
        			      						<Autosuggest
        									      	id='zKey3dAS'
        									        suggestions={this.state.zKey3dSuggestions}
        									        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'zKey3dSuggestions')}
        									        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'zKey3dSuggestions')}
        									        shouldRenderSuggestions={x=>true}
        									        getSuggestionValue={helpers.getSuggestionValue}
        									        renderSuggestion={helpers.renderSuggestion.bind(this, 'zKey3d')}
        									        inputProps={{placeholder: 'z-axis', value: this.state.zKey3d, onChange: helpers.onAutosuggestChange.bind(this, 'Check value of z axis variable'), id: 'zKey3d'}}
        									        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
        			      						/>
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
            				          x: d[this.state.xKey3d],
            				          y: d[this.state.yKey3d],
            				          z: d[this.state.zKey3d],
            				          type: 'scatter3d',
            				          mode: 'markers',
            				          marker: {size: 2},
            				          name: d._id
            				        }
            				      })}
            				      layout={{
            				      	autosize: true, 
            				      	scene: {
        	    				      	xaxis:{title: {text: this.state.xKey3d}},
            					      	yaxis:{title: {text: this.state.yKey3d}},
            					      	zaxis:{title: {text: this.state.zKey3d}}
            					    },
            					    margin: {t: 30, l: 0}
            				      }}
            				      style={{width: '100%', height: '90%'}}
            				    />
        					</div>
        				</div>
				      </div>
				    </div>
				  </div>
				</div>
			</>
		)
	}
}

export default AVPlots