import React from 'react';

class Localgp extends React.Component {

	constructor(props) {
		document.title = 'LocalGP - About'
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
						<p>LocalGP fields are mapped using locally stationary Gaussian processes (defined over space and time) with data-driven decorrelation scales (Kuusela and Stein, 2018). A linear time trend was included in the estimate of the mean field (along with spatial terms and harmonics for the annual cycle). </p>

                        <h3>LocalGP fields available on Argovis and how to cite them</h3>
                        <p>The following fields are currently available via Argovis' API and frontend, with more coming in 2026. If you use these fields, please cite the relevant references as indicated.</p>
                        <ul>
                            <li>Potential temperature integrated 15-50 dbar 
                                <ul>
                                    <li>How to cite: 

Sala, J., Giglio, D., Capotondi, A., Sukianto, T., and Kuusela, M.: Leading dynamical processes of global marine heatwaves in an ocean state estimate, Ocean Sci., 21, 2463–2479, <a href='https://doi.org/10.5194/os-21-2463-2025'>https://doi.org/10.5194/os-21-2463-2025</a>, 2025.</li>
                                    <li>API route: <span style={{'font-family':'Courier'}}>grids/localGPintegral?data=potential_temperature</span></li> 
                                    <li><a href='/grids?lattice=localGPintegral&grid=potential_temperature'>frontend visualization page</a></li>
                                </ul>
                            </li>
                        </ul>

                        <h3>Introductory notebooks</h3>
                        <p>LocalGP products are served as gridded products similar to other grids on Argovis. For new users, a series of jupyter notebooks are avilable to illustrate usage in python:</p>
                        <ol>
                            <li><a href='https://github.com/argovis/demo_notebooks/blob/main/Intro_to_Argovis.ipynb'>Intro to Argovis</a> - begin with an introduction to the standard patterns of Argovis API usage.</li>
                            <li><a href='https://github.com/argovis/demo_notebooks/blob/main/dataset_specific_notebooks/Grid_Intro.ipynb'>Intro to Argovis' Grid API</a> - an introduction to patterns specific to gridded products on Argovis.</li>
                            <li><a href='https://github.com/argovis/demo_notebooks/blob/main/dataset_specific_notebooks/Intro_to_LocalGP.ipynb'>Intro to LocalGP</a> - some introductory examples on using LocalGP products via Argovis.</li>
                        </ol>

                        <h3>Acknowledgements</h3>
                        <p>LocalGP fields were supported by NOAA awards NA21OAR4310261 and NA21OAR4310258. Upper ocean heat content fields in <a href='https://os.copernicus.org/articles/21/2463/2025/'>Sala et al. 2025</a> were also supported by NASA award 80NSSC21K0556.</p>


						
					</div>
				</div>
			</>
		)
	}

}

export default Localgp
