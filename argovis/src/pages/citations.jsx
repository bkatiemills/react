import React from 'react';

class ArgoAbout extends React.Component {

	constructor(props) {
		document.title = 'Argovis - Citations'
		super(props);

		let queryManagement = new URL(window.location)
		window.argoPrevious = queryManagement.search
	}

	render(){
		return(
			<>
				<div className='row'>
					<div className='col-12 hero-wrap'>
						<div className='hero'>
							<h2>Citations</h2>
						</div>
					</div>
				</div>

				<div className='row'>
					<div className='col-12 aboutBlock'>
						<h3 id='datasources'>Identification of data sources</h3>
						<p><b>Citation for the Argovis web application and the Argovis database:</b> Tucker, T., D. Giglio, 
						M. Scanderbeg, and S.S.P. Shen: Argovis: A Web Application for Fast Delivery, Visualization, and 
						Analysis of Argo Data. J. Atmos. Oceanic Technol., 37, 401–416, <a href="https://doi.org/10.1175/JTECH-D-19-0041.1" target="_blank" rel="noreferrer">https://doi.org/10.1175/JTECH-D-19-0041.1</a></p>
						<p><b>In addition to citing Argovis, please cite the reference for the dataset you are using, enumerated below:</b></p>
						<ul>
							<li><b>Argo data</b>: see <a href='https://argo.ucsd.edu/data/acknowledging-argo/#:~:text=To%20acknowledge%20Argo%2C%20please%20use,ocean%2Dops.org).' target="_blank" rel="noreferrer"> guidance from the Argo collaboration</a></li>
							<li><b>Ship-based profiles</b>: CCHDO Hydrographic Data Office (2023). CCHDO Hydrographic Data Archive, Version 2023-09-01. In CCHDO Hydrographic Data Archive. UC San Diego Library Digital Collections. <a href='https://doi.org/10.6075/J0CCHDT8'>https://doi.org/10.6075/J0CCHDT8</a></li>
							<li><b>Global Drifter Program</b>: Cite as: Elipot, Shane; Sykulski, Adam; Lumpkin, Rick; Centurioni, Luca; Pazos, Mayra (2022). Hourly location, current velocity, and temperature collected from Global Drifter Program drifters world-wide. [indicate subset used]. NOAA National Centers for Environmental Information. Dataset. <a href='https://doi.org/10.25921/x46c-3620' target="_blank" rel="noreferrer">https://doi.org/10.25921/x46c-3620</a>. Accessed [date].</li>
							<li><b>Tropical cyclone data</b>:
								<ul>
									<li><b>JTWC</b> (<a href='https://www.metoc.navy.mil/jtwc/jtwc.html?best-tracks' target="_blank" rel="noreferrer">https://www.metoc.navy.mil/jtwc/jtwc.html?best-tracks</a>): Chu, J. H., Sampson, C. R.,  Levine, A. S., & Fukada, E. (2002). The joint typhoon warning center tropical cyclone best-tracks, 1945-2000. Joint Typhoon Warning Center, Technical Report No. NRL/MR/7540-02-16.</li>
									<li><b>HURDAT</b> (<a href='https://www.nhc.noaa.gov/data/#hurdat' target="_blank" rel="noreferrer">https://www.nhc.noaa.gov/data/#hurdat</a>): Landsea, C. W., & Franklin, J. L. (2013). Atlantic hurricane database uncertainty and presentation of a new database format. Monthly Weather Review, 141(10), 3576–3592.</li>
								</ul>
							</li>
							<li><b>Argone float location forecasts</b>: Using Existing Argo Trajectories to Statistically Predict Future Float Positions with a Transition Matrix, Journal of Atmospheric and Oceanic Technology vol. 40 issue 9 (2023), <a href="https://doi.org/10.1175/JTECH-D-22-0070.1">https://doi.org/10.1175/JTECH-D-22-0070.1</a></li>
							<li><b>Scripps Argo Trajectory-Based Velocity Product: Global Estimates of Absolute Velocity Derived from Core, Biogeochemical, and Deep Argo Float Trajectories at Parking Depth</b>: <a href='https://journals.ametsoc.org/view/journals/atot/aop/JTECH-D-22-0065.1/JTECH-D-22-0065.1.xml' target="_blank" rel="noreferrer">https://journals.ametsoc.org/view/journals/atot/aop/JTECH-D-22-0065.1/JTECH-D-22-0065.1.xml</a>, DOI: <a href='https://doi.org/10.6075/J0NK3F7V'>https://doi.org/10.6075/J0NK3F7V</a></li>
							<li><b><a href='https://sio-argo.ucsd.edu/RG_Climatology.html' target="_blank" rel="noreferrer">Roemmich-Gilson Argo gridded climatology</a></b>: Roemmich, D. and J. Gilson, 2009: The 2004-2008 mean and annual cycle of temperature, salinity, and steric height in the global ocean from the Argo Program. Progress in Oceanography, 82, 81-100. </li>
							<li><b>LocalGPspace Ocean Heat Content grid</b>: Giglio, D., Sukianto, T., & Kuusela, M. (2023). Ocean Heat Content Anomalies in the North Atlantic based on mapping Argo data using local Gaussian processes defined over space (1.0.0) [Data set]. Zenodo. <a href='https://doi.org/10.5281/zenodo.10183869' target="_blank" rel="noreferrer">https://doi.org/10.5281/zenodo.10183869</a></li>
							<li><b>GLODAPv2.2016b mapped data product</b>: Lauvset, S. K, R. M. Key, A. Olsen, S. van Heuven, A. Velo, X. Lin, C. Schirnick, A. Kozyr, T. Tanhua, M. Hoppema, S. Jutterström, R. Steinfeldt, E. Jeansson, M. Ishii, F. F. Pérez, T. Suzuki & S. Watelet: A new global interior ocean mapped climatology: the 1°x1° GLODAP version 2, Earth Syst. Sci. Data, 8, 325–340, 2016, <a href='https://doi.org/10.5194/essd-8-325-2016'>doi:10.5194/essd-8-325-2016</a></li>
							<li><b>NOAA Sea surface temperature timeseries</b>: NOAA Optimum Interpolation (OI) SST V2 data provided by the NOAA PSL, Boulder, Colorado, USA, from their website at <a href='https://psl.noaa.gov' target="_blank" rel="noreferrer">https://psl.noaa.gov</a>; original data available <a href='https://psl.noaa.gov/data/gridded/data.noaa.oisst.v2.html' target="_blank" rel="noreferrer">here</a>; also see <a href='ftp://ftp.emc.ncep.noaa.gov/cmb/sst/papers/oiv2pap/'>Reynolds, R.W., N.A. Rayner, T.M. Smith, D.C. Stokes, and W. Wang, 2002: An improved in situ and satellite SST analysis for climate. J. Climate, 15, 1609-1625.</a></li>
							<li><b>Copernicus sea level anomaly timeseries</b>: Copernicus Climate Change Service, Climate Data Store, (2018): Sea level gridded data from satellite observations for the global ocean from 1993 to present. Copernicus Climate Change Service (C3S) Climate Data Store (CDS). DOI: <a href='https://doi.org/10.24381/cds.4c328c78' target="_blank" rel="noreferrer">10.24381/cds.4c328c78</a> (Accessed on 06-Jul-2023)</li>
							<li><b>REMSS CCMP wind vector timeseries (demo)</b>: Mears, C.; Lee, T.; Ricciardulli, L.; Wang, X.; Wentz, F., 2022: RSS Cross-Calibrated Multi-Platform (CCMP) 6-hourly ocean vector wind analysis on 0.25 deg grid, Version 3.0, Remote Sensing Systems, Santa Rosa, CA. Available at www.remss.com DOI: <a href='https://doi.org/10.56236/RSS-uv6h30' target="_blank" rel="noreferrer">10.56236/RSS-uv6h30</a></li>
							<li><b>Atmospheric rivers</b>: based on the methodology described in Rutz, J. J., W. J. Steenburgh, and F. M. Ralph, 2014: Climatological Characteristics of Atmospheric Rivers and Their Inland Penetration over the Western United States. Mon. Wea. Rev., 142, 905–921, <a href='https://doi.org/10.1175/MWR-D-13-00168.1' target="_blank" rel="noreferrer">https://doi.org/10.1175/MWR-D-13-00168.1</a>.</li>
							<li><b>Biological Southern Ocean State Estimate (BSOSE, coming soon)</b>:
								<ul>
									<li>M. Mazloff, P. Heimbach, and C. Wunsch, 2010: An Eddy-Permitting Southern Ocean State Estimate. J. Phys. Oceanogr., 40, 880-899. doi: <a href='https://doi.org/10.1175/2009JPO4236.1'>10.1175/2009JPO4236.1</a></li>
									<li>A. Verdy and M. Mazloff, 2017: A data assimilating model for estimating Southern Ocean biogeochemistry. J. Geophys. Res. Oceans., 122, <a href='https://doi.org/10.1002/2016JC012650'>doi:10.1002/2016JC012650</a></li>
								</ul>
							</li>
						</ul>

						<h3>Data producer responsibility</h3>
						<p>The developers are not responsible for the use made of the data accessible via Argovis or errors or 
						omissions that potentially may occur in the data sets.  While we aim to make accessible the most recent 
						and up to date data, occasionally a delay in the data feed to Argovis may be experienced.</p>

						<div className='row'>
							<div className='col-12' style={{'textAlign': 'center'}}>
								<img alt='' src='fulllogo.png' style={{'width': '10vw', 'margin':'1em'}}></img>
								<img alt='' src='Boulder_FL.jpg' style={{'width': '10vw', 'margin':'1em'}}></img>
								<img alt='' src='EarthCube-Blue-Long.png' style={{'width': '10vw', 'margin':'1em'}}></img>
							</div>
						</div>
					</div>
				</div>
			</>
		)
	}

}

export default ArgoAbout
