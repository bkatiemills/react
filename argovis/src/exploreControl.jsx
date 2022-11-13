// generic controls for dataset exploration maps

import React from 'react';
import Autosuggest from 'react-autosuggest';
import './index.css';

class ExploreControl extends React.Component {

	setDate(date, v){
		let d = new Date(v.target.valueAsNumber)
		let s = {}
		s[date] = d.toISOString().split('T')[0]
		this.props.statepasser(s)
	}

    setToken(key, v, vocab){
    	// key: state key labeling this input token
    	// v: new value being considered
    	// vocab: array of allowed values for this token (optional)
    	let s = {}
    	
	  	s[key] = v
    	if(v && vocab && !vocab.includes(v)){
    		//helpers.manageStatus.bind(this)('error', this.fieldNames[key])
   			s.refreshData = false
    	} else {
    		s.refreshData = true
    	}
    	console.log('setToken', s)
    	this.props.statepasser(s)
    }

	toggle(v, id){
		let s = {}
		s[id] = v.target.checked
		this.props.statepasser(s)
	}

	generateToggles(){
		return this.props.toggles.map(t => {return(
				<div key={t.id+Math.random()} className="form-check">
					<input className="form-check-input" checked={t.state} onChange={(v) => this.toggle(v, t.id)} type="checkbox" id={t.id}></input>
					<label className="form-check-label" htmlFor={t.id}>{t.label}</label>
				</div>
			)
		})
	}

	generateAutosuggests(){
		return this.props.autoselects.map(a => {return(
				<div key={a.id+Math.random()} className="form-floating mb-3">
			      <Autosuggest
			      	id={a.id}
			        suggestions={a.suggestions}
			        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this, a.suggestionsKey, a.vocab )}
			        onSuggestionsClearRequested={this.onSuggestionsClearRequested.bind(this, a.suggestionsKey)}
			        getSuggestionValue={this.getSuggestionValue}
			        renderSuggestion={this.renderSuggestion}
			        inputProps={{placeholder: 'Argo platform ID', value: a.value, onChange: this.onAutosuggestChange.bind(this, a.vocab), id: a.valueKey}}
			        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      />
				</div>
			)
		})
		//return(<div></div>)
	}

	getSuggestions(value, vocab){
		const inputValue = value.trim().toLowerCase();
		const inputLength = inputValue.length;

		let x = inputLength === 0 ? [] : vocab.filter(v =>
			v.toLowerCase().slice(0, inputLength) === inputValue
		);

		console.log('getSuggestions', x)
		return x
	};

	getSuggestionValue(suggestion){
		console.log('getSuggestionValue', suggestion)
		return suggestion
	}

	renderSuggestion(suggestion){
		console.log('renderSuggestion', suggestion)
		return(
		  <div>
		    {suggestion}
		  </div>
		)
	}

	onAutosuggestChange(vocab, event, change){
		console.log('onAutosuggestChange', event, change)
		this.setToken(event.target.id, change.newValue, vocab)
	}

	onSuggestionsFetchRequested(suggestionList, vocab, update){
		let s = {}
		s[suggestionList] = this.getSuggestions(update.value, vocab)
		console.log('onSuggestionsFetchRequested', s)
		this.props.statepasser(s)
	}

	onSuggestionsClearRequested(suggestionList){
		let s = {}
		s[suggestionList] = []
		this.props.statepasser(s)
	}

	render(){
		return(
			<>
				<span id='statusBanner' ref={this.statusReporting} className='statusBanner busy'>Downloading...</span>
				<div className='mapSearchInputs'>
					<h5>Search Control</h5>
					<div className='verticalGroup'>
						<div className="form-floating mb-3">
							<input type="password" className="form-control" id="apiKey" placeholder="" onInput={(v) => this.props.statepasser({'apiKey': v.target.value})}></input>
							<label htmlFor="apiKey">API Key</label>
							<div id="apiKeyHelpBlock" className="form-text">
						  		<a target="_blank" rel="noreferrer" href='https://argovis-keygen.colorado.edu/'>Get a free API key</a>
							</div>
						</div>
						<div className="form-floating mb-3">
							<input type="date" disabled={this.props.observingEntity} className="form-control" id="startDate" value={this.props.startDate} placeholder="" onChange={(v) => this.setDate('startDate', v)}></input>
							<label htmlFor="startDate">Start Date</label>
						</div>
						<div className="form-floating mb-3">
							<input type="date" disabled={this.props.observingEntity} className="form-control" id="endDate" value={this.props.endDate} placeholder="" onChange={(v) => this.setDate('endDate', v)}></input>
							<label htmlFor="endDate">End Date</label>
						</div>
					</div>

					<div className='verticalGroup'>
						{this.generateToggles()}
					</div>

					<div className='verticalGroup'>
				<div key={this.props.autoselects[0].id+Math.random()} className="form-floating mb-3">
			      <Autosuggest
			      	id={this.props.autoselects[0].id}
			        suggestions={this.props.autoselects[0].suggestions}
			        onSuggestionsFetchRequested={this.onSuggestionsFetchRequested.bind(this, this.props.autoselects[0].suggestionsKey, this.props.autoselects[0].vocab )}
			        onSuggestionsClearRequested={this.onSuggestionsClearRequested.bind(this, this.props.autoselects[0].suggestionsKey)}
			        getSuggestionValue={this.getSuggestionValue}
			        renderSuggestion={this.renderSuggestion}
			        inputProps={{placeholder: 'Argo platform ID', value: this.props.autoselects[0].value, onChange: this.onAutosuggestChange.bind(this, this.props.autoselects[0].vocab), id: this.props.autoselects[0].valueKey}}
			        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
			      />
				</div>
					</div>

				</div>
			</>
		)
	}
}

export default ExploreControl