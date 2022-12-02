import React from 'react';
import '../index.css';
import helpers from'./helpers'


class ArgoPlots extends React.Component {

	constructor(props) {
		document.title = 'Argovis - Argo plots'
		super(props);

		helpers.initPlottingPage.bind(this)(['argoPlatform', 'polygon', 'startDate', 'endDate', 'counterTraces'])
		// fudge y to be inverted by default, to go with pressure
		let q = new URLSearchParams(window.location.search)
		if(!q.has('reverseY') && !q.has('yKey')){
			this.state.reverseY = true
		}

		if(this.state.argoPlatform && !this.state.counterTraces){
			this.state.title = 'Argo platform ' + this.state.argoPlatform
		} else if (this.state.polygon && this.state.startDate && this.state.endDate){
			this.state.title = 'Argo regional search, ' + this.state.startDate.slice(0,10) + ' to ' + this.state.endDate.slice(0,10)
		} else if (this.state.counterTraces){
			this.state.title = 'Argo profile ' + this.state.counterTraces.slice(1,-1)
		}

		helpers.downloadData.bind(this)('temperature', 'pressure', '[2D plot]', 'timestamp')
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
		} else if(this.state.polygon && this.state.startDate && this.state.endDate){
			urls = urls.concat(this.apiPrefix + 'argo/?compression=array&data=all&startDate=' + this.state.startDate + '&endDate=' + this.state.endDate + '&polygon=' + this.state.polygon)
		}

		return urls
	}

	generateMetadataURLs(metakeys){
		return metakeys.map(x => this.apiPrefix + 'argo/meta?id=' + x)
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
				if(data.hasOwnProperty(this.state.xKey + '_argoqc')){
					text += this.state.xKey +'_argoqc: ' + data[this.state.xKey+'_argoqc'][i] + '<br>'
				}
			}
			if(!defaultItems.includes(this.state.yKey)){
				if(data.hasOwnProperty(this.state.yKey)){
					text += this.state.yKey + ': ' + helpers.mungePrecision(data[this.state.yKey][i]) + ' ' + this.units[this.state.yKey] + '<br>'
				}
				if(data.hasOwnProperty(this.state.yKey + '_argoqc')){
					text += this.state.yKey +'_argoqc: ' + data[this.state.yKey+'_argoqc'][i] + '<br>'
				}
			}
			if(!defaultItems.includes(this.state.zKey) && this.state.zKey !== '[2D plot]'){
				if(data.hasOwnProperty(this.state.zKey)){
					text += this.state.zKey + ': ' + helpers.mungePrecision(data[this.state.zKey][i]) + ' ' + this.units[this.state.zKey] + '<br>'
				}
				if(data.hasOwnProperty(this.state.zKey + '_argoqc')){
					text += this.state.zKey +'_argoqc: ' + data[this.state.zKey+'_argoqc'][i] + '<br>'
				}
			}
			if(!defaultItems.includes(this.state.cKey)){
				if(data.hasOwnProperty(this.state.cKey)){
					text += this.state.cKey + ': ' + helpers.mungePrecision(data[this.state.cKey][i]) + ' ' + this.units[this.state.cKey] + '<br>'
				}
				if(data.hasOwnProperty(this.state.cKey + '_argoqc')){
					text += this.state.cKey +'_argoqc: ' + data[this.state.cKey+'_argoqc'][i]
				}
			}
			tooltips.push(text)
		}

		return tooltips
	}

	toggleCoupling(s){
    	// if changing a toggle for this page needs to trigger a side effect on state, do so here.
    	return s
    }

	render(){
		helpers.prepPlotlyState.bind(this)(6)

		let linkouts = <></>
		if(this.state.argoPlatform){
			linkouts = <>
				<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={'https://www.ocean-ops.org/board/wa/Platform?ref='+this.state.argoPlatform} target="_blank" rel="noopener noreferrer">{'Ocean Ops Page for float ID '+this.state.argoPlatform}</a>
				<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={'https://fleetmonitoring.euro-argo.eu/float/'+this.state.argoPlatform} target="_blank" rel="noopener noreferrer">{'Fleet Monitoring Page for float ID '+this.state.argoPlatform}</a>				
			</>
		}

		return(
			<>
				{helpers.plotHTML.bind(this)()}
				<hr/>
				<div className='row' style={{'width':'100vw'}}>
					<div className='col-12' style={{'paddingLeft': '2em', 'paddingRight': '5em', 'height': '50vh', 'overflow': 'scroll'}}>
						<h5>Profiles</h5>
						<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={this.csv} download={'argo'+this.state.argoPlatform+'.csv'}>Download Table CSV</a>
						<a className="btn btn-primary" role='button' style={{'marginRight': '1em'}} href={this.json} download={'argo'+this.state.argoPlatform+'.json'}>Download Complete JSON</a>
						{linkouts}
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