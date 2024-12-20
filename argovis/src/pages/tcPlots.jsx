import React from 'react';
import '../index.css';
import helpers from'./helpers'


class TCPlots extends React.Component {

	constructor(props) {
		document.title = 'Argovis - Tropical cyclone plots'
		super(props);

		helpers.initPlottingPage.bind(this)(['tcMeta', 'startDate', 'endDate', 'polygon'], 'https://argovis-api.colorado.edu/')

		if(this.state.tcMeta){
			// get human-friendly tc names
    	    fetch(this.apiPrefix + 'summary?id=tc_labels', {headers:{'x-argokey': this.state.apiKey}})
        	.then(response => response.json())
	        .then(data => {
				let bail = helpers.handleHTTPcodes.bind(this)(data.hasOwnProperty('code') ? data.code : data[0].code)
				if(bail){
					return
				}
    	    	let name = data[0].summary.filter(x=>x._id === this.state.tcMeta)[0].label
        		this.state.title = name
        	})
	    } else if(this.state.polygon){
	    	this.state.title = 'Cyclone regional search, ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
	    }

		helpers.downloadData.bind(this)('timestamp', 'surface_pressure', '[2D plot]', 'wind', true)
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	helpers.phaseManager.bind(this)(prevProps, prevState, snapshot)
    }

    downloadData(){
        helpers.downloadData.bind(this)('temperature', 'pressure', '[2D plot]', 'timestamp')
    }

    replot(){
        helpers.prepPlotlyState.bind(this)(6)
    }

	generateURLs(){
		// return an array of API URLs to be fetched based on current state variables.

		let urls = []

		if(this.state.tcMeta){
			urls = urls.concat(this.apiPrefix + 'tc/?data=all&metadata=' + this.state.tcMeta)
		} else if(this.state.polygon && this.state.startDate && this.state.endDate){
			urls = urls.concat(this.apiPrefix + 'tc/?data=all&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate + '&polygon=' + this.state.polygon)
		} 

		console.log(urls)

		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'tc/meta?id=' + x)
	}


	prepCSV(data, meta){
		// no csv required for tc
		this.csv = null
	}

	genTooltip(data){
		return helpers.genericTooltip.bind(this)(data)
	}

	render(){
        console.log(this.state)

		return(
			<>
				{helpers.plotHTML.bind(this)()}
			</>
		)
	}
}

export default TCPlots