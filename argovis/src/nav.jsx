// top navigation bar on all argovis pages

import React from 'react';

class Dropdown extends React.Component {
  state = {
    isOpen: false
  };

  toggleOpen = () => this.setState({ isOpen: !this.state.isOpen });

  render() {
    const menuClass = `dropdown-menu${this.state.isOpen ? " show" : ""}`;
    return (
      <li className="nav-item dropdown" onClick={this.toggleOpen}>
        <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
          Explore
        </a>
        <div className={menuClass} aria-labelledby="navbarDropdown">
  	      <h6 className="dropdown-header">Datasets</h6>
          <a className="dropdown-item" href="/argo">Argo profiles</a>
          <a className="dropdown-item" href="/ships">Ship-based profiles</a>
          <a className="dropdown-item" href="/drifters">Global drifter program</a>
          <a className="dropdown-item" href="/tc">Tropical cyclones</a>
          <div className="dropdown-divider"></div>
          <h6 className="dropdown-header">Gridded Products</h6>
          <a className="dropdown-item" href="/grids?grid=temperature_rg">RG Temperature</a>
          <a className="dropdown-item" href="/grids?grid=salinity_rg">RG Salinity</a>
          <a className="dropdown-item" href="/grids?grid=ohc_kg">KG Ocean heat content</a>
        </div>
      </li>
    );
  }
}

class ArgovisNav extends React.Component {
	render(){
		return(
			<nav className="navbar navbar-expand-lg bg-light">
			  <div className="container-fluid">
			    <a className="navbar-brand" href="https://github.com/argovis"><img src={'/fulllogo.png'} style={{'height':'30px'}} className='img-fluid'/></a>
			    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
			      <span className="navbar-toggler-icon"></span>
			    </button>
			    <div className="collapse navbar-collapse" id="navbarNav">
			      <ul className="navbar-nav mr-auto">
			      	<Dropdown/>
			        <li className="nav-item">
			          <a className="nav-link" href="https://argovis-api.colorado.edu/docs/">API</a>
			        </li>
			        <li className="nav-item">
			          <a className="nav-link" href="https://github.com/argovis/demo_notebooks">Jupyter Notebooks</a>
			        </li>
			        <li className="nav-item">
			          <a className="nav-link" href="https://github.com/argovis">Publications</a>
			        </li>
			        <li className="nav-item">
			          <a className="nav-link" href="https://github.com/argovis">About</a>
			        </li>
			      </ul>
			    </div>
			  </div>
			</nav>
		)
	}
}

export default ArgovisNav