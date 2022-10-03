let helpers = {}

helpers.fetchPolygon = function(coords){
	// coords == array of {lng: xx, lat: xx}, such as returned by getLatLngs
	let vertexes = coords.map(x => [x.lng, x.lat])
	vertexes.push(vertexes[0])
	this.setState({polygon: vertexes, refreshData: true})    	
}

helpers.onDrawStop = function(payload){
	// if there's already a polygon, get rid of it.
	if(Object.keys(this.fgRef.current._layers).length > 1){
		let layerID = Object.keys(this.fgRef.current._layers)[0]
		let layer = this.fgRef.current._layers[layerID]
		this.fgRef.current.removeLayer(layer)
	}
}

helpers.generateStatus = function(status){
	// status == 'ready', 'downloading', 'rendering'
	let message = ''
		let className = ''
	if(status === 'ready'){
		className = 'statusBanner ready'
		message = 'Ready'
	} else if(status === 'downloading'){
		className = 'statusBanner busy'
		message = 'Downloading...'
	} else if(status === 'rendering'){
		className = 'statusBanner busy'
		message = 'Rendering...'
	} else if(status === 'needs refresh'){
		className = 'statusBanner busy'
		message = 'Refresh map when ready'
	}
	return(<span ref={this.statusReporting} className={className}>{message}</span>)
}

helpers.manageStatus = function(newStatus){
	let statuses = {
		ready: ['Ready', 'ready'],  // message, classname
		downloading: ['Downloading...', 'busy'],
		rendering: ['Rendering...', 'busy']
	}

	for(let key in statuses){
		if(key !== newStatus){
			this.statusReporting.current.classList.remove(statuses[key][1])
		}
	}
	this.statusReporting.current.classList.add(statuses[newStatus][1])
	this.statusReporting.current.textContent = statuses[newStatus][0]
}

export default helpers