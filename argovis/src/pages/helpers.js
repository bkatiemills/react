import React from 'react';
import { MapContainer, TileLayer, CircleMarker} from 'react-leaflet';
import GeometryUtil from "leaflet-geometryutil";
import Autosuggest from 'react-autosuggest';
import Plot from 'react-plotly.js';
import * as L from 'leaflet';
import 'proj4leaflet';

let helpers = {}

// polygon management

helpers.insertPointsInPolygon = function(coordinates) {
    let insertedPoints = [];

    	if(coordinates.length === 0){
    		return []
    	}

		for (let i = 0; i < coordinates.length-1; i++) {
	    const distance = helpers.calculateDistance(coordinates[i], coordinates[i+1]);
	    const numPoints = Math.min(Math.ceil(distance / 100), Math.floor(100/coordinates.length)); // ie put a point every 100 km, but not more than about 100 points per polygon

			insertedPoints.push(coordinates[i])

		    for (let k = 0; k < numPoints; k++) {
		        let interpolatedPoint = helpers.interpolatePoint(coordinates[i], coordinates[i+1], k/numPoints);
		        insertedPoints.push(interpolatedPoint);
		    }
		}

    insertedPoints.push(insertedPoints[0])

    return insertedPoints
}

helpers.calculateDistance = function(point1, point2) {
    const lon1 = point1[0]
    const lat1 = point1[1]
    const lon2 = point2[0]
    const lat2 = point2[1]

    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const earthRadius = 6371; // Earth's radius in kilometers

    const deltaLat = toRadians(lat2 - lat1);
    const deltaLon = toRadians(lon2 - lon1);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadius * c;
    return distance;
}

helpers.interpolatePoint = function(startPoint, endPoint, fraction) {
    const lon1 = startPoint[0]
    const lat1 = startPoint[1]
    const lon2 = endPoint[0]
    const lat2 = endPoint[1]

    const toRadians = (degrees) => degrees * (Math.PI / 180);
    const toDegrees = (radians) => radians * (180 / Math.PI);

    const deltaLon = (Math.PI / 180)*(lon2 - lon1);

    const lat1Rad = toRadians(lat1);
    const lat2Rad = toRadians(lat2);
    const lon1Rad = toRadians(lon1);

    const bearing = Math.atan2(
        Math.sin(deltaLon) * Math.cos(lat2Rad),
        Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon)
    );

    const angularDistance = Math.acos(Math.sin(lat1Rad) * Math.sin(lat2Rad) + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.cos(deltaLon));

    const interpolatedLat = Math.asin(Math.sin(lat1Rad) * Math.cos(fraction * angularDistance) + Math.cos(lat1Rad) * Math.sin(fraction * angularDistance) * Math.cos(bearing));
    const interpolatedLon = lon1Rad + Math.atan2(Math.sin(bearing) * Math.sin(fraction * angularDistance) * Math.cos(lat1Rad), Math.cos(fraction * angularDistance) - Math.sin(lat1Rad) * Math.sin(interpolatedLat));

    const interpolatedPoint = [toDegrees(interpolatedLon), toDegrees(interpolatedLat)];
    
    return interpolatedPoint;
}

helpers.onPolyCreate = function(p){
    
    // make a ring, insert extra points, and redraw the polygon
    let original_vertexes = p.layer.getLatLngs()[0].map(x => [x['lng'], x['lat']])
    original_vertexes.push(original_vertexes[0])
    let vertexes = helpers.insertPointsInPolygon(original_vertexes)
    p.layer.setLatLngs(vertexes.map(x => ({'lng': x[0], 'lat': x[1]})))
   
    let s = {...this.state}
    s.polygon = original_vertexes // use these to search mongo
    s.interpolated_polygon = vertexes // use these to draw something in leaflet that roughly resembles the mongo search region

    let maxdays = helpers.calculateDayspan.bind(this)(s)
    s.maxDayspan = maxdays

    if(maxdays < this.state.maxDayspan){
        // rethink the end date in case they drew a bigger polygon and the date range needs to be forcibly contracted
        let timebox = helpers.setDate.bind(this)('startDate', document.getElementById('startDate').valueAsNumber, maxdays)
        s.endDate = timebox[1]
    }
    s.phase = 'refreshData'
    s.urls = this.generateURLs(s)

    this.setState(s)
}

helpers.polyDeleteState = function(defaultPoly){
    return {
        polygon: defaultPoly, 
        interpolated_polygon: helpers.insertPointsInPolygon(defaultPoly), 
        maxDayspan: this.defaultDayspan, 
        urls: this.generateURLs({polygon: defaultPoly}),
        phase: 'refreshData'        
    }
}

helpers.onPolyDelete = function(defaultPoly){

    let s = helpers.polyDeleteState.bind(this)(defaultPoly)
    this.setState(s)

}

helpers.fetchPolygon = function(coords){
	// coords == array of {lng: xx, lat: xx}, such as returned by getLatLngs
	let vertexes = coords.map(x => [x.lng, x.lat])
	vertexes.push(vertexes[0])

	let newState = helpers.manageAllowedDates.bind(this)(vertexes)
	newState.phase = 'refreshData'
    newState.urls = this.generateURLs()

	this.setState(newState)
}

helpers.manageAllowedDates = function(vertexes){
	// given an array [[lon0, lat0], [lon1, lat1], ... , [lon0, lat0]] describing the current polygon
	// recompute the allowed timespan, and pull up endDate if necessary
	// return a munged state object reflecting these changes

	let s = {...this.state}
	s.polygon = vertexes
	s.interpolated_polygon = helpers.insertPointsInPolygon(vertexes)

	let maxdays = helpers.calculateDayspan.bind(this)(s)
	s.maxDayspan = maxdays

	if(maxdays < this.state.maxDayspan){
		// rethink the end date in case they drew a bigger polygon and the date range needs to be forcibly contracted
		let timebox = helpers.setDate.bind(this)('startDate', document.getElementById('startDate').valueAsNumber, maxdays, true)
		s.endDate = timebox[1]
	}	

	return s
}

helpers.estimateArea = function(vertexes){
	// given the coordinates from a geojson polygon, return the estimated area in sq km
	return GeometryUtil.geodesicArea(vertexes.map(x => {return({lng: x[0], lat: x[1]})}))/1000000
}

helpers.calculateDayspan = function(s){
	// s == state object being mutated
    
	if(JSON.stringify(s.polygon) === '[]'){
		return this.minDays
	}

	let area = helpers.estimateArea(s.polygon)
	if(area >= this.maxArea){
		return Math.min(this.minDays*this.dateRangeMultiplyer(s), this.maxDays)
	} else if (area < this.minArea){
		return this.maxDays
	} else {
		return Math.min(Math.floor(this.maxDays - (area-this.minArea)/(this.maxArea-this.minArea)*(this.maxDays-this.minDays))*this.dateRangeMultiplyer(s), this.maxDays)
	}
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
		if(this.defaultPolygon){
			this.state.polygon = this.defaultPolygon
		}
		let layerID = Object.keys(this.fgRef.current._layers)[0]
		let layer = this.fgRef.current._layers[layerID]
		this.fgRef.current.clearLayers(layer)
	}
}

// update handlers

helpers.phaseManager = function(prevProps, prevState, snapshot){

    // intended to be bound to componentDidUpdate, this function manages the state machine
    if(this.state.phase === 'refreshData'){
        setTimeout(() => { // this is a total hack, but it makes the 'downloading' status show up
            helpers.manageStatus.bind(this)('downloading')
            if(this.formRef.current){  
                this.formRef.current.setAttribute('disabled', 'true')
            }
            this.downloadData()
          }, 1);
    } else if(this.state.phase === 'remapData'){
        setTimeout(() => {
            helpers.manageStatus.bind(this)('rendering')
            if(this.formRef.current){  
                this.formRef.current.setAttribute('disabled', 'true')
            }
            this.replot()
        }, 1);
    } else if(this.state.phase === 'awaitingUserInput') {
        setTimeout(() => {
            helpers.manageStatus.bind(this)('actionRequired', 'Hit return or click outside the current input to update.')
        }, 1);
    } else if (this.state.phase === 'idle') {
        setTimeout(() => {
            if(this.state.data.length === 0 || this.state.data.every(arr => arr.length === 0)){
                helpers.manageStatus.bind(this)('error', 'No data found for this search.')
            } else {
                helpers.manageStatus.bind(this)('ready')
            }
            if(this.formRef.current){
                this.formRef.current.removeAttribute('disabled')
            }
        }, 1);
    }

    helpers.setQueryString.bind(this)()
}

