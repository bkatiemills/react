import { Popup, CircleMarker} from 'react-leaflet'

let helpers = {}

helpers.fetchPolygon = function(coords){
	// coords == array of {lng: xx, lat: xx}, such as returned by getLatLngs
	let vertexes = coords.map(x => [x.lng, x.lat])
	vertexes.push(vertexes[0])
	this.setState({polygon: vertexes, refreshData: true})    	
}

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

helpers.componentDidUpdate = function(){
	// generic logic to bind into each explore page's componentDidUpdate

	if(this.state.refreshData){
		if(this.statusReporting.current){
			helpers.manageStatus.bind(this)('downloading')
		}

		// handle backing out of an object selection
		if(!this.lookingForEntity() && this.state.observingEntity){
			this.state.observingEntity = false
			// eslint-disable-next-line
			this.state.startDate = this.earlier ; this.state.endDate = this.today
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
							newPoints = data[i].map(x => x.concat([this.dataset])) // so there's something in the source position for everything other than argo
							newPoints = helpers.circlefy.bind(this)(newPoints)
						}
					}
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
					if(newPoints.length>0){
						helpers.refreshMap.bind(this)()
					}
				})
			})
		}
	}
	helpers.setQueryString.bind(this)()
}

helpers.refreshMap = function(){
	helpers.manageStatus.bind(this)('rendering')

	if(JSON.stringify(this.state.polygon) === '[]'){
		helpers.clearLeafletDraw.bind(this)()
	}

	this.setState({refreshData: false}, () => {
			helpers.manageStatus.bind(this)('ready')
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
		url += '&polygon=[' + this.state.polygon.map(x => '['+x[0]+','+x[1]+']').join(',') + ']'
	}    

	return url	
}

helpers.circlefy = function(points){
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

helpers.setDate = function(date, v, maxdays){
	// when setting dates from the UI, don't let the user ask for a timespan longer than some cutoff. 
	// If they do, move the other time bound to match.
	let start = new Date(this.state.startDate)
	let end = new Date(this.state.endDate)
	let delta = end.getTime() - start.getTime()
	let cutoff = maxdays*24*60*60*1000
	if(isNaN(v)){
		console.log('undefined time', v)
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
	window.history.pushState(null, '', queryManagement.toString());
}

// autoselect helpers
helpers.getSuggestions = function(value, vocabKey){
  const inputValue = value.trim().toLowerCase();
  const inputLength = inputValue.length;

  return inputLength === 0 ? [] : this.vocab[vocabKey].filter(v =>
    String(v).toLowerCase().slice(0, inputLength) === inputValue
  );
};

helpers.getSuggestionValue = function(suggestion){
	return suggestion
}

helpers.renderSuggestion = function(suggestion){
	return(
	  <div>
	    {suggestion}
	  </div>
	)
}

helpers.onPolyCreate = function(payload){
	helpers.fetchPolygon.bind(this)(payload.layer.getLatLngs()[0])
}

helpers.onPolyDelete = function(payload){
	this.setState({polygon: [], refreshData: true})
}

helpers.onPolyEdit = function(payload){
	payload.layers.eachLayer(layer => helpers.fetchPolygon.bind(this)(layer.getLatLngs()[0]))
}

export default helpers