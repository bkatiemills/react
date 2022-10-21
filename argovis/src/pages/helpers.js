import { Popup, CircleMarker} from 'react-leaflet'

let helpers = {}

// polygon management

helpers.onPolyCreate = function(payload){
	helpers.fetchPolygon.bind(this)(payload.layer.getLatLngs()[0])
}

helpers.onPolyDelete = function(payload){
	this.setState({polygon: [], refreshData: true})
}

helpers.onPolyEdit = function(payload){
	payload.layers.eachLayer(layer => helpers.fetchPolygon.bind(this)(layer.getLatLngs()[0]))
}

helpers.fetchPolygon = function(coords){
	// coords == array of {lng: xx, lat: xx}, such as returned by getLatLngs
	let vertexes = coords.map(x => [x.lng, x.lat])
	vertexes.push(vertexes[0])
	this.setState({polygon: vertexes, refreshData: true})    	
}

// leaflet draw callbacks

helpers.onDrawStart = function(payload){
	helpers.clearLeafletDraw.bind(this)()
}

helpers.onDrawStop = function(payload){
	// if there's already a polygon, get rid of it.
	//helpers.clearLeafletDraw.bind(this)()
}

helpers.clearLeafletDraw = function(){
	if(Object.keys(this.fgRef.current._layers).length > 0){
		let layerID = Object.keys(this.fgRef.current._layers)[0]
		let layer = this.fgRef.current._layers[layerID]
		this.fgRef.current.clearLayers(layer)
	}
}

// update handlers

helpers.componentDidUpdate = function(){
	// generic logic to bind into each explore page's componentDidUpdate

	if(this.state.refreshData){
		this.formRef.current.setAttribute('disabled', 'true')
		if(this.statusReporting.current){
			helpers.manageStatus.bind(this)('downloading')
		}

		// handle backing out of an object selection
		if(!this.lookingForEntity() && this.state.observingEntity){
			this.state.observingEntity = false
			// eslint-disable-next-line
			this.state.startDate = this.earlier ; this.state.endDate = this.today
			if(this.defaultPolygon){
				// eslint-disable-next-line
				this.state.polygon = this.defaultPolygon
			}
		}

		// reformualte all URLs
		let urls = this.generateURLs().sort()

		//compare new URLs to old URLs; if any have changed, flag data for refetching.
		let refetch = false
		for(let i=0; i<urls.length; i++){
			if(JSON.stringify(urls[i])!==JSON.stringify(this.state.urls[i])){
				refetch = true
			}
		}
		if(urls.length === 0){
			// eslint-disable-next-line
			this.state.points = []
			refetch = true			
		}

		if(!refetch){
			helpers.manageStatus.bind(this)('ready')
			if(this.state.points.length>0){
				helpers.refreshMap.bind(this)()
			}
		} else {
			//promise all across a `fetch` for all new URLs, and update CircleMarkers for all new fetches
			Promise.all(urls.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
				Promise.all(responses.map(res => res.json())).then(data => {
					let newPoints = []
					let timestamps = []
					for(let i=0; i<data.length; i++){
						if(data[i].length>0 && data[i][0].code !== 404){
							timestamps = timestamps.concat(data[i].map(x => x[3]))
							newPoints = newPoints.concat(data[i].map(x => x.concat([this.dataset]))) // so there's something in the source position for everything other than argo
						}
					}
					newPoints = helpers.circlefy.bind(this)(newPoints)
					if(this.lookingForEntity()){
						timestamps = timestamps.map(x => { let d = new Date(x); return d.getTime()})
						let start = new Date(Math.min(...timestamps))
						let end = new Date(Math.max(...timestamps))
						
	   					// eslint-disable-next-line
	   					this.state.startDate = start.toISOString().slice(0,10) ; this.state.endDate = end.toISOString().slice(0,10) ; this.state.polygon = [] ; this.state.observingEntity = true
					}
					// eslint-disable-next-line
					this.state.points = newPoints
					helpers.manageStatus.bind(this)('rendering')
					helpers.refreshMap.bind(this)()
				})
			})
		}
	}
}

helpers.manageStatus = function(newStatus, messageArg){
	let statuses = {
		ready: ['Ready', 'ready'],  // message, classname
		downloading: ['Downloading...', 'busy'],
		rendering: ['Rendering...', 'busy'],
		needsRefresh: ['Refresh map when ready', 'busy'],
		error: [messageArg, 'error']
	}

	for(let key in statuses){
		if(key !== newStatus){
			this.statusReporting.current.classList.remove(statuses[key][1])
		}
	}
	this.statusReporting.current.classList.add(statuses[newStatus][1])
	this.statusReporting.current.textContent = statuses[newStatus][0]
}

helpers.refreshMap = function(){
	helpers.manageStatus.bind(this)('rendering')

	if(JSON.stringify(this.state.polygon) === '[]'){
		helpers.clearLeafletDraw.bind(this)()
	}

	this.setState({refreshData: false}, () => {
			if(this.state.points.length > 0){
				helpers.manageStatus.bind(this)('ready')
			} else {
				helpers.manageStatus.bind(this)('error', 'No data found for this search.')
			}
			this.formRef.current.removeAttribute('disabled')
			helpers.setQueryString.bind(this)()
		})
}