helpers.componentDidUpdate = function(){
	// generic logic to bind into each explore page's componentDidUpdate

	let s = {...this.state}  // transform a copy of state until we're happy with it, and write it back

	if(this.reautofocus){
		// keep focus on autofocus where appropriate
		this.reautofocus.current.input.focus()
	}

	if(this.state.refreshData){
		this.formRef.current.setAttribute('disabled', 'true')
		if(this.statusReporting.current){
			helpers.manageStatus.bind(this)('downloading')
		}

		// handle backing out of an object selection
		if(!this.lookingForEntity(s) && this.state.observingEntity){
			s.observingEntity = false
			s.startDate = this.earlier
			s.endDate = this.today
			if(this.defaultPolygon){
				s.polygon = this.defaultPolygon
			}
		}

		// reformualte all URLs
		let urls = this.generateURLs(s).sort()
		//compare new URLs to old URLs; if any have changed, flag data for refetching.
		let refetch = false
		for(let i=0; i<urls.length; i++){
			if(JSON.stringify(urls[i])!==JSON.stringify(s.urls[i])){
				refetch = true
			}
		}
		if(urls.length === 0){
			s.points = []
			refetch = true			
		}

		if(!refetch){
			helpers.manageStatus.bind(this)('ready')
			if(s.points.length>0){
				this.refreshMap.bind(this)(s)
			}
		} else {
			//promise all across a `fetch` for all new URLs, and update CircleMarkers for all new fetches
			Promise.all(urls.map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
				Promise.all(responses.map(res => res.json())).then(data => {
					let newPoints = []
					let timestamps = []
					for(let i=0; i<data.length; i++){
						let bail = helpers.handleHTTPcodes.bind(this)(data[i].code)
						if(bail){
							return
						}
						if(data[i].length>0){
							timestamps = timestamps.concat(data[i].map(x => x[3]))
							newPoints = newPoints.concat(data[i])
						}
					}
					if(this.lookingForEntity(s)){
						timestamps = timestamps.map(x => { let d = new Date(x); return d.getTime()})
						let start = new Date(Math.min(...timestamps))
						let end = new Date(Math.max(...timestamps))
						s.startDate = start.toISOString().slice(0,10)
						s.endDate = end.toISOString().slice(0,10)
						s.polygon = []
						s.observingEntity = true
					}
					s.data = data
					s.points = this.mapmarkers.bind(this)(newPoints, s)
					helpers.manageStatus.bind(this)('rendering')
					this.refreshMap.bind(this)(s)
				})
			})
		}
	}
}

helpers.changeAPIkey = function(event){
    localStorage.setItem('apiKey', event.target.value)

    this.setState({
        apiKey: event.target.value,
        phase: 'idle'
    })
}

helpers.changeDates = function(date, e){
    let daterange = helpers.setDate.bind(this)(date, e.target.valueAsNumber, this.state.maxDayspan)
    let s = {...this.state}
    s.startDate = daterange[0]
    s.endDate = daterange[1]
    s.phase = 'refreshData'
    s.urls = this.generateURLs(s)
    s.suppressBlur = e.type === 'keypress'

    this.setState(s)
}

helpers.changeDepth = function(e){
    this.setState({
        depthRequired:e.target.value, 
        phase: 'refreshData',
        urls: this.generateURLs({depthRequired: e.target.value}),
        suppressBlur: e.type === 'keypress'
    })
}

helpers.inputAutoSuggest = function(fieldID, vocab, ref, event, change){
    // autosuggest management

    if(change.newValue !== ''){
        this.reautofocus = ref
    } else {
        this.reautofocus = null
    }

    let s = {...this.state}
    s[fieldID] = change.newValue
    s.observingEntity = Boolean(change.newValue)
    helpers.changeAutoSuggest.bind(this)(fieldID, vocab, s, event)
}

helpers.changeAutoSuggest = function(fieldID, vocab, interimState, event){
    // actually go looking for a platform on not-a-kwystroke events, or hits enter, and only if the specified platform is valid
    if(event.type === 'blur' && interimState.suppressBlur){
        return
    } else if(event.type === 'click' || event.type === 'blur' || (event.type === 'keypress' && event.key === 'Enter')){  
        if(vocab.includes(interimState[fieldID]) || interimState[fieldID] === '' ){
            let params = {}
            params[fieldID] = interimState[fieldID]
            interimState.urls = this.generateURLs(params)
            interimState.phase = 'refreshData'
        } 
        interimState.suppressBlur = (event.type === 'keypress' && event.key === 'Enter') || (event.type === 'click')
        this.setState(interimState)
    } else if (event.type === 'change'){
        this.setState(interimState)
    }
}

helpers.inputAutoSuggestPlots = function(fieldID, ref, resetLimits, event, change){
    // autosuggest management

    if(change.newValue !== ''){
        this.reautofocus = ref
    } else {
        this.reautofocus = null
    }

    let s = {...this.state}
    s[fieldID] = change.newValue
    helpers.changeAutoSuggestPlots.bind(this)(fieldID, s, resetLimits, event)
}

helpers.changeAutoSuggestPlots = function(fieldID, interimState, resetLimits, event){
    // actually go looking for a platform on not-a-kwystroke events, or hits enter, and only if the specified platform is valid
    if(event.type === 'blur' && interimState.suppressBlur){
        return
    } else if(event.type === 'click' || event.type === 'blur' || (event.type === 'keypress' && event.key === 'Enter')){  
        
        if(this.vocab[fieldID].includes(interimState[fieldID])){
            interimState.phase = 'remapData'
            if(resetLimits){
                interimState[fieldID.slice(0,1)+'min'] = ''
                interimState[fieldID.slice(0,1)+'max'] = ''
            }
            if(fieldID === 'cKey'){
                // define some default color schemes
                if(interimState[fieldID] === 'temperature'){
                    interimState.cscale = 'Thermal'
                } else if (interimState[fieldID] === 'salinity'){
                    interimState.cscale = 'Viridis'
                } else {
                    interimState.cscale = 'Electric'
                }
            }     
        }
        interimState.suppressBlur = (event.type === 'keypress' && event.key === 'Enter') || (event.type === 'click')
        this.setState(interimState)


    } else if (event.type === 'change'){
        this.setState(interimState)
    }
}

helpers.handleHTTPcodes = function(code){
	let bail = false

	if(code === 401){
		helpers.manageStatus.bind(this)('error', 'Invalid API key; see the "Get a free API key" link below.')
		this.formRef.current.removeAttribute('disabled')
		bail = true
	}
    if(code === 413){
        helpers.manageStatus.bind(this)('error', 'Request too large; try reducing the polygon size.')
        this.formRef.current.removeAttribute('disabled')
        bail = true
    }
	if(code === 429){
		helpers.manageStatus.bind(this)('error', 'Too many requests too fast; please wait a minute, and consider using an API key (link below).')
		this.formRef.current.removeAttribute('disabled')
		bail = true
	}

	return bail
}

helpers.manageStatus = function(newStatus, messageArg){
	let statuses = {
		ready: ['Ready', 'ready'],  // message, classname
		downloading: ['Downloading...', 'busy'],
		rendering: ['Rendering...', 'busy'],
		needsRefresh: ['Refresh map when ready', 'busy'],
		error: [messageArg, 'error'],
		actionRequired: [messageArg, 'busy']
	}

	for(let key in statuses){
		if(key !== newStatus){
			this.statusReporting.current.classList.remove(statuses[key][1])
		}
	}
	this.statusReporting.current.classList.add(statuses[newStatus][1])
	this.statusReporting.current.textContent = statuses[newStatus][0]
}

