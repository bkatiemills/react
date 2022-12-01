import React from 'react';
import '../index.css';
import helpers from'./helpers'


class DrifterPlots extends React.Component {

	constructor(props) {
		document.title = 'Argovis - drifter plots'
		super(props);

		helpers.initPlottingPage.bind(this)(['wmo', 'platform', 'startDate', 'endDate', 'polygon'])

		if(this.state.wmo){
			this.state.title = 'Drifter WMO ' + this.state.wmo
		} else if(this.state.platform){
			this.state.title = 'Drifter platform ' + this.state.platform
		} else if(this.state.polygon){
			this.state.title = 'Drifter regional search, ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
		}

		helpers.downloadData.bind(this)('sst', 'sst1', '[2D plot]', 'timestamp', true)
	}

	prepCSV(data, meta){
		// no csv required for drifter
		this.csv = null
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	this.state.refreshData = false
	    helpers.setQueryString.bind(this)()
    }

	generateURLs(){
		// return an array of API URLs to be fetched based on current state variables.

		let urls = []

		if(this.state.wmo){
			urls = urls.concat(this.apiPrefix + 'drifters/?compression=array&data=all&wmo=' + this.state.wmo)
		} else if(this.state.platform){
			urls = urls.concat(this.apiPrefix + 'drifters/?compression=array&data=all&platform=' + this.state.platform)
		} else if(this.state.polygon && this.state.startDate && this.state.endDate){
			urls = urls.concat(this.apiPrefix + 'drifters/?compression=array&data=all&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate + '&polygon=' + this.state.polygon)
		} 

		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'drifters/meta?id=' + x)
	}

	genTooltip(data){
		return helpers.genericTooltip.bind(this)(data)
	}

	toggleCoupling(s){
    	// if changing a toggle for this page needs to trigger a side effect on state, do so here.
    	return s
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

export default DrifterPlots