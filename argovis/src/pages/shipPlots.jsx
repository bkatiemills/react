import React from 'react';
import '../index.css';
import helpers from'./helpers'


class ShipPlots extends React.Component {

	constructor(props) {
		document.title = 'Argovis - ship-based profile plots'

		super(props);

		helpers.initPlottingPage.bind(this)(['woceline', 'startDate', 'endDate', 'cruise', 'polygon'], 'https://argovis-api.colorado.edu/')

		if(this.state.woceline){
			this.state.title = 'WOCE line ' + this.state.woceline + ', ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
		} else if(this.state.cruise && !this.state.counterTraces){
			this.state.title = 'Cruise ' + this.state.cruise
		} else if(this.state.polygon){
			this.state.title = 'Ship profile regional search, ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
		} else if (this.state.counterTraces){
			this.state.title = 'Profile ID ' + this.state.counterTraces.slice(1,-1)
		}


		helpers.downloadData.bind(this)('latitude', 'longitude', '[2D plot]', 'timestamp', false)
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	helpers.phaseManager.bind(this)(prevProps, prevState, snapshot)
    }

    downloadData(){
        helpers.downloadData.bind(this)('latitude', 'longitude', '[2D plot]', 'timestamp', false)
    }

    replot(){
        helpers.prepPlotlyState.bind(this)(6)
    }

	generateURLs(){
		// return an array of API URLs to be fetched based on current state variables.

		let urls = []

		if(this.state.woceline){
			urls = urls.concat(this.apiPrefix + 'cchdo?data=all&woceline=' + this.state.woceline + '&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate)
		} else if(this.state.cruise){
			urls = urls.concat(this.apiPrefix + 'cchdo?data=all&cchdo_cruise=' + this.state.cruise)
		} else if(this.state.polygon && this.state.startDate && this.state.endDate){
			urls = urls.concat(this.apiPrefix + 'cchdo?data=all&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate + '&polygon=' + this.state.polygon)
		}
        		
		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'cchdo/meta?id=' + x)
	}

	prepCSV(data, meta){
		// prep csv data, and transforms to go from csv -> html table
		let profiles = [].concat(...data)
		this.header = ['ID', 'Longitude', 'Latitude', 'Timestamp']
		this.rows = profiles.map(d => {
			return [
				d._id, // keep data record id first element in each array
				d.geolocation.coordinates[0],
				d.geolocation.coordinates[1],
				d.timestamp
			]
		})
		this.transforms = [
			id=>id,
			lon=>lon,
			lat=>lat,
			timestamp=>timestamp
		]

		this.csv = this.header.join(',') + '\n'
		this.csv += this.rows.map(r => JSON.stringify(r).replaceAll('"', '').replaceAll('[', '').replaceAll(']', '')).join('\n')
		this.csv = new Blob([this.csv], {type: 'text/csv'})
		this.csv = window.URL.createObjectURL(this.csv)
	}

	genTooltip(data){
		// given <data>, the transposed data record for a profile, reutrn the appropriate tooltip array
		if(JSON.stringify(data) === '{}'){
			return []
		}
		let tooltips = []
		for(let i=0; i<data.timestamp.length; i++){
			let text = ''
			text += 'Profile ' + data['_id'] + '<br><br>'
			text += 'Longitude / Latitude: ' + helpers.mungePrecision(data['longitude'][i]) + ' / ' + helpers.mungePrecision(data['latitude'][i]) + '<br>'
			text += 'Timestamp: ' + new Date(data['timestamp'][i]) + '<br>'
			text += 'Pressure: ' + helpers.mungePrecision(data['pressure'][i]) + ' dbar<br><br>'
			let defaultItems = ['longitude', 'latitude', 'timestamp', 'pressure']
			if(!defaultItems.includes(this.state.xKey)){
				if(data.hasOwnProperty(this.state.xKey)){
					text += this.state.xKey + ': ' + helpers.mungePrecision(data[this.state.xKey][i]) + ' ' + this.units[this.state.xKey] + '<br>'
				}
				if(data.hasOwnProperty(this.state.xKey + '_woceqc')){
					text += this.state.xKey +'_woceqc: ' + data[this.state.xKey+'_woceqc'][i] + '<br>'
				}
			}
			if(!defaultItems.includes(this.state.yKey)){
				if(data.hasOwnProperty(this.state.yKey)){
					text += this.state.yKey + ': ' + helpers.mungePrecision(data[this.state.yKey][i]) + ' ' + this.units[this.state.yKey] + '<br>'
				}
				if(data.hasOwnProperty(this.state.yKey + '_woceqc')){
					text += this.state.yKey +'_woceqc: ' + data[this.state.yKey+'_woceqc'][i] + '<br>'
				}
			}
			if(!defaultItems.includes(this.state.zKey) && this.state.zKey !== '[2D plot]'){
				if(data.hasOwnProperty(this.state.zKey)){
					text += this.state.zKey + ': ' + helpers.mungePrecision(data[this.state.zKey][i]) + ' ' + this.units[this.state.zKey] + '<br>'
				}
				if(data.hasOwnProperty(this.state.zKey + '_woceqc')){
					text += this.state.zKey +'_woceqc: ' + data[this.state.zKey+'_woceqc'][i] + '<br>'
				}
			}
			if(!defaultItems.includes(this.state.cKey)){
				if(data.hasOwnProperty(this.state.cKey)){
					text += this.state.cKey + ': ' + helpers.mungePrecision(data[this.state.cKey][i]) + ' ' + this.units[this.state.cKey] + '<br>'
				}
				if(data.hasOwnProperty(this.state.cKey + '_woceqc')){
					text += this.state.cKey +'_woceqc: ' + data[this.state.cKey+'_woceqc'][i]
				}
			}
			tooltips.push(text)
		}

		return tooltips
	}

	render(){
		console.log(this.state)

		return(
			<>
				{helpers.plotHTML.bind(this)()}
				<hr/>
				<div className='row' style={{'width':'100vw'}}>
					<div className='col-12 scrollit tablewidth' style={{'paddingLeft': '2em', 'paddingRight': '5em', 'height': '50vh'}}>
						<h5>Profiles</h5>
						<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={this.csv} download={'shipProfiles.csv'}>Download Table CSV</a>
						<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={this.json} download={'shipProfiles.json'}>Download Complete JSON</a>

						<table className='table'>
							<thead style={{'position': 'sticky', 'top': 0, 'backgroundColor': '#FFFFFF'}}>
							    <tr>
							    	<th scope="col">
							    		<span style={{'marginRight':'0.5em'}}>Show</span>
										<input className="form-check-input" checked={this.state.showAll} onChange={(v) => helpers.toggleAll.bind(this)() } type="checkbox"></input>
							    	</th>
							    	{this.header.map(item => {return <th key={Math.random()} scope="col">{item}</th>})}
							    </tr>
							</thead>
							<tbody>
								{this.rows.map(r => {
									return(
										<tr key={Math.random()}>
											<td>
												<input className="form-check-input" checked={helpers.showTrace.bind(this)(r[0])} onChange={(v) => helpers.toggleTrace.bind(this)(r[0])} type="checkbox" id={r[0]}></input>
											</td>
											{r.map((item,i) => {return <td key={Math.random()}>{this.transforms[i](item)}</td>})}
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				</div>
			</>
		)
	}
}

export default ShipPlots