helpers.refreshMap = function(state){
	// generic map refresh logic; expects state.points to be populated with whatever should
	// be on the map this time around; triggers redraw with a setState and calls back some post-render logic
	helpers.manageStatus.bind(this)('rendering')

	if(JSON.stringify(state.polygon) === '[]'){
		helpers.clearLeafletDraw.bind(this)()
	}

	this.setState({...state, refreshData: false}, () => {

		//state.points might be a flat list or an object; determine if there's any data to plot
		let nPoints = 0
		if(this.state.points.hasOwnProperty('length')){
		nPoints = this.state.points.length
		} else {
		for(let k in this.state.points){
			nPoints += this.state.points[k].length
		}
		}
		if(nPoints > 0){
			helpers.manageStatus.bind(this)('ready')
		} else {
			helpers.manageStatus.bind(this)('error', 'No data found for this search.')
		}
		this.formRef.current.removeAttribute('disabled')
		helpers.setQueryString.bind(this)()
	})
}

helpers.generateTemporoSpatialURL = function(prefix, route, startDate, endDate, polygon, depthRequired){
	//returns the api root, compression, time and space filters common to all endpoint queries

	let url = prefix + route + '?compression=minimal'

	if(depthRequired){
		url += '&verticalRange=' + depthRequired + ',20000'
	}

	if(startDate !== ''){
		url += '&startDate=' + startDate + 'T00:00:00Z'
	}

	if(endDate !== ''){
		// set to one day later to include the end date
		let d = new Date(endDate)
		d = d.getTime() + 24*60*60*1000
		d = new Date(d)
		url += '&endDate=' + d.toISOString().replace('.000Z', 'Z')
	}  

	if(polygon.length>0){
		let tidypoly = helpers.tidypoly(polygon)
		url += '&polygon=[' + tidypoly.map(x => '['+x[0]+','+x[1]+']').join(',') + ']'
	}    
	return url	
}

helpers.tidypoly = function(polygon){
	// given geojson polygon vertexes [[lon0,lat0],[lon1,lat1],...,[lon0,lat0]],
	// return the same polygon on [-180,180]

	let tidypoly = [] // make sure longitudes are on [-180,180]
	for(let i=0; i<polygon.length; i++){
		let point = [polygon[i][0], polygon[i][1]]
		point[0] = helpers.tidylon(point[0])
		tidypoly.push(point)
	}

	return tidypoly
}

helpers.tidylon = function(lon){
    // given a longitude, return it on [-180,180]
    while(lon < -180){
        lon += 360;
    }
    while(lon > 180){
        lon -= 360;
    }
    return lon;
}

helpers.circlefy = function(points, state){
	if(JSON.stringify(points) === '[]'){
		return []
	}

	if(points.hasOwnProperty('code') || points[0].hasOwnProperty('code')){
		return null
	}
	else {
		points = points.map(point => {return(
		  <CircleMarker key={point[0]+Math.random()} center={[point[2], helpers.mutateLongitude(point[1], parseFloat(state.centerlon)) ]} radius={2} color={this.chooseColor(point)}>
		  	{this.genTooltip.bind(this)(point, state)}
		  </CircleMarker>
		)})
		return points
	}
}

helpers.setQueryString = function(){
	let queryManagement = new URL(window.location)

	let qparams = this.customQueryParams
	for(let i=0; i<qparams.length; i++){
		if(this.state.hasOwnProperty(qparams[i]) && this.state[qparams[i]] !== ''){
			queryManagement.searchParams.set(qparams[i], Array.isArray(this.state[qparams[i]]) ? JSON.stringify(this.state[qparams[i]]) : this.state[qparams[i]] )
		} else{
			queryManagement.searchParams.delete(qparams[i])
		}
	} 

	window.argoPrevious = decodeURIComponent(queryManagement.search) // keep track of query string changes so we know when to refresh

	window.history.pushState(null, '', decodeURIComponent(queryManagement.toString()));
}

// input setters

helpers.setDate = function(date, v, maxdays){
	// when setting dates from the UI, don't let the user ask for a timespan longer than some cutoff. 
	// If they do, move the other time bound to match.

	let start = new Date(this.state.startDate)
	let end = new Date(this.state.endDate)
	let cutoff = maxdays*24*60*60*1000

	if(isNaN(v)){
		return
	} else{
		if(date === 'startDate'){
	    	start = new Date(v)
            if(end.getTime() - start.getTime() > cutoff || end.getTime() - start.getTime() < 0){
                end = new Date(v + cutoff)
            }	
	    } else if(date === 'endDate'){
	    	end = new Date(v)
            if(end.getTime() - start.getTime() > cutoff || end.getTime() - start.getTime() < 0){
                start = new Date(v - cutoff)
            }
	    }
	    start = start.toISOString().slice(0,10)
	   	end = end.toISOString().slice(0,10)
    }
	
    return [start, end]
}

helpers.setToken = function(key, v, persist){
	// key: state key labeling this input token
	// v: new value being considered
	// persist: write this to local storage

	if(persist){
		localStorage.setItem(key, v);
	}

	let s = {...this.state}
	s[key] = v
	s.phase = 'refreshData'

	this.setState(s)
}

helpers.toggle = function(v){
	let s = {...this.state}
	s[v.target.id] = !s[v.target.id]
	s.phase = 'remapData'
	this.setState(s)
}

// autosuggest callbacks

helpers.onAutosuggestChange = function(fieldID, ref, event, change){
	if(change.newValue !== ''){
		this.reautofocus = ref
	} else {
		this.reautofocus = null
	}
	helpers.setToken.bind(this)(fieldID, change.newValue)
}

helpers.onSuggestionsFetchRequested = function(suggestionList, update){
	let s = {}
	s[suggestionList] = helpers.getSuggestions.bind(this)(update.value, suggestionList.slice(0,-11))
    s.phase = 'awaitingUserInput'
	this.setState(s)
}

helpers.onSuggestionsClearRequested = function(suggestionList){
	// let s = {}
	// s[suggestionList] = []
	// this.setState(s)
    // seems to fire twice and not actually help much, just nerf this
    return
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
	  	onClick={e => {
            let s = {...this.state}
            s[inputState] = e.target.textContent
            s.phase = 'refreshData'
            s.urls = this.generateURLs(s)

            this.setState(s)
        }}
	  	onMouseOver={e => e.target.parentElement.classList.add('highlightSuggestion')}
	  	onMouseOut={e => e.target.parentElement.classList.remove('highlightSuggestion')}
	  	className='autocomplete-item'
	  >
	    {suggestion}
	  </div>
	)
}

// plotting page helpers

helpers.transpose = function(profile, metadata){
	// given a <profile> object returned with data from the API
	// and its corresponding metadata record <metadata>
	// transpose the data record into an object keyed by data_key, and values as depth-ordered list of measurements
	let t = {}
	let dinfo = {...metadata, ...profile}.data_info
	for(let i=0; i<dinfo[0].length; i++){
		t[dinfo[0][i]] = profile.data[i]
		if(!this.units.hasOwnProperty(dinfo[0][i])){
			this.units[dinfo[0][i]] = dinfo[2][i][dinfo[1].indexOf('units')]
		}
	}

	t['longitude'] = Array(profile.data[0].length).fill(profile.geolocation.coordinates[0],0)
	t['latitude'] = Array(profile.data[0].length).fill(profile.geolocation.coordinates[1],0)
	let msse = new Date(profile.timestamp) // handle times internally as ms since epoch
	t['timestamp'] = Array(profile.data[0].length).fill(msse.getTime(),0)
	t['month'] = Array(profile.data[0].length).fill((msse.getMonth()+1),0)
	t['year'] = Array(profile.data[0].length).fill(msse.getFullYear(),0)
	t['_id'] = profile._id
	t['metadata'] = profile.metadata
	t['source'] = profile.source

	return t
}

helpers.mergePoints = function(points){
	// given an array of objects returned by helpers.transpose,
	// combine them into a single object where all keys are concatenated into arrays
	// appropriate for making a single trace out of what otherwise would have been n single-point traces
	let m = {}
	for(let i=0; i<Object.keys(points[0]).length; i++){
		let key = Object.keys(points[0])[i]
		let a = []
		for(let k=0; k<points.length; k++){
			a = a.concat(points[k][key])
		}
		m[key] = a
	} 
	return m
}

helpers.getDataKeys = function(data, meta){
	// given an array of profile objects <data> and corresponding metadata <meta>, 
	// return a global list of keys, plus coordinates

	let keys = ['longitude', 'latitude', 'timestamp']
	let dinfo = null
	for(let i=0; i<data.length; i++){
		dinfo = {...meta[data[i].metadata], ...data[i]}.data_info
		keys = keys.concat(dinfo[0])
	}
	let s = new Set(keys)
	return Array.from(s)
}

