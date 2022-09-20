import React from 'react';

class ArgovisNav extends React.Component {
	render(){
		return(
			<nav className="navbar navbar-expand-lg bg-light">
			  <div className="container-fluid">
			    <a className="navbar-brand" href="https://github.com/argovis">Argovis</a>
			    <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
			      <span className="navbar-toggler-icon"></span>
			    </button>
			    <div className="collapse navbar-collapse" id="navbarNav">
			      <ul className="navbar-nav">
			        <li className="nav-item">
			          <a className="nav-link active" aria-current="page" href="https://github.com/argovis">Home</a>
			        </li>
			        <li className="nav-item">
			          <a className="nav-link" href="https://argovis-api.colorado.edu/docs/">API</a>
			        </li>
			        <li className="nav-item">
			          <a className="nav-link" href="https://github.com/argovis/demo_notebooks">Jupyter Notebooks</a>
			        </li>
			        <li className="nav-item">
			          <a className="nav-link" href="https://github.com/argovis">Code</a>
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

export {ArgovisNav}