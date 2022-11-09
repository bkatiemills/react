import React from 'react';
import '../index.css';
import helpers from'./helpers'


class ArgoPlots extends React.Component {

	constructor(props) {
		super(props);

		helpers.initPlottingPage.bind(this)(['argoPlatform'])

		helpers.downloadData.bind(this)('temperature', 'salinity', '[2D plot]', 'timestamp')
	}

	prepCSV(data, meta){
		// prep csv data, and transforms to go from csv -> html table
		let profiles = [].concat(...data)
		this.header = ['ID', 'Longitude', 'Latitude', 'Timestamp', 'DAC', 'Original Files']
		this.rows = profiles.map(d => {
			return [
				d._id, // keep data record id first element in each array
				d.geolocation.coordinates[0],
				d.geolocation.coordinates[1],
				d.timestamp,
				meta[d.metadata].data_center,
				d.source.map(s => s.url)
			]
		})
		this.transforms = [
			id=>id,
			lon=>lon,
			lat=>lat,
			timestamp=>timestamp,
			datacenter=>datacenter,
			urls => urls.map(u=>{
						if(u.includes('profiles/S')){
							return(<a key={Math.random()} className="btn btn-success" style={{'marginRight':'0.5em'}} href={u} role="button">BGC</a>)
						} else {
							return(<a key={Math.random()} className="btn btn-primary" href={u} role="button">Core</a>)
						}
					})
		]
		// break source links out into their own columns for the csv
		let rows = this.rows.map(r => {
			let row = r.slice(0,-1)
			let urls = r[5]
			let core = urls.filter(u => !u.includes('profiles/S'))[0]
			let synth = urls.filter(u => u.includes('profiles/S'))
			if(synth.length > 0){
				synth = synth[0]
			} else {
				synth = ''
			}
			return row.concat(core).concat(synth)
		})
		this.csv = this.header.slice(0,-1).concat('Original core file').concat('Original synthetic file').join(',') + '\n'
		this.csv += rows.map(r => JSON.stringify(r).replaceAll('\"', '').replaceAll('[', '').replaceAll(']', '')).join('\n')
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

		if(this.state.argoPlatform){
			urls = urls.concat(this.apiPrefix + 'argo/?compression=array&data=all&platform=' + this.state.argoPlatform)
		}

		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'argo/meta?id=' + x)
	}

	render(){
		helpers.prepPlotlyState.bind(this)(2)

		return(
			<>
				{helpers.plotHTML.bind(this)()}
				<hr/>
				<div className='row' style={{'width':'100vw'}}>
					<div className='col-12' style={{'paddingLeft': '2em', 'paddingRight': '5em', 'height': '50vh', 'overflow': 'scroll'}}>
						<h5>Profiles</h5>
						<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={this.csv} download={'argo'+this.state.argoPlatform+'.csv'}>Download Table CSV</a>
						<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={this.json} download={'argo'+this.state.argoPlatform+'.json'}>Download Complete JSON</a>
						<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={'https://www.ocean-ops.org/board/wa/Platform?ref='+this.state.argoPlatform} target="_blank" rel="noopener noreferrer">{'Ocean Ops Page for float ID '+this.state.argoPlatform}</a>
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

export default ArgoPlots