helpers.generateRange = function(min, max, dataKey, reverse){
	// returns an array [minimum, maximum] as defined by <min> and <max>,
	// unless min and or max is null, in which case an appropriate limit is computed from <dataKey>

	// turn a human string time into something sensible 
	if(dataKey === 'timestamp'){
		if(min !== ''){
			min = new Date(min)
			min = min.getTime()
		}
		if(max !== ''){
			max = new Date(max)
			max = max.getTime()
		}
	}

	if(min !== '' && max !== ''){
		if(reverse){
			return [Number(max), Number(min)]
		} else {
			return [Number(min), Number(max)]
		}
	}

	let range = []
	let data = this.state.data.map(x=>x[dataKey])
	let datalist = ([].concat(...data)).filter(x=>typeof x === 'number')
	let dataMin = datalist.reduce((a, b) => Math.min(a, b), Infinity); 
	let dataMax = datalist.reduce((a, b) => Math.max(a, b), -Infinity);
	let buffer = (dataMax - dataMin)*0.05
	range[0] = min === '' ? dataMin - buffer : Number(min)
	range[1] = max === '' ? dataMax + buffer : Number(max)

	if(reverse){
		return [range[1], range[0]]
	} else {
		return range
	}
}

helpers.zoomSync = function(event){
	// when plotly generates an <event> from click-and-drag zoom,
	// make sure the manual inputs keep up

	let s = {...this.state}

	if(event.hasOwnProperty("xaxis.range[0]") && event.hasOwnProperty("xaxis.range[1]")){
		s.xmin = event["xaxis.range[0]"]
		s.xmax = event["xaxis.range[1]"]
		if(s.xKey === 'timestamp'){
			s.xmin = s.xmin.slice(0,10)
			s.xmax = s.xmax.slice(0,10)
			let a = new Date(s.xmin)
			let b = new Date(s.xmax)
			if(b<a){
				let c = s.xmin
				s.xmin = s.xmax
				s.xmax = c
			}
		} else {
			let a = Number(s.xmin)
			let b = Number(s.xmax)
			if(b<a){
				let c = s.xmin
				s.xmin = s.xmax
				s.xmax = c
			}
		}
	}

	if(event.hasOwnProperty("yaxis.range[0]") && event.hasOwnProperty("yaxis.range[1]")){
		s.ymin = event["yaxis.range[0]"]
		s.ymax = event["yaxis.range[1]"]
		if(s.yKey === 'timestamp'){
			s.ymin = s.ymin.slice(0,10)
			s.ymax = s.ymax.slice(0,10)
			let a = new Date(s.ymin)
			let b = new Date(s.ymax)
			if(b<a){
				let c = s.ymin
				s.ymin = s.ymax
				s.ymax = c
			}
		} else {
			let a = Number(s.ymin)
			let b = Number(s.ymax)
			if(b<a){
				let c = s.ymin
				s.ymin = s.ymax
				s.ymax = c
			}
		}
	}
	
	this.setState(s)
}

helpers.toggleTrace = function(id){
	let s = {...this.state}

	if(s.counterTraces.includes(id)){
		s.counterTraces.splice(s.counterTraces.indexOf(id), 1)
	} else {
		s.counterTraces.push(id)
	}

	s.refreshData = true
	this.setState(s)
}

helpers.showTrace = function(id){
	if(this.state.counterTraces.includes(id)){
		return !this.state.showAll
	} else {
		return this.state.showAll
	}
}

helpers.toggleAll = function(){
	let s = {...this.state}
	s.showAll = !s.showAll
	s.counterTraces = []
	s.refreshData = true
	this.setState(s)
}

helpers.generateAxisTitle = function(key){
    let units = this.units[key] ? ' ['+this.units[key]+']' : ''
    return key + units
}

helpers.resetAxes = function(event){
	let s = {...this.state}
	s.phase = 'remapData'
	s[event.target.id.slice(0,1)+'min'] = ''
	s[event.target.id.slice(0,1)+'max'] = ''
	this.setState(s)
}

helpers.resetAllAxes = function(event){
	let s = {...this.state}
	s.phase = 'remapData'
	let resets = ['xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax', 'cmin', 'cmax']
	for(let i=0; i<resets.length; i++){
		s[resets[i]] = ''
	}
	this.setState(s)
}

helpers.genericTooltip = function(data){
	// generic tooltip constructor for plotting pages

	if(JSON.stringify(data) === '{}'){
		return []
	}
	let tooltips = []
	for(let i=0; i<data.timestamp.length; i++){
		let text = []
		text.push('Record ID ' + data['_id'][i] + '<br>')
		text.push('Longitude / Latitude: ' + helpers.mungePrecision(data['longitude'][i]) + ' / ' + helpers.mungePrecision(data['latitude'][i]))
		text.push('Timestamp: ' + new Date(data['timestamp'][i]) + '<br>')
		let defaultItems = ['longitude', 'latitude', 'timestamp', 'pressure']
		if(!defaultItems.includes(this.state.xKey)){
			if(data.hasOwnProperty(this.state.xKey)){
                let units = this.units[this.state.xKey] ? this.units[this.state.xKey] : ''
				text.push(this.state.xKey + ': ' + helpers.mungePrecision(data[this.state.xKey][i]) + ' ' + units)
			}
		}
		if(!defaultItems.includes(this.state.yKey)){
			if(data.hasOwnProperty(this.state.yKey)){
                let units = this.units[this.state.yKey] ? this.units[this.state.yKey] : ''
				text.push(this.state.yKey + ': ' + helpers.mungePrecision(data[this.state.yKey][i]) + ' ' + units)
			}
		}
		if(!defaultItems.includes(this.state.zKey) && this.state.zKey !== '[2D plot]'){
			if(data.hasOwnProperty(this.state.zKey)){
                let units = this.units[this.state.zKey] ? this.units[this.state.zKey] : ''
				text.push(this.state.zKey + ': ' + helpers.mungePrecision(data[this.state.zKey][i]) + ' ' + units)
			}
		}
		if(!defaultItems.includes(this.state.cKey)){
			if(data.hasOwnProperty(this.state.cKey)){
                let units = this.units[this.state.cKey] ? this.units[this.state.cKey] : ''
				text.push(this.state.cKey + ': ' + helpers.mungePrecision(data[this.state.cKey][i]) + ' ' + units)
			}
		}
		text = text.map(s => s.trim())
        text = [...new Set(text)]
		tooltips.push(text.join('<br>'))
	}

	return tooltips
}

helpers.changePlotAxisLimits = function(key, v, e){

    if(this.state[v] === 'timestamp'){
        console.log(e.target.value)
        this.setState({
            [key]: e.target.value,
            phase: 'remapData'
        })
    } else if(!Number.isNaN(parseFloat(e.target.value))) {
        this.setState({
            [key]: parseFloat(e.target.value),
            phase: 'remapData'
        })
    }
}

