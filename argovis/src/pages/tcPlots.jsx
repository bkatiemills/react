import React from 'react';
import '../index.css';
import helpers from'./helpers'


class TCPlots extends React.Component {

	constructor(props) {
		document.title = 'Argovis - Tropical cyclone plots'
		super(props);

		helpers.initPlottingPage.bind(this)(['tcMeta', 'startDate', 'endDate', 'polygon'])

		if(this.state.tcMeta){
			// get human-friendly tc names
    	    fetch(this.apiPrefix + 'summary?id=tc_labels', {headers:{'x-argokey': this.state.apiKey}})
        	.then(response => response.json())
	        .then(data => {
    	    	let name = data[0].summary.filter(x=>x._id==this.state.tcMeta)[0].label
        		this.state.title = name
        	})
	    } else if(this.state.polygon){
	    	this.state.title = 'Cyclone regional search, ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
	    }

		helpers.downloadData.bind(this)('timestamp', 'surface_pressure', '[2D plot]', 'wind', true)
	}

	prepCSV(data, meta){
		// no csv required for tc
		this.csv = null
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	this.state.refreshData = false
	    helpers.setQueryString.bind(this)()
    }

	generateURLs(){
		// return an array of API URLs to be fetched based on current state variables.

		let urls = []

		if(this.state.tcMeta){
			urls = urls.concat(this.apiPrefix + 'tc/?compression=array&data=all&metadata=' + this.state.tcMeta)
		} else if(this.state.polygon && this.state.startDate && this.state.endDate){
			urls = urls.concat(this.apiPrefix + 'tc/?compression=array&data=all&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate + '&polygon=' + this.state.polygon)
		} 

		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'tc/meta?id=' + x)
	}

	genTooltip(data){
		return helpers.genericTooltip.bind(this)(data)
	}

	render(){
		helpers.prepPlotlyState.bind(this)(6)

		return(
			<>
				{helpers.plotHTML.bind(this)()}
			</>
		)
	}
}

export default TCPlots