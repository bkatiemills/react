import React from 'react';
import '../index.css';
import helpers from'./helpers'


class DrifterPlots extends React.Component {

	constructor(props) {
		document.title = 'Argovis - drifter plots'
		super(props);

		helpers.initPlottingPage.bind(this)(['wmo', 'platform', 'startDate', 'endDate', 'polygon'], 'https://argovis-drifters.colorado.edu/')

		if(this.state.wmo){
			this.state.title = 'Drifter WMO ' + this.state.wmo
		} else if(this.state.platform){
			this.state.title = 'Drifter platform ' + this.state.platform
		} else if(this.state.polygon){
			this.state.title = 'Drifter regional search, ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
		}

		helpers.downloadData.bind(this)('sst', 'sst1', '[2D plot]', 'timestamp', true)
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

		if(this.state.wmo){
			urls = urls.concat(this.apiPrefix + 'drifters/?data=all&wmo=' + this.state.wmo)
		} else if(this.state.platform){
			urls = urls.concat(this.apiPrefix + 'drifters/?data=all&platform=' + this.state.platform)
		} else if(this.state.polygon && this.state.startDate && this.state.endDate){
			urls = urls.concat(this.apiPrefix + 'drifters/?data=all&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate + '&polygon=' + this.state.polygon)
		} 

		console.log(urls)

		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'drifters/meta?id=' + x)
	}

	prepCSV(data, meta){
		// no csv required for drifter
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

export default DrifterPlots