helpers.prepPlotlyState = function(markerSize){

	let xrange = helpers.generateRange.bind(this)(this.state.xmin, this.state.xmax, this.state.xKey, this.state.reverseX)
	let yrange = helpers.generateRange.bind(this)(this.state.ymin, this.state.ymax, this.state.yKey, this.state.reverseY)
	let zrange = helpers.generateRange.bind(this)(this.state.zmin, this.state.zmax, this.state.zKey, this.state.reverseZ)
	let crange = helpers.generateRange.bind(this)(this.state.cmin, this.state.cmax, this.state.cKey, this.state.reverseC)

	let colortics = [[],[]]
	if(this.state.cKey === 'timestamp'){
		colortics = helpers.generateTimetics(crange[0], crange[1])
	}
			
    // discourage color scale from drawing any number of times other than exactly one
    let scaleDrawn = false
    let needsScale = function(isVisible){
        if(!scaleDrawn && isVisible){
            scaleDrawn = true
            return true
        } else {
            return false
        }
    }

    // generate data and layout
    this.data = this.state.data.map((d,i) => {
        if(d.hasOwnProperty(this.state.xKey) && d.hasOwnProperty(this.state.yKey) && (d.hasOwnProperty(this.state.zKey) || this.state.zKey === '[2D plot]') && d.hasOwnProperty(this.state.cKey)){
            
            // filter off any points that have null for color value, don't plot these.
            let x = d[this.state.xKey].filter((e,j) => {return d[this.state.cKey][j] !== null})
            let y = d[this.state.yKey].filter((e,j) => {return d[this.state.cKey][j] !== null})
            let t = d['timestamp'].filter((e,j) => {return d[this.state.cKey][j] !== null}) // timestamp gets used to step through valid points later, keep it synced with the filtering 
            let z = []
            if(this.state.zKey !== '[2D plot]'){
                z = d[this.state.zKey].filter((e,j) => {return d[this.state.cKey][j] !== null})
            }
            let c = d[this.state.cKey].filter(x => x!==null)
            let filteredData = {...d}
            filteredData[this.state.xKey] = x
            filteredData[this.state.yKey] = y
            filteredData[this.state.zKey] = z
            filteredData[this.state.cKey] = c
            filteredData['timestamp'] = t
            return {
                x: filteredData[this.state.xKey],
                y: filteredData[this.state.yKey],
                z: filteredData[this.state.zKey],
                text: this.genTooltip.bind(this)(filteredData),
                hoverinfo: 'text',
                type: this.state.zKey === '[2D plot]' ? 'scattergl' : 'scatter3d',
                connectgaps: true,
                mode: this.state.connectingLines ? 'markers+lines' : 'markers',
                line: {
                    color: 'grey'
                },
                marker: {
                    size: markerSize,
                    color: filteredData[this.state.cKey],
                    colorscale: this.state.cscale === 'Thermal' ? [[0,'rgb(3, 35, 51)'], [0.09,'rgb(13, 48, 100)'], [0.18,'rgb(53, 50, 155)'], [0.27,'rgb(93, 62, 153)'], [0.36,'rgb(126, 77, 143)'], [0.45,'rgb(158, 89, 135)'], [0.54,'rgb(193, 100, 121)'], [0.63,'rgb(225, 113, 97)'], [0.72,'rgb(246, 139, 69)'], [0.81,'rgb(251, 173, 60)'], [0.90,'rgb(246, 211, 70)'], [1,'rgb(231, 250, 90)']] : this.state.cscale,
                    cmin: Math.min(crange[0], crange[1]),
                    cmax: Math.max(crange[0], crange[1]),
                    showscale: needsScale(helpers.showTrace.bind(this)(d._id)),
                    reversescale: this.state.reverseC,
                    colorbar: {
                        title: {text: helpers.generateAxisTitle.bind(this)(this.state.cKey), side: 'right'},
                        titleside: 'right',
                        tickmode: this.state.cKey === 'timestamp' ? 'array' : 'auto',
                        ticktext: colortics[0],
                        tickvals: colortics[1]
                    }
                },
                name: d._id,
                visible: this.state.counterTraces.includes(d._id) ? !this.state.showAll : this.state.showAll
            }
        } else {
            return {}
        }
    })

    this.layout = {
        datarevision: Math.random(),
        autosize: true, 
        showlegend: false,
        font: {
            size: 20
        },
        xaxis: {
            title: {text: helpers.generateAxisTitle.bind(this)(this.state.xKey)},
            range: xrange,
            type: this.state.xKey === 'timestamp' ? 'date' : 'linear'
        },
        yaxis: {
            title: {text: helpers.generateAxisTitle.bind(this)(this.state.yKey)},
            range: yrange,
            type: this.state.yKey === 'timestamp' ? 'date' : 'linear',
        },
        margin: {t: 30},
        scene: {
            xaxis:{
                title: {text: helpers.generateAxisTitle.bind(this)(this.state.xKey)},
                range: xrange,
                type: this.state.xKey === 'timestamp' ? 'date' : 'linear'
            },
            yaxis:{
                title: {text: helpers.generateAxisTitle.bind(this)(this.state.yKey)},
                range: yrange,
                type: this.state.yKey === 'timestamp' ? 'date' : 'linear'
            },
            zaxis:{
                title: {text: helpers.generateAxisTitle.bind(this)(this.state.zKey)},
                range: zrange,
                type: this.state.zKey === 'timestamp' ? 'date' : 'linear'
            }
        }
    }

    this.setState({
        phase: 'idle',
        suppressBlur: false
    })

		
}