helpers.generateTemporoSpatialURL = function(route){
	//returns the api root, compression, time and space filters common to all endpoint queries

	let url = this.apiPrefix + route + '?compression=minimal'

	if(this.state.startDate !== ''){
		url += '&startDate=' + this.state.startDate + 'T00:00:00Z'
	}

	if(this.state.endDate !== ''){
		// set to one day later to include the end date
		let d = new Date(this.state.endDate)
		d = d.getTime() + 24*60*60*1000
		d = new Date(d)
		url += '&endDate=' + d.toISOString().replace('.000Z', 'Z')
	}  

	if(this.state.polygon.length>0){
		let tidypoly = [] // make sure longitudes are on [-180,180]
		for(let i=0; i<this.state.polygon.length; i++){
			let point = [this.state.polygon[i][0], this.state.polygon[i][1]]
			if(point[0] < -180){
				point[0] += 360
			} else if(point[0] > 180){
				point[0] -= 360
			}
			tidypoly.push(point)
		}
		url += '&polygon=[' + tidypoly.map(x => '['+x[0]+','+x[1]+']').join(',') + ']'
	}    

	return url	
}

helpers.circlefy = function(points){
	if(JSON.stringify(points) === '[]'){
		return []
	}

	if(points.hasOwnProperty('code') || points[0].hasOwnProperty('code')){
		return null
	}
	else {
		points = points.map(point => {return(
		  <CircleMarker key={point[0]+Math.random()} center={[point[2], point[1]]} radius={1} color={this.chooseColor(point[4])}>
		  	{this.genTooltip(point)}
		  </CircleMarker>
		)})
		return points
	}
}

helpers.setQueryString = function(entityParams){
	let queryManagement = new URL(window.location)

	queryManagement.searchParams.set('startDate', this.state.startDate)
	queryManagement.searchParams.set('endDate', this.state.endDate)

	let qparams = this.customQueryParams
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

	window.argoPrevious = queryManagement.search // keep track of query string changes so we know when to refresh

	window.history.pushState(null, '', queryManagement.toString());
}

// input setters

helpers.setDate = function(date, v, maxdays){
	// when setting dates from the UI, don't let the user ask for a timespan longer than some cutoff. 
	// If they do, move the other time bound to match.
	let start = new Date(this.state.startDate)
	let end = new Date(this.state.endDate)
	let delta = end.getTime() - start.getTime()
	let cutoff = maxdays*24*60*60*1000
	if(isNaN(v)){
		return
	} else{
		if(date === 'startDate'){
	    	start = new Date(v)
	    	if(end.getTime() - start.getTime() > cutoff){
	    		end = new Date(v + cutoff)
	    	} else if (start.getTime() > end.getTime()){
	    		end = new Date(v + delta)
	    	}  	
	    } else if(date === 'endDate'){
	    	end = new Date(v)
	    	if(end.getTime() - start.getTime() > cutoff){
	    		start = new Date(v - cutoff)
	    	} else if (start.getTime() > end.getTime()){
	    		start = new Date(v - delta)
	    	}  	
	    }
	    start = start.toISOString().slice(0,10)
	   	end = end.toISOString().slice(0,10)
    }
    let s = {...this.state}
    s.startDate = start
    s.endDate = end
    s.refreshData = true
    this.setState(s)
}

helpers.setToken = function(key, v, message){
	// key: state key labeling this input token
	// v: new value being considered
	let s = {...this.state}
	
		s[key] = v
	if(v && this.vocab[key] && !this.vocab[key].includes(v)){
		helpers.manageStatus.bind(this)('error', message)
		s.refreshData = false
    } else {
		s.refreshData = true
	}
	this.setState(s)
}

helpers.toggle = function(v){
	let s = {...this.state}
	s[v.target.id] = !s[v.target.id]
	s.refreshData = true
	this.setState(s)
}

// autosuggest callbacks

helpers.onAutosuggestChange = function(message, event, change){
	helpers.setToken.bind(this)(event.target.id, change.newValue, message)
}

helpers.onSuggestionsFetchRequested = function(suggestionList, update){
	let s = {}
	s[suggestionList] = helpers.getSuggestions.bind(this)(update.value, suggestionList.slice(0,-11))
	this.setState(s)
}

helpers.onSuggestionsClearRequested = function(suggestionList){
	let s = {}
	s[suggestionList] = []
	this.setState(s)
}

helpers.getSuggestions = function(value, vocabKey){
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;
  const notoken = this.showAll ? this.vocab[vocabKey] : [] 
  return inputLength === 0 ? notoken : this.vocab[vocabKey].filter(v =>
    String(v).toLowerCase().slice(0, inputLength) === inputValue
  );
};

helpers.getSuggestionValue = function(suggestion){
	return suggestion
}

helpers.renderSuggestion = function(inputState, suggestion){
	return(
	  <div 
	  	onClick={e => {this.state[inputState] = e.target.textContent}}
	  	onMouseOver={e => e.target.parentElement.classList.add('highlightSuggestion')}
	  	onMouseOut={e => e.target.parentElement.classList.remove('highlightSuggestion')}
	  	className='autocomplete-item'
	  >
	    {suggestion}
	  </div>
	)
}

// misc helpers

helpers.mungeTime = function(q, nDays, defaultEnd){
	// q == queryString, nDays == max number of days to allow, defaultEnd yyyy-mm-dd timestamp of endof default range; omit for today
	if(defaultEnd){
		this.today = new Date(defaultEnd)
	} else {
		this.today = new Date()
	}
	this.earlier = new Date(this.today.getTime() - (nDays * 24 * 60 * 60 * 1000)).toISOString().slice(0,10);
	this.today = this.today.toISOString().slice(0,10);
	this.state.startDate = this.earlier
	this.state.endDate = this.today
    if(q.has('endDate') && q.has('startDate')){
    	let t0 = new Date(q.get('startDate'))
    	let t1 = new Date(q.get('endDate'))
    	if(t1.getTime() - t0.getTime() < (nDays * 24 * 60 * 60 * 1000)){
    		this.state.startDate = q.get('startDate')
	    	this.state.endDate = q.get('endDate')
    	} 
    }
}

export default helpers