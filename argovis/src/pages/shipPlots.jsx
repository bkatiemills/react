import React from 'react';
import '../index.css';
import helpers from'./helpers'


class ShipPlots extends React.Component {

	constructor(props) {
		super(props);

		helpers.initPlottingPage.bind(this)(['woceline', 'startDate', 'endDate', 'cruise'])

		if(this.state.woceline){
			this.state.title = 'WOCE line ' + this.state.woceline + ', ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
		} else if(this.state.cruise){
			this.state.title = 'Cruise ' + this.state.cruise
		}

		helpers.downloadData.bind(this)('latitude', 'longitude', '[2D plot]', 'timestamp', false)
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
		this.csv += this.rows.map(r => JSON.stringify(r).replaceAll('\"', '').replaceAll('[', '').replaceAll(']', '')).join('\n')
		this.csv = new Blob([this.csv], {type: 'text/csv'})
		this.csv = window.URL.createObjectURL(this.csv)
	}

    componentDidUpdate(prevProps, prevState, snapshot){
    	this.state.refreshData = false
	    helpers.setQueryString.bind(this)()
    }

	generateURLs(){
		// return an array of API URLs to be fetched based on current state variables.

		let urls = []

		if(this.state.woceline){
			urls = urls.concat(this.apiPrefix + 'cchdo/?compression=array&data=all&woceline=' + this.state.woceline + '&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate)
		} else if(this.state.cruise){
			urls = urls.concat(this.apiPrefix + 'cchdo/?compression=array&data=all&cruise=' + this.state.cruise)
		}

		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'cchdo/meta?id=' + x)
	}

	render(){
		helpers.prepPlotlyState.bind(this)(6)

		return(
			<>
				{helpers.plotHTML.bind(this)()}
				<hr/>
				<div className='row' style={{'width':'100vw'}}>
					<div className='col-12' style={{'paddingLeft': '2em', 'paddingRight': '5em', 'height': '50vh', 'overflow': 'scroll'}}>
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