helpers.plotHTML = function(){

	return(
		<>
		<div style={{'width':'100vw', 'textAlign': 'center', 'padding':'0.5em', 'fontStyle':'italic'}} className='d-lg-none'>Use the right-hand scroll bar to scroll down for plot controls</div>
		<div className='row' style={{'width':'100vw'}}>
			<div className='col-lg-3 order-last order-lg-first'>
				<fieldset ref={this.formRef}>
					<span id='statusBanner' ref={this.statusReporting} className={'statusBanner busy'}>Downloading...</span>
					<MapContainer style={{'height': '30vh'}} center={[25,parseFloat(this.state.centerlon)]} zoom={0} scrollWheelZoom={true}>
						<TileLayer
						attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
						/>
						{this.state.points}
					</MapContainer>
					<div className='mapSearchInputs plotting-scrollit'>
						<div className='verticalGroup'>
							<h5>Axis Controls</h5>
							<div className="form-floating mb-3">
								<div className="form-text">
				  					<span><b>x-axis variable</b></span>
								</div>
	      						<Autosuggest
							      	id='xKeyAS'
                                    ref={this.xKeyRef}
							        suggestions={this.state.xKeySuggestions}
							        onSuggestionsFetchRequested={helpers.onSuggestionsFetchRequested.bind(this, 'xKeySuggestions')}
							        onSuggestionsClearRequested={helpers.onSuggestionsClearRequested.bind(this, 'xKeySuggestions')}
							        getSuggestionValue={helpers.getSuggestionValue}
							        renderSuggestion={helpers.renderSuggestion.bind(this, 'xKey')}
							        inputProps={{
                                        placeholder: 'x-axis', 
                                        value: this.state.xKey,
                                        onKeyPress: helpers.changeAutoSuggestPlots.bind(this, 'xKey', this.state, true),  
                                        onBlur: helpers.changeAutoSuggestPlots.bind(this, 'xKey', this.state, true), 
                                        onChange: helpers.inputAutoSuggestPlots.bind(this, 'xKey', this.xKeyRef, true), 
                                        id: 'xKey'
                                    }}
							        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
	      						/>
	      						<div className='row'>
	      							<div className='col-6' style={{'paddingRight': '0px'}}>
										<div className="form-text">
						  					<span>min</span>
										</div>
										<input 
											type={this.state.xKey === 'timestamp' ? "date" : "text"} 
											className="form-control minmax" 
											placeholder="Auto" 
											value={this.state.xmin} 
											onChange={e => {
												this.setState({
                                                    xmin: e.target.value,
                                                    phase: 'awaitingUserInput'
                                                })}
											}
                                            onBlur={e => {
                                                if(!this.state.suppressBlur ){
                                                    helpers.changePlotAxisLimits.bind(this)('xmin', 'xKey', e)
                                                }
                                            }}
											onKeyPress={e => {
                                                if(e.key==='Enter'){
                                                    helpers.changePlotAxisLimits.bind(this)('xmin', 'xKey', e)
                                                }
                                            }}
											aria-label="xmin" 
											aria-describedby="basic-addon1"/>
									</div>
									<div className='col-6' style={{'paddingRight': '0px'}}>
										<div className="form-text">
						  					<span>max</span>
										</div>
										<input 
											type={this.state.xKey === 'timestamp' ? "date" : "text"} 
											className="form-control minmax" 
											placeholder="Auto" 
											value={this.state.xmax} 
											onChange={e => {
												this.setState({
                                                    xmax: e.target.value,
                                                    phase: 'awaitingUserInput'
                                                })}
											}
                                            onBlur={e => {
                                                if(!this.state.suppressBlur ){
                                                    helpers.changePlotAxisLimits.bind(this)('xmax', 'xKey', e)
                                                }
                                            }}
											onKeyPress={e => {
                                                if(e.key==='Enter' ){
                                                    helpers.changePlotAxisLimits.bind(this)('xmax', 'xKey', e)
                                                }
                                            }}
											aria-label="xmax" 
											aria-describedby="basic-addon1"/>
									</div>
								</div>
								<div className='row'>
									<div className='col-5'>
										<div className="form-text">
						  					<span>Reverse x axis</span>
										</div>
										<input className="form-check-input" checked={this.state.reverseX} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseX')} type="checkbox" id='reverseX'></input>
									</div>
									<div className='col-7' style={{'textAlign':'right'}}>
										<button type="button" className="btn btn-outline-primary" style={{'marginTop':'0.75em'}} onClick={event => helpers.resetAxes.bind(this)(event)} id='xreset'>Reset x Limits</button>
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
							        getSuggestionValue={helpers.getSuggestionValue}
							        renderSuggestion={helpers.renderSuggestion.bind(this, 'yKey')}
							        inputProps={{
                                        placeholder: 'y-axis', 
                                        value: this.state.yKey, 
                                        onKeyPress: helpers.changeAutoSuggestPlots.bind(this, 'yKey', this.state, true),  
                                        onBlur: helpers.changeAutoSuggestPlots.bind(this, 'yKey', this.state, true), 
                                        onChange: helpers.inputAutoSuggestPlots.bind(this, 'yKey', this.xKeyRef, true),  
                                        id: 'yKey'
                                    }}
							        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
	      						/>
	      						<div className='row'>
	      							<div className='col-6' style={{'paddingRight': '0px'}}>
										<div className="form-text">
						  					<span>min</span>
										</div>
										<input 
											type={this.state.yKey === 'timestamp' ? "date" : "text"} 
											className="form-control minmax" 
											placeholder="Auto" 
											value={this.state.ymin} 
											onChange={e => {
												this.setState({
                                                    ymin: e.target.value,
                                                    phase: 'awaitingUserInput'
                                                })}
											}
                                            onBlur={e => {
                                                if(!this.state.suppressBlur ){
                                                    helpers.changePlotAxisLimits.bind(this)('ymin', 'yKey', e)
                                                }
                                            }}
											onKeyPress={e => {
                                                if(e.key==='Enter'){
                                                    helpers.changePlotAxisLimits.bind(this)('ymin', 'yKey', e)
                                                }
                                            }}
											aria-label="ymin" 
											aria-describedby="basic-addon1"/>
									</div>
									<div className='col-6' style={{'paddingRight': '0px'}}>
										<div className="form-text">
						  					<span>max</span>
										</div>
										<input 
											type={this.state.yKey === 'timestamp' ? "date" : "text"} 
											className="form-control minmax" 
											placeholder="Auto" 
											value={this.state.ymax} 
											onChange={e => {
												this.setState({
                                                    ymax: e.target.value,
                                                    phase: 'awaitingUserInput'
                                                })}
											}
                                            onBlur={e => {
                                                if(!this.state.suppressBlur ){
                                                    helpers.changePlotAxisLimits.bind(this)('ymax', 'yKey', e)
                                                }
                                            }}
											onKeyPress={e => {
                                                if(e.key==='Enter'){
                                                    helpers.changePlotAxisLimits.bind(this)('ymax', 'yKey', e)
                                                }
                                            }}
											aria-label="ymax" 
											aria-describedby="basic-addon1"/>
									</div>
								</div>
								<div className='row'>
									<div className='col-5'>
										<div className="form-text">
						  					<span>Reverse y axis</span>
										</div>
										<input className="form-check-input" checked={this.state.reverseY} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseY')} type="checkbox" id='reverseY'></input>
									</div>
									<div className='col-7' style={{'textAlign':'right'}}>
										<button type="button" className="btn btn-outline-primary" style={{'marginTop':'0.75em'}} onClick={event => helpers.resetAxes.bind(this)(event)} id='yreset'>Reset y Limits</button>
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
							        getSuggestionValue={helpers.getSuggestionValue}
							        renderSuggestion={helpers.renderSuggestion.bind(this, 'cKey')}
							        inputProps={{
                                        placeholder: 'color axis', 
                                        value: this.state.cKey, 
                                        onKeyPress: helpers.changeAutoSuggestPlots.bind(this, 'cKey', this.state, true),  
                                        onBlur: helpers.changeAutoSuggestPlots.bind(this, 'cKey', this.state, true), 
                                        onChange: helpers.inputAutoSuggestPlots.bind(this, 'cKey', this.xKeyRef, true), 
                                        id: 'cKey'
                                    }}
							        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
	      						/>
	      						<div className='row'>
	      							<div className='col-6' style={{'paddingRight': '0px'}}>
										<div className="form-text">
						  					<span>min</span>
										</div>
										<input 
											type={this.state.cKey === 'timestamp' ? "date" : "text"} 
											className="form-control minmax" 
											placeholder="Auto" 
											value={this.state.cmin} 
											onChange={e => {
												this.setState({
                                                    cmin: e.target.value,
                                                    phase: 'awaitingUserInput'
                                                })}
											}
                                            onBlur={e => {
                                                if(!this.state.suppressBlur ){
                                                    helpers.changePlotAxisLimits.bind(this)('cmin', 'cKey', e)
                                                }
                                            }}
											onKeyPress={e => {
                                                if(e.key==='Enter'){
                                                    helpers.changePlotAxisLimits.bind(this)('cmin', 'cKey', e)
                                                }
                                            }}
											aria-label="cmin" 
											aria-describedby="basic-addon1"/>
									</div>
									<div className='col-6' style={{'paddingRight': '0px'}}>
										<div className="form-text">
						  					<span>max</span>
										</div>
										<input 
											type={this.state.cKey === 'timestamp' ? "date" : "text"} 
											className="form-control minmax" 
											placeholder="Auto" 
											value={this.state.cmax} 
                                            onChange={e => {
												this.setState({
                                                    cmax: e.target.value,
                                                    phase: 'awaitingUserInput'
                                                })}
											}
                                            onBlur={e => {
                                                if(!this.state.suppressBlur ){
                                                    helpers.changePlotAxisLimits.bind(this)('cmax', 'cKey', e)
                                                }
                                            }}
											onKeyPress={e => {
                                                if(e.key==='Enter'){
                                                    helpers.changePlotAxisLimits.bind(this)('cmax', 'cKey', e)
                                                }
                                            }}
											aria-label="cmax" 
											aria-describedby="basic-addon1"/>
									</div>
								</div>
								<div className='row'>
									<div className='col-5'>
										<div className="form-text">
						  					<span>Reverse color axis</span>
										</div>
										<input className="form-check-input" checked={this.state.reverseC} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseC')} type="checkbox" id='reverseC'></input>
									</div>
									<div className='col-7' style={{'textAlign':'right'}}>
										<button type="button" className="btn btn-outline-primary" style={{'marginTop':'0.75em'}} onClick={event => helpers.resetAxes.bind(this)(event)} id='creset'>Reset color Limits</button>
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
							        getSuggestionValue={helpers.getSuggestionValue}
							        renderSuggestion={helpers.renderSuggestion.bind(this, 'cscale')}
							        inputProps={{
                                        placeholder: 'color scale', 
                                        value: this.state.cscale, 
                                        onKeyPress: helpers.changeAutoSuggestPlots.bind(this, 'cscale', this.state, true),  
                                        onBlur: helpers.changeAutoSuggestPlots.bind(this, 'cscale', this.state, true), 
                                        onChange: helpers.inputAutoSuggestPlots.bind(this, 'cscale', this.xKeyRef, true), 
                                        id: 'cscale'}}
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
							        getSuggestionValue={helpers.getSuggestionValue}
							        renderSuggestion={helpers.renderSuggestion.bind(this, 'zKey')}
							        inputProps={{
                                        placeholder: 'z-axis', 
                                        value: this.state.zKey, 
                                        onKeyPress: helpers.changeAutoSuggestPlots.bind(this, 'zKey', this.state, true),  
                                        onBlur: helpers.changeAutoSuggestPlots.bind(this, 'zKey', this.state, true), 
                                        onChange: helpers.inputAutoSuggestPlots.bind(this, 'zKey', this.xKeyRef, true), 
                                        id: 'zKey'
                                    }}
							        theme={{input: 'form-control', suggestionsList: 'list-group', suggestion: 'list-group-item'}}
	      						/>
								<div className={this.state.zKey === '[2D plot]' ? "input-group mb-3 hidden": "input-group mb-3"} style={{'marginTop':'1em'}}>
		      						<div className='row'>
		      							<div className='col-6' style={{'paddingRight': '0px'}}>
											<div className="form-text">
							  					<span>min</span>
											</div>
											<input 
												type={this.state.zKey === 'timestamp' ? "date" : "text"} 
												className="form-control minmax" 
												placeholder="Auto" 
												value={this.state.zmin} 
                                                onChange={e => {
                                                    this.setState({
                                                        zmin: e.target.value,
                                                        phase: 'awaitingUserInput'
                                                    })}
                                                }
                                                onBlur={e => {
                                                    if(!this.state.suppressBlur ){
                                                        helpers.changePlotAxisLimits.bind(this)('zmin', 'zKey', e)
                                                    }
                                                }}
                                                onKeyPress={e => {
                                                    if(e.key==='Enter'){
                                                        helpers.changePlotAxisLimits.bind(this)('zmin', 'zKey', e)
                                                    }
                                                }}
												aria-label="zmin" 
												aria-describedby="basic-addon1"/>
										</div>
										<div className='col-6' style={{'paddingRight': '0px'}}>
											<div className="form-text">
							  					<span>max</span>
											</div>
											<input 
												type={this.state.zKey === 'timestamp' ? "date" : "text"} 
												className="form-control minmax" 
												placeholder="Auto" 
												value={this.state.zmax} 
                                                onChange={e => {
                                                    this.setState({
                                                        zmax: e.target.value,
                                                        phase: 'awaitingUserInput'
                                                    })}
                                                }
                                                onBlur={e => {
                                                    if(!this.state.suppressBlur ){
                                                        helpers.changePlotAxisLimits.bind(this)('zmax', 'zKey', e)
                                                    }
                                                }}
                                                onKeyPress={e => {
                                                    if(e.key==='Enter'){
                                                        helpers.changePlotAxisLimits.bind(this)('zmax', 'zKey', e)
                                                    }
                                                }}
												aria-label="zmax" 
												aria-describedby="basic-addon1"/>
										</div>
									</div>
									<div className='row'>
										<div className='col-5'>
											<div className="form-text">
							  					<span>Reverse z axis</span>
											</div>
											<input className="form-check-input" checked={this.state.reverseZ} onChange={(v) => helpers.toggle.bind(this)(v, 'reverseZ')} type="checkbox" id='reverseZ'></input>
										</div>
										<div className='col-7' style={{'textAlign':'right'}}>
											<button type="button" className="btn btn-outline-primary" style={{'marginTop':'0.75em'}} onClick={event => helpers.resetAxes.bind(this)(event)} id='zreset'>Reset z Limits</button>
										</div>
									</div>
								</div>
							</div>

							<hr/>

							<h5>Global Options</h5>
							<div className="form-floating mb-3">
								<div className='row'>
									<div className='col-5'>
										<div className="form-text">
						  					<span>Connecting lines</span>
										</div>
										<input className="form-check-input" checked={this.state.connectingLines} onChange={(v) => helpers.toggle.bind(this)(v, 'connectingLines')} type="checkbox" id='connectingLines'></input>
									</div>
									<div className='col-7' style={{'textAlign':'right'}}>
										<button type="button" className="btn btn-outline-primary" style={{'marginTop':'0.75em'}} onClick={event => helpers.resetAllAxes.bind(this)(event)} id='allreset'>Reset all axes</button>
									</div>
								</div>
								<div className="form-floating mb-3" style={{'marginTop': '0.5em'}}>
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
							</div>
						</div>
					</div>
				</fieldset>
			</div>

			{/* plots */}
			<div className='col-lg-9'>
					<h5 style={{'marginTop':'0.5em'}}>{this.state.title}</h5>
			    <Plot
			      data={this.data}
			      onRelayout={e=>helpers.zoomSync.bind(this)(e)}
			      layout={this.layout}
			      style={{width: '100%', height: '90vh'}}
			      config={{showTips: false, responsive: true}}
			    />
			</div>
		</div>
		</>
	)
}

