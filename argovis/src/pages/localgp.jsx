import React from 'react';

class Localgp extends React.Component {

	constructor(props) {
		document.title = 'localGP - About'
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
							<h2>LocalGP observation-based gridded ocean fields</h2>
						</div>
					</div>
				</div>

				<div className='row'>
					<div className='col-12 aboutBlock'>
						<h3>Intro</h3>
						<p>OHC fields are mapped using locally stationary Gaussian processes (defined over space and time) with data-driven decorrelation scales (Kuusela and Stein, 2018). A linear time trend was included in the estimate of the mean field (along with spatial terms and harmonics for the annual cycle). </p>

                        <h3>LocalGP fields currently available on Argovis</h3>
                        <p>The following fields are currently available via Argovis' API and frontend, with more coming in 2026:</p>
                        <ul>
                            <li><a href='/grids?lattice=localGPintegral&grid=potential_temperature'>Potential temperature integrated 15-50 dbar</a></li>
                        </ul>

                        <h3>Introductory notebooks</h3>
                        <p>localGP products are served as gridded products similar to other grids on Argovis. For new users, a series of jupyter notebooks are avilable to illustrate usage in python:</p>
                        <ol>
                            <li><a href='https://github.com/argovis/demo_notebooks/blob/main/Intro_to_Argovis.ipynb'>Intro to Argovis</a> - begin with an introduction to the standard patterns of Argovis API usage.</li>
                            <li><a href='https://github.com/argovis/demo_notebooks/blob/main/dataset_specific_notebooks/Grid_Intro.ipynb'>Intro to Argovis' Grid API</a> - an introduction to patterns specific to gridded products on Argovis.</li>
                            <li><a href=''>Intro to localGP</a> - some introductory examples on using localGP products via Argovis.</li>
                        </ol>

                        <h3>How to cite this product</h3>
                        <p>TBD</p>

                        <h3>Acknowledgements</h3>
                        <p>LocalGP fields were supported by NOAA awards NA21OAR4310261 and NA21OAR4310258. Upper ocean heat content fields in <a href='https://os.copernicus.org/articles/21/2463/2025/'>Sala et al. 2025</a> were also supported by NASA award 80NSSC21K0556.</p>


						
					</div>
				</div>
			</>
		)
	}

}

export default Localgp