helpers.initPlottingPage = function(customParams, apiroot){
	let q = new URLSearchParams(window.location.search) // parse out query string

	// default state, pulling in query string specifications
	this.state = {
		apiKey: localStorage.getItem('apiKey') ? localStorage.getItem('apiKey') : 'guest',
		xKey: q.has('xKey') ? q.get('xKey') : '',
		yKey: q.has('yKey') ? q.get('yKey') : '',
		zKey: q.has('zKey') ? q.get('zKey') : '',
		cKey: q.has('cKey') ? q.get('cKey') : '',
		xKeySuggestions: [],
		yKeySuggestions: [],
		zKeySuggestions: [],
		cKeySuggestions: [],
		cscaleSuggestions: [],
		xmin: q.has('xmin') ? q.get('xmin') : '',
		xmax: q.has('xmax') ? q.get('xmax') : '',
		ymin: q.has('ymin') ? q.get('ymin') : '',
		ymax: q.has('ymax') ? q.get('ymax') : '',
		zmin: q.has('zmin') ? q.get('zmin') : '',
		zmax: q.has('zmax') ? q.get('zmax') : '',
		cmin: q.has('cmin') ? q.get('cmin') : '',
		cmax: q.has('cmax') ? q.get('cmax') : '',
		cscale:  q.has('cscale') ? q.get('cscale') : 'Electric',
		reverseX: q.has('reverseX') ? q.get('reverseX') === 'true' : false,
		reverseY: q.has('reverseY') ? q.get('reverseY') === 'true' : false,
		reverseZ: q.has('reverseZ') ? q.get('reverseZ') === 'true' : false,
		reverseC: q.has('reverseC') ? q.get('reverseC') === 'true' : false,
		title: '',
		data: [{}],
		metadata: {},
		showAll:  q.has('showAll') ? q.get('showAll') === 'true' : false,
		counterTraces: q.has('counterTraces') ? JSON.parse(q.get('counterTraces')) : [], // trace IDs with a show status opposite to showAll
		points: [],
		connectingLines: q.has('connectingLines') ? q.get('connectingLines') === 'true' : false,
		refreshData: true,
		centerlon: q.has('centerlon') ? q.get('centerlon') : 0,
        phase: 'refreshData',
        suppressBlur: false,
	}

	this.apiPrefix = apiroot
	this.vocab = {xKey: [], yKey: [], zKey: [], cKey: [], cscale: ['Blackbody','Bluered','Blues','Cividis','Earth','Electric','Greens','Greys','Hot','Jet','Picnic','Portland','Rainbow','RdBu','Reds', 'Thermal', 'Viridis','YlGnBu','YlOrRd']}
	this.statusReporting = React.createRef()
	this.showAll = true // show all autoselect options when field is focused and empty
	this.units = {
		'longitude': 'deg',
		'latitude': 'deg',
		'temperature': 'C'
	}
	this.header = []
	this.rows = []
	this.customQueryParams = [
		'xKey', 'xmin', 'xmax', 'reverseX', 
		'yKey', 'ymin', 'ymax', 'reverseY',
		'zKey', 'zmin', 'zmax', 'reverseZ',
		'cKey', 'cmin', 'cmax', 'reverseC',
		'cscale', 'connectingLines', 
		'showAll', 'counterTraces'
	]
	this.formRef = React.createRef()
    this.xKeyRef = React.createRef()

	for(let i=0; i<customParams.length; i++){
		this.state[customParams[i]] = q.has(customParams[i]) ? q.get(customParams[i]) : ''
		this.customQueryParams.concat(customParams[i])
	}

}

helpers.downloadData = function(defaultX, defaultY, defaultZ, defaultC, mergePoints){
    // to bind in to downloadData for plotting pages
	Promise.all(this.generateURLs().map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
		Promise.all(responses.map(res => res.json())).then(data => {
			for(let i=0; i<data.length; i++){
				let bail = helpers.handleHTTPcodes.bind(this)(data[i].code)
				if(bail){
					return
				}
			}

			// keep raw json blob for download
			this.json = new Blob([JSON.stringify(data)], {type: 'text/json'})
			this.json = window.URL.createObjectURL(this.json)

			let p = [].concat(...data)

			// get a list of metadata we'll need
			let metakeys = Array.from(new Set(p.map(x=>x['metadata'][0])))
			Promise.all(this.generateMetadataURLs(metakeys).map(x => fetch(x, {headers:{'x-argokey': this.state.apiKey}}))).then(responses => {
				Promise.all(responses.map(mres => mres.json())).then(metadata => {
					for(let i=0; i<metadata.length; i++){
						if(metadata[i].code === 429){
							console.log(429)
							helpers.manageStatus.bind(this)('error', 'Too many requests too fast; please wait a minute, and consider using an API key (link below).')
							return
						}
					}

					metadata = [].concat(...metadata)
					let meta = {}

					// metadata lookup table
					for(let i=0; i<metadata.length; i++){
						meta[metadata[i]._id] = metadata[i]
					}

					// set up vocab lists
					let vars = ['month', 'year'].concat(helpers.getDataKeys.bind(this)(p, meta)).sort()

					// transpose data for traces
					p = p.map(d => helpers.transpose.bind(this)(d, meta[d.metadata]))

					let mappoints = p.map(point => {
						return(
							<CircleMarker key={point._id+Math.random()} center={[point.latitude[0], helpers.mutateLongitude(point.longitude[0], parseFloat(this.state.centerlon)) ]} radius={1} color={'red'}/>
							)
					})

					if(mergePoints){
						p = [helpers.mergePoints(p)]
					}

					this.vocab['xKey'] = vars
					this.vocab['yKey'] = vars
					this.vocab['zKey'] = ['[2D plot]'].concat(vars)
					this.vocab['cKey'] = vars

					this.prepCSV(data, meta)

					this.setState({
						data:p, 
						variables: vars, 
						metadata: meta,
						points: mappoints,
						xKey: this.state.xKey ? this.state.xKey :  defaultX,
						yKey: this.state.yKey ? this.state.yKey :  defaultY,
						zKey: this.state.zKey ? this.state.zKey :  defaultZ,
						cKey: this.state.cKey ? this.state.cKey :  defaultC,
                        phase: 'remapData'
					})
				})
			})
		})
	})
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
  	if(t1.getTime() - t0.getTime() <= (nDays * 24 * 60 * 60 * 1000)){
  		this.state.startDate = q.get('startDate')
    	this.state.endDate = q.get('endDate')
  	}
  }
}

helpers.generateTimetics = function(minMSSE, maxMSSE){
	// given the min and max ms since epoch for a time range, 
	// generate a list of tick labels and the msse values they correspond to, for labeling the appropriate plot axis

  let nTicks = 6
  if(minMSSE === '' || !isFinite(minMSSE)) minMSSE = 0
  if(maxMSSE === '' || !isFinite(maxMSSE)) maxMSSE = 1000

  let tickvals = []
  let ticktext = []

  let dtick = Math.floor((maxMSSE - minMSSE) / (nTicks-1))

  for(let i=0; i<nTicks; i++){
  	tickvals[i] = minMSSE + i*dtick
  	ticktext[i] = new Date(tickvals[i])
  	ticktext[i] = ticktext[i].toISOString().slice(0,10)
  }

  return [ticktext, tickvals]

}

helpers.manageCenterlon = function(centerlon){
	centerlon = parseFloat(centerlon)
	if(centerlon < -180){
		centerlon = -180
	} else if (centerlon > 180){
		centerlon = 180
	} else if (isNaN(centerlon)){
		centerlon = 0
	}
	return centerlon
}

helpers.mutateLongitude = function(longitude, centerlon){
	// given a longitude on [-180,180],
	// transform it to plot on a map centered on [centerlon - 180, centerlon + 180]

	if(longitude > centerlon + 180){
		return longitude - 360
	} else if(longitude < centerlon-180){
		return longitude + 360
	} else {
		return longitude
	}
}

helpers.mungePrecision = function(num){
	if(num === null){
		return null
	} else{
		return parseFloat(num.toFixed(6))
	}
}

helpers.determineWoceGroup = function(woce, date, wocegroupLookup){
	// given the woce tag and date of a measurement,
	// determine the start and end date of the group of measurements this measurement belongs to

	let groups = wocegroupLookup[woce]
	for(let i=0; i<Object.keys(groups).length; i++){
		let key = Object.keys(groups)[i]
		if(date >= groups[key][0] && date <= groups[key][1]){
			return groups[key].concat(key)
		}
	}
}

helpers.genRegionLink = function(polygon, sDate, eDate, centerlon, dataset){
	// generate the link to see all data in <dataset> for the given temporospatial window
  let regionLink = ''
  if(JSON.stringify(polygon) !== '[]'){
    let endDate = new Date(eDate)
    endDate.setDate(endDate.getDate() + 1)
    regionLink = <><br /><a target="_blank" rel="noreferrer" href={'/plots/'+dataset+'?showAll=true&startDate=' + sDate + 'T00:00:00Z&endDate='+ endDate.toISOString().replace('.000Z', 'Z') +'&polygon='+JSON.stringify(this.tidypoly(polygon))+'&centerlon='+centerlon}>Regional Selection Page</a></>		
  }

  return regionLink
}

helpers.defineProjection = function(proj){

    let TILE_SIZE = {
        'mercator': 256,
        'arctic': 512,
        'antarctic': 512
    }[proj]

    let crs = null
    let minZoom = null
    if(proj === 'mercator'){
        crs = L.CRS.EPSG3857;
        minZoom = 0;
    } else {
        const MAX_ZOOM = 16;
        const extent = {
            'arctic': Math.sqrt(2)*6371007.2, 
            'antarctic':12367396.2185
        }[proj];
        const epsg = {
            'arctic': 'EPSG:3575', 
            'antarctic': 'EPSG:3032'
        }[proj];
        const proj4 = {
            'arctic': "+proj=laea +lat_0=90 +lon_0=10 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs", 
            'antarctic': "+proj=stere +lat_0=-90 +lon_0=0 +x_0=0 +y_0=0 +datum=WGS84 +units=m +no_defs"
        }[proj];
        const resolutions = Array(MAX_ZOOM + 1) 
          .fill() 
          .map((_, i) => 2*extent / TILE_SIZE / Math.pow(2, i));
        minZoom = helpers.findLowestZoom(resolutions, TILE_SIZE)

        crs = new L.Proj.CRS(
        epsg, 
        proj4, 
        { 
            origin: [-extent, extent], 
            bounds: L.bounds(
            L.point(-extent, extent), 
            L.point(extent, -extent)
            ), 
            resolutions: resolutions,
            tileSize: TILE_SIZE
        });
    }
      
    const tiles = { 
        'mercator': "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        'arctic': "https://tile.gbif.org/3575/omt/{z}/{x}/{y}@4x.png?style=osm-bright",
        'antarctic': "https://tile.gbif.org/3031/omt/{z}/{x}/{y}@4x.png?style=osm-bright"
    }[proj];

    const center = {
        'mercator': [25, parseFloat(this.state.centerlon)],
        'arctic': [90, 0],
        'antarctic': [-90, 0]
    }[proj];

    const maxBounds = {
        'mercator':[[-90,this.state.centerlon-180],[90,this.state.centerlon+180]],
        'arctic': L.latLngBounds(crs.unproject(L.point(-450000, -450000)), crs.unproject(L.point(450000, 450000))),
        'antarctic': L.latLngBounds(L.latLng(-90, -180), L.latLng(-60, 180))
    }[proj]

    const defaultZoom = {
        'mercator': 2,
        'arctic': 1,
        'antarctic': 1
    }[proj]

    return{
        projection: proj,
        crs: crs,
        tiles: tiles,
        tile_size: TILE_SIZE,
        mapcenter: center,
        maxBounds: maxBounds,
        defaultZoom: defaultZoom,
        minZoom: minZoom,
        mapkey: Math.random()
    }
}

helpers.findLowestZoom = function(resolutions, tilesize) {
    // limit how far the user can zoom out; tiles should roughly cover the screen.
    // zooming out too far causes crashes on larger monitors - mysterious but observable.
    return 0
    for (let z = 0; z < resolutions.length; z++) {
        if(window.innerWidth < tilesize*Math.pow(2,z) && window.innerHeight < tilesize*Math.pow(2,z)){
            return z
        }
    }
    return resolutions.length - 1; // fallback to max zoom
}

helpers.setProjection = function(proj){
    // set the projection for the map
    let s = helpers.defineProjection.bind(this)(proj)
    let d = helpers.polyDeleteState.bind(this)(this.defaultPolygon) // force delete any polygon when changing projection
    this.setState({
        ...s,
        ...d,
        phase: 'refreshData'
    })
}

export default helpers