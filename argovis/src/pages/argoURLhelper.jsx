import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import moment from 'moment';

class ArgoURLhelper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // data request parameters
      profileId: '',
      startDate: '',
      endDate: '',
      polygon: '',
      box: '',
      center: '',
      radius: '',
      metadata: '',
      platformId: '',
      platformType: '',
      positionQC: '',
      profileSource: '',
      compression: '',
      data: 'all',
      verticalRange: '',
      batchMetadata: '',
      temp_startDate: '',
      raw_startDate: '',
      temp_endDate: '',
      raw_endDate: '',
      datesValid: true, polygonValid: true, boxValid: true, centerValid: true, radiusValid: true, positionQCValid: true, profileSourceValid: true, dataValid: true, verticalRangeValid: true,
      polygonTouched: false, boxTouched: false, centerTouched: false, radiusTouched: false, positionQCTouched: false, profileSourceTouched: false, dataTouched: false, verticalRangeTouched: false,

      // metadata request parameters
      meta_id: '',
      meta_platform: '',

      // vocab request parameters
      vocab_parameter: '',
    };
  }

  handleTextInput = (name, raw) => {
    this.setState({ [`raw_${name}`]: raw });
  };
  
  handleDatePickerChange = (name, date) => {
    if (!date || !date.isValid?.()) return;
  
    this.setState({
      [`temp_${name}`]: date,
      [`raw_${name}`]: date.format('YYYY-MM-DD HH:mm:ss'),
      datesValid: true
    });
  };
  
  handleDateBlur = (name) => {
    const raw = this.state[`raw_${name}`];
    const parsed = moment(raw, 'YYYY-MM-DD HH:mm:ss', true);
    if (raw.length > 0 && !parsed.isValid()) {
      // Leave raw input alone, just mark invalid if desired
      this.setState({ datesValid: false });
      return;
    }

    // invalidate backwards dates
    const other = name === 'startDate' ? 'endDate' : 'startDate';
    const otherDate = this.state['temp_'+other];
    let valid = true;
    if (name === 'startDate' && otherDate && parsed.isAfter(otherDate)) valid = false;
    if (name === 'endDate' && otherDate && parsed.isBefore(otherDate)) valid = false;

    if(raw === '' && this.state['raw_'+other] === '') {
        valid = true;
    }

    if(parsed.isValid() || valid){
        this.setState({
        [`temp_${name}`]: parsed.isValid() ? parsed : '',
        datesValid: valid
        });
    }
  };

  isValidPolygon = (polygon) => {
    if(polygon.length === 0) return true;

    try {
      polygon = JSON.parse(polygon);

      if (!Array.isArray(polygon)) return false;
      if (polygon.length < 4) return false;
    
      for (let i = 0; i < polygon.length; i++) {
        if (!Array.isArray(polygon[i]) || polygon[i].length !== 2) return false;
        if (typeof polygon[i][0] !== 'number' || typeof polygon[i][1] !== 'number') return false;
      }
  
      if(polygon[0][0] !== polygon[polygon.length - 1][0] || polygon[0][1] !== polygon[polygon.length - 1][1] ) return false;
    
      return true;
    } catch (e) {
      return false; 
    }
  }

  isValidBox = (box) => {
    if(box.length === 0) return true;

    try {
      box = JSON.parse(box);
  
      if (!Array.isArray(box) || box.length !== 2) return false;
      
      for (let i = 0; i < box.length; i++) {
        if (!Array.isArray(box[i]) || box[i].length !== 2) return false;
        if (typeof box[i][0] !== 'number' || typeof box[i][1] !== 'number') return false;
      }
    
      return true;
    } catch (e) {
      return false; 
    }
  }

  isValidCenter = (value) => {
    if(value.length === 0) return true;

    const tokens = value.split(',').map(token => parseFloat(token.trim()));
    
    if (tokens.length !== 2) return false;
    
    const [first, second] = tokens;
    
    return !isNaN(first) && !isNaN(second);
  }
  isValidNumber = (value) => {
    return !isNaN(value);
  }

  isValidCoordinatePair = (pair) => {
    if(pair.length === 0) return true;

    try {
      pair = JSON.parse(pair);
  
      if (!Array.isArray(pair) || pair.length !== 2) return false;
      if (typeof pair[0] !== 'number' || typeof pair[1] !== 'number') return false;
    
      return true;
    } catch (e) {
      return false; 
    }
  }

  isValidProfileSource = (value) => {
    if(value.length === 0) return true;

    const tokens = value.split(',').map(token => token.trim());
    const validTokens = ['argo_core', 'argo_bgc', 'argo_deep'];
    
    return tokens.every(token => {
      const isNegated = token.startsWith('~');
      const actualToken = isNegated ? token.slice(1) : token;
      return validTokens.includes(actualToken);
    });
  }

  isValidData = (value) => {
    if(value.length === 0) return true;

    const pattern = "^((~)?((bbp470)|(bbp532)|(bbp700)|(bbp700_2)|(bisulfide)|(cdom)|(chla)|(cndc)|(cndx)|(cp660)|(down_irradiance380)|(down_irradiance412)|(down_irradiance442)|(down_irradiance443)|(down_irradiance490)|(down_irradiance555)|(down_irradiance670)|(downwelling_par)|(doxy)|(doxy2)|(doxy3)|(molar_doxy)|(nitrate)|(ph_in_situ_total)|(pressure)|(salinity)|(salinity_sfile)|(temperature)|(temperature_sfile)|(turbidity)|(up_radiance412)|(up_radiance443)|(up_radiance490)|(up_radiance555){1})((_std)|(_med){1})?(_argoqc)?|all|except-data-values|[0-9]+)$";
    const regex = new RegExp(pattern);
    const tokens = value.split(',').map(token => token.trim());
    
    return tokens.every(token => regex.test(token));
  }

  isValidVerticalRange = (value) => {
    if(value.length === 0) return true;

    const tokens = value.split(',').map(token => parseFloat(token.trim()));
    
    if (tokens.length !== 2) return false;
    
    const [first, second] = tokens;
    
    return !isNaN(first) && !isNaN(second) && first >= 0 && second >= 0 && second > first;
  }

isLocationValid = () => {
    const { polygon, box, center, radius } = this.state;
    const centerDefined = center != null && center !== '';
    const radiusDefined = radius != null && radius !== '';
    const centerAndRadiusDefined = centerDefined && radiusDefined;
    const polygonDefined = polygon != null && polygon !== '';
    const boxDefined = box != null && box !== '';

    return ((polygonDefined && !boxDefined && !centerDefined && !radiusDefined) ||
            (boxDefined && !polygonDefined && !centerDefined && !radiusDefined) ||
            (centerAndRadiusDefined && !polygonDefined && !boxDefined) ||
            (!polygonDefined && !boxDefined && !centerAndRadiusDefined));
}

  handleChange = (event) => {
    this.setState({
      [event.target.name]: event.target.value,
    });
  }

  handleGenericFocus = (field) => {
    this.setState({ [field]: true });
  }

  handleGenericBlur = (field) => {
    this.setState({ [field]: false });
  }

  handlePolygonChange = (event) => {
    let polygon = event.target.value;
    const isValid = this.isValidPolygon(polygon);
    
    this.setState({
      polygon,
      polygonValid: isValid,
    });
  }

  handleBoxChange = (event) => {
    let box = event.target.value;
    const isValid = this.isValidBox(box);
    
    this.setState({
      box,
      boxValid: isValid,
    });
  }

  handleCenterChange = (event) => {
    let center = event.target.value;
    const isValid = this.isValidCenter(center);
    
    this.setState({
      center,
      centerValid: isValid,
    });
  }
  
  handleRadiusChange = (event) => {
    let radius = event.target.value;
    const isValid = this.isValidNumber(radius);
    
    this.setState({
      radius,
      radiusValid: isValid,
    });
  }

  handleBatchMetadataChange = (event) => {
    this.setState({ batchMetadata: event.target.checked });
  }

  handlePositionQCChange = (event) => {
    const positionQC = event.target.value;
    const positionQCArray = positionQC.split(',').map(Number);
    const positionQCValid = positionQCArray.every(num => Number.isInteger(num) && num >= -1 && num <= 9);
    this.setState({ positionQC, positionQCValid });
  }

  handleProfileSourceChange = (event) => {
    let profileSource = event.target.value;
    const isValid = this.isValidProfileSource(profileSource);
    
    this.setState({
      profileSource,
      profileSourceValid: isValid,
    });
  }

  handleCompressionChange = (event) => {
    this.setState({ compression: event.target.checked ? 'minimal':null });
  }

  handleDataChange = (event) => {
    let data = event.target.value;
    const isValid = this.isValidData(data);
    
    this.setState({
      data,
      dataValid: isValid,
    });
  }

  handleVerticalRangeChange = (event) => {
    let verticalRange = event.target.value;
    const isValid = this.isValidVerticalRange(verticalRange);
    
    this.setState({
      verticalRange,
      verticalRangeValid: isValid,
    });
  }

  render() {
    const {
      profileId, polygon, box, center, radius, metadata,
      platformId, platformType, positionQC, profileSource, compression,
      data, verticalRange, batchMetadata,
      temp_startDate,
      temp_endDate,
      datesValid, polygonValid, boxValid, centerValid, radiusValid, positionQCValid, profileSourceValid, dataValid, verticalRangeValid,
      polygonTouched, boxTouched, centerTouched, radiusTouched, positionQCTouched, profileSourceTouched, dataTouched, verticalRangeTouched,
      meta_id, meta_platform,
      vocab_parameter,
    } = this.state;

    const locationValid = this.isLocationValid();    

    // Create an array of parameters
    const params = [
      profileId && `id=${encodeURIComponent(profileId)}`,
      temp_startDate && `startDate=${temp_startDate.format('YYYY-MM-DDTHH:mm:ss')+'Z'}`,
      temp_endDate && `endDate=${temp_endDate.format('YYYY-MM-DDTHH:mm:ss')+'Z'}`,
      polygon && `polygon=${polygon}`,
      box && `box=${box}`,
      center && `center=${center}`,
      radius && `radius=${encodeURIComponent(radius)}`,
      metadata && `metadata=${encodeURIComponent(metadata)}`,
      platformId && `platform=${encodeURIComponent(platformId)}`,
      platformType && `platform_type=${encodeURIComponent(platformType)}`,
      positionQC && `positionqc=${positionQC}`,
      profileSource && `source=${profileSource}`,
      compression && `compression=${encodeURIComponent(compression)}`,
      data && `data=${data}`,
      verticalRange && `verticalRange=${verticalRange}`,
      batchMetadata && `batchmeta=true`,
    ].filter(Boolean); // Remove any undefined values
    // Join the parameters with '&' to form the query string
    const queryString = params.join('&');
    const url = `https://argovis-api.colorado.edu/argo?${queryString}`;

    // do the same for metadata
    const metaParams = [
      meta_id && `id=${encodeURIComponent(meta_id)}`,
      meta_platform && `platform=${encodeURIComponent(meta_platform)}`,
    ].filter(Boolean);
    const metaQueryString = metaParams.join('&');
    const metaUrl = `https://argovis-api.colorado.edu/argo/meta?${metaQueryString}`

    // do the same for vocab
    const vocabParams = [
      vocab_parameter && `parameter=${encodeURIComponent(vocab_parameter)}`,
    ].filter(Boolean);
    const vocabQueryString = vocabParams.join('&');
    const vocabUrl = `https://argovis-api.colorado.edu/argo/vocabulary?${vocabQueryString}`

    return (
    <>
    <div className='row'>
        <div className='col-12 hero-wrap'>
            <div className='hero'>
                <h2>Argo API request builder</h2>
            </div>
        </div>
    </div>
    <div style={{'marginLeft':'15%', 'marginRight':'15%', 'marginTop':'1em'}}>
        <h2>Introduction</h2>
        <ul>
            <li>There are three independent API request helpers below, for the data, metadata, and vocabulary routes, respectively.</li>
            <li>Fill out the fields and section of interest below to construct an API call that filters for Argo data most relevant to you.</li>
            <li>No specific field is mandatory, but for data queries please at least constrain the temporospatial extent of your query; if you get an HTTP error 413, you need to request a smaller temporospatial region.</li>
            <li>When you're done, click the large link at the top of the section to fetch your data.</li>
            <li>Once you get the hang of the URL patterns, you can make these requests directly in your programming language of choice. Don't forget to register for and use <a href='https://argovis-keygen.colorado.edu/' target="_blank" rel="noreferrer">an API token</a> in order to receive your own private resource allocation.</li>
        </ul>
        <div className="accordion" id="accordionExample">
            <div className="accordion-item">
                <h2 className="accordion-header" id="headingOne">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                    <h3>Data requests</h3>
                    </button>
                </h2>
                <div id="collapseOne" className="accordion-collapse collapse" aria-labelledby="headingOne" data-bs-parent="#accordionExample">
                    <div className="accordion-body">
                        <p>Data requests get documents corresponding to individual Argo profiles.</p>
                        <h3><a href={url} target="_blank" rel="noreferrer">{url}</a></h3>
                        <form>
                            <div className='row form-section'>
                                <h4>Temporospatial filters</h4>
                                <p><i>Restrict your search to a specific time and place.</i></p>
                                <div id='time_filters' className={datesValid ? 'row' : 'row invalid'}>
                                    <div className='col-4'>
                                        <label className="form-label">
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                    <Tooltip id="startDate-tooltip" className="wide-tooltip">
                                                        The earliest timestamp to search for, GMT+0, boundary-inclusive. Format <span style={{"fontFamily":"monospace", "whiteSpace": "nowrap"}}>YYYY-MM-DD HH:mm:ss</span>
                                                    </Tooltip>
                                                }
                                                trigger="click"
                                            >
                                                <i className="fa fa-question-circle" aria-hidden="true"></i>
                                            </OverlayTrigger>
                                            Start Date:
                                            <Datetime
                                                dateFormat="YYYY-MM-DD"
                                                timeFormat="HH:mm:ss"
                                                value={this.state.temp_startDate}
                                                onChange={date => this.handleDatePickerChange('startDate', date)}
                                                inputProps={{
                                                    onChange: (e) => this.handleTextInput('startDate', e.target.value),
                                                    onBlur: () => this.handleDateBlur('startDate'),
                                                    value: this.state.raw_startDate || '',
                                                    placeholder: 'YYYY-MM-DD HH:mm:ss',
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <div className='col-4'>
                                        <label className="form-label">
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                    <Tooltip id="endDate-tooltip" className="wide-tooltip">
                                                        The latest timestamp to search for, GMT+0, boundary-exclusive. Format <span style={{"fontFamily":"monospace", "whiteSpace": "nowrap"}}>YYYY-MM-DD HH:mm:ss</span>
                                                    </Tooltip>
                                                }
                                                trigger="click"
                                            >
                                                <i className="fa fa-question-circle" aria-hidden="true"></i>
                                            </OverlayTrigger>
                                            End Date:
                                            <Datetime
                                                dateFormat="YYYY-MM-DD"
                                                timeFormat="HH:mm:ss"
                                                value={this.state.temp_endDate}
                                                onChange={date => this.handleDatePickerChange('endDate', date)}
                                                inputProps={{
                                                    onChange: (e) => this.handleTextInput('endDate', e.target.value),
                                                    onBlur: () => this.handleDateBlur('endDate'),
                                                    value: this.state.raw_endDate || '',
                                                    placeholder: 'YYYY-MM-DD HH:mm:ss',
                                                }}
                                            />
                                        </label>
                                    </div>
                                    {!datesValid && <p className="validation-message">Invalid dates. Format must be YYYY-MM-DD HH:mm:ss, and start date must be before end date, if both are defined.</p>}
                                </div>
                                <div id='space_filters' className={locationValid ? 'row' : 'row invalid'}>
                                    <p><i>Fill in at most one of polygon, box, or center and radius.</i></p>
                                    <div className='col-4'>
                                        <label className="form-label">
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                    <Tooltip id="polygon-tooltip" className="wide-tooltip">
                                                        To limit your search results to an arbitrary polygon, enter the vertex coordinates of the polygon in the format: [[lon0,lat0],[lon1,lat1],...,[lonN,latN],[lon0,lat0]]. The first and last coordinates must be the same. Try drawing a polygon at <a href='https://argovis.colorado.edu' target="_blank" rel="noreferrer">argovis.colorado.edu</a> and copying it from the resulting URL if you need a visual aide.
                                                    </Tooltip>
                                                }
                                                trigger="click"
                                            >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>  
                                            </OverlayTrigger>
                                            Polygon:
                                            <input
                                                type="text"
                                                value={this.state.polygon}
                                                onChange={this.handlePolygonChange}
                                                onBlur={this.handleGenericBlur.bind(this, 'polygonTouched')}
                                                onFocus={this.handleGenericFocus.bind(this, 'polygonTouched')}
                                                className={polygonValid ? 'form-control' : 'form-control invalid'}
                                            />
                                        </label>
                                        {!polygonValid && !polygonTouched && <p className="validation-message">Invalid polygon. A valid polygon is an array of longitude, longitude pairs, for example: [[0,0],[0,1],[1,1],[1,0],[0,0]]. Notice the first and last vertexes match, per the geoJSON spec.</p>}
                                    </div>
                                    <div className='col-4'>
                                        <label className="form-label">
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                    <Tooltip id="box-tooltip" className="wide-tooltip">
                                                        A box region to seach in, written as [[southwest lon,southwest lat],[northeast lon,northeast lat]].
                                                    </Tooltip>
                                                }
                                                trigger="click"
                                            >
                                                <i className="fa fa-question-circle" aria-hidden="true"></i>
                                            </OverlayTrigger>
                                            Box:
                                            <input
                                                type="text"
                                                value={this.state.box}
                                                onChange={this.handleBoxChange}
                                                onBlur={this.handleGenericBlur.bind(this, 'boxTouched')}
                                                onFocus={this.handleGenericFocus.bind(this, 'boxTouched')}
                                                className={boxValid ? 'form-control' : 'form-control invalid'}
                                            />
                                        </label>
                                        {!boxValid && !boxTouched && <p className="validation-message">Invalid box. A valid box is descrbed by its southwest corner followed by its northeast corner, set as longitude,latitude, for example: [[0,0],[10,10]].</p>}
                                    </div>
                                    <div className='col-4'>
                                        <label className="form-label">
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                    <Tooltip id="center-tooltip" className="wide-tooltip">
                                                        Use with radius to search for profiles near this centerpoint, written as longitude,latitude.
                                                    </Tooltip>
                                                }
                                                trigger="click"
                                            >
                                                <i className="fa fa-question-circle" aria-hidden="true"></i>
                                            </OverlayTrigger>
                                            Center:
                                            <input
                                                type="text"
                                                value={this.state.center}
                                                onChange={this.handleCenterChange}
                                                onBlur={this.handleGenericBlur.bind(this, 'centerTouched')}
                                                onFocus={this.handleGenericFocus.bind(this, 'centerTouched')}
                                                className={centerValid ? 'form-control' : 'form-control invalid'}
                                            />
                                        </label>
                                        <label className="form-label">
                                            <OverlayTrigger
                                                placement="right"
                                                overlay={
                                                    <Tooltip id="radius-tooltip" className="wide-tooltip">
                                                        Use with center to search for profiles within this many kilometers of the centerpoint.
                                                    </Tooltip>
                                                }
                                                trigger="click"
                                            >
                                                <i className="fa fa-question-circle" aria-hidden="true"></i>
                                            </OverlayTrigger>
                                            Radius:
                                            <input
                                                type="text"
                                                value={this.state.radius}
                                                onChange={this.handleRadiusChange}
                                                onBlur={this.handleGenericBlur.bind(this, 'radiusTouched')}
                                                onFocus={this.handleGenericFocus.bind(this, 'radiusTouched')}
                                                className={radiusValid ? 'form-control' : 'form-control invalid'}
                                            />
                                        </label>
                                        {!centerValid && !centerTouched && <p className="validation-message">Invalid center. A valid center is descrbed by a longitude, latitude pair, for example: 0,0.</p>}
                                        {!radiusValid && !radiusTouched && <p className="validation-message">Invalid radius. A valid radius is descrbed by a single number, in kilometers.</p>}
                                    </div>
                                    {!locationValid && <span className="validation-message">Invalid location. Please only specify one of polygon, box, or center plus radius.</span>}
                                </div>
                                <div>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="compression-tooltip" className="wide-tooltip">
                                                    Check this box to get back only minimal data for each matching profile: [profile ID, longitude, latitude, timestamp, argo source, metadata ID]. Good for making maps.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Compression:
                                        <input
                                            type="checkbox"
                                            checked={this.state.compression}
                                            onChange={this.handleCompressionChange}
                                        />
                                    </label>
                                </div>
                            </div>
                            <div className='row form-section'>
                                <h4>Data filters</h4>
                                <p><i>Request per-level data, and filter for specific measurements, QC, and pressure levels.</i></p>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="data-tooltip" className="wide-tooltip">
                                                    List the data variables you want to search for, for example temperature,doxy; you will get back only profiles that have these measurements, and only these measurements plus pressure. Use 'all' to get back every available measurement. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=data' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=data</a> for a list of Argo data variables. <br/>You can also enforce QC requirements: temperature,1 will return only levels that have temperature QC of 1, for example. You can also request the explicit QC levels be returned by suffixing _argoqc to a varaible name, like temperature_argoqc. <br/>Furthermore, you can also negate variables: temperature,~doxy will return the temperature measurements from profiles that do not include a doxy measurement. <br/>Finally, you can use 'except-data-values' to perform the same filtering, but then suppress the actual data values (typically for mapping applications).
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Data:
                                        <input
                                            type="text"
                                            name="data"
                                            value={this.state.data}
                                            onChange={this.handleDataChange}
                                            onBlur={this.handleGenericBlur.bind(this, 'dataTouched')}
                                            onFocus={this.handleGenericFocus.bind(this, 'dataTouched')}
                                            className={dataValid ? 'form-control' : 'form-control invalid'}
                                        />
                                    </label>
                                    {!dataValid && !dataTouched && <p className="validation-message">Invalid data string. data should be a comma separated list of the measurements you want profiles for; you may also negate a parameter with ~ to get profiles that do not include this measurement. Furthermore, you can add 'all' to the list to get every measurement avaialble in the profile, or 'except-data-values' to perform the same filtering, but then suppress the actual data values (typically for mapping applications). See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=data' target="_blank" rel="noreferrer">this vocabulary</a> for a list of Argo data variables.</p>}
                                </div>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="verticalrange-tooltip" className="wide-tooltip">
                                                    List the vertical range you want to search for in dbar, for example 0,10; you'll only download levels in this pressure range in the profiles matching the rest of your search. <br/>Note that the vertical range is in dbar below the surface, so 0,10 would filter for levels at the surface down to 10 dbar.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Vertical Range:
                                        <input
                                            type="text"
                                            name="verticalRange"
                                            value={this.state.verticalRange}
                                            onChange={this.handleVerticalRangeChange}
                                            onBlur={this.handleGenericBlur.bind(this, 'verticalRangeTouched')}
                                            onFocus={this.handleGenericFocus.bind(this, 'verticalRangeTouched')}
                                            className={verticalRangeValid ? 'form-control' : 'form-control invalid'}
                                        />
                                    </label>
                                    {!verticalRangeValid && !verticalRangeTouched && <p className="validation-message">Invalid vertical range. Should be two comma separated numbers representing dbar below surface; so, 0,10 would filter for levels at the surface down to 10 dbar.</p>}
                                </div>
                            </div>
                            <div className='row form-section'>
                                <h4>Argo-specific filters</h4>
                                <p><i>Filter results using Argo-specific parameters, like platforms, individual profiles, and mission.</i></p>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="id-tooltip" className="wide-tooltip">
                                                    Use this to specify a single profile by ID. Profile IDs are constructed as &lt;platform_number&gt;_&lt;cycle_number&gt;.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Profile ID:
                                        <input type="text" name="profileId" value={profileId} onChange={this.handleChange} className="form-control" />
                                    </label>
                                </div>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="platform-tooltip" className="wide-tooltip">
                                                    Use this to search for all profiles from a given platform. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=platform' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=platform</a> for a list of platform IDs.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Platform ID:
                                        <input type="text" name="platformId" value={platformId} onChange={this.handleChange} className="form-control" />
                                    </label>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="platformtype-tooltip" className="wide-tooltip">
                                                    Use this to restrict results to profiles from a given platform type. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=platform_type' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=platform_type</a> for a list of platform types.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Platform Type:
                                        <input type="text" name="platformType" value={platformType} onChange={this.handleChange} className="form-control"/>
                                    </label>
                                </div>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="positionqc-tooltip" className="wide-tooltip">
                                                    Use this to filter profiles for any of a list of position QC flags, for example 1,2,8,9. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=position_qc' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=position_qc</a> for a list of position QC flags. See <a href='https://archimer.ifremer.fr/doc/00228/33951/' target="_blank" rel="noreferrer">https://archimer.ifremer.fr/doc/00228/33951/</a> for documentation from Argo on the meaning of these flags.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Position QC:
                                        <input
                                            type="text"
                                            value={this.state.positionQC}
                                            onChange={this.handlePositionQCChange}
                                            onBlur={this.handleGenericBlur.bind(this, 'positionQCTouched')}
                                            onFocus={this.handleGenericFocus.bind(this, 'positionQCTouched')}
                                            className={positionQCValid ? 'form-control' : 'form-control invalid'}
                                        />
                                    </label>
                                    {!positionQCValid && !positionQCTouched && <p className="validation-message">Invalid position QC value. Position QC should be a comma-separated list of integers from -1 to 9.</p>}
                                
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="source-tooltip" className="wide-tooltip">
                                                    Use this to filter profiles by their Argo mission, any of argo_core, argo_bgc, argo_deep, possibly negated with a ~. For example, argo_core,~argo_deep filters for argo core profiles that are not also argo deep profiles.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Profile Source:
                                        <input
                                            type="text"
                                            name="profileSource"
                                            value={this.state.profileSource}
                                            onChange={this.handleProfileSourceChange}
                                            onBlur={this.handleGenericBlur.bind(this, 'profileSourceTouched')}
                                            onFocus={this.handleGenericFocus.bind(this, 'profileSourceTouched')}
                                            className={profileSourceValid ? 'form-control' : 'form-control invalid'}
                                        />
                                    </label>
                                    {!profileSourceValid && !profileSourceTouched && <p className="validation-message">Invalid profile source. A valid profile source is a list of the tokens argo_core, argo_bgc, and / or argo_deep, each possibly negated with a ~. For example, argo_core,~argo_deep filters for argo core profiles that are not also argo deep profiles.</p>}
                                </div>
                            </div>
                            <div className='row form-section'>
                                <h4>Other filters</h4>
                                <p><i>Some advanced options for manipulating how data of interest are returned or represented.</i></p>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="metadata-tooltip" className="wide-tooltip">
                                                    Use this to search for all profiles that share a specific metadata ID. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=metadata' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=metadata</a> for a list of metadata IDs.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Metadata:
                                        <input type="text" name="metadata" value={metadata} onChange={this.handleChange} className="form-control" />
                                    </label>

                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="batchmeta-tooltip" className="wide-tooltip">
                                                    Return all the metadata documents that correspond to the data documents matching this search (instead of returning the data documents themsleves).
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Batch Metadata:
                                        <input
                                            type="checkbox"
                                            checked={this.state.batchMetadata}
                                            onChange={this.handleBatchMetadataChange}
                                        />
                                    </label>  
                                </div>    
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="accordion-item">
                <h2 className="accordion-header" id="headingTwo">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="true" aria-controls="collapseTwo">
                    <h3>Metadata requests</h3>
                    </button>
                </h2>
                <div id="collapseTwo" className="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#accordionExample">
                    <div className="accordion-body">
                        <p>Metadata requests get documents that describe metadata that is roughly consistent over the life of a float.</p>
                        <h3><a href={metaUrl} target="_blank" rel="noreferrer">{metaUrl}</a></h3>
                        <form>
                            <div className='row form-section'>
                                <h4>Metadata filters</h4>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="metadata_id-tooltip" className="wide-tooltip">
                                                    Use this to specify a single metadata document by ID. Metadata IDs are constructed as &lt;platform_number&gt;_m&lt;metadata_number&gt;.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Metadata ID:
                                        <input type="text" name="meta_id" value={meta_id} onChange={this.handleChange} className="form-control" />
                                    </label>
                                </div>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="metadata_platform-tooltip" className="wide-tooltip">
                                                    Use this to search for all metadata documents from a given platform. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=platform' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=platform</a> for a list of platform IDs.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Platform ID:
                                        <input type="text" name="meta_platform" value={meta_platform} onChange={this.handleChange} className="form-control" />
                                    </label>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            <div className="accordion-item">
                <h2 className="accordion-header" id="headingThree">
                    <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="true" aria-controls="collapseThree">
                    <h3>Vocabulary requests</h3>
                    </button>
                </h2>
                <div id="collapseThree" className="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#accordionExample">
                    <div className="accordion-body">
                        <p>Vocabulary requests show the allowed values for some filters on data and metadata queries.</p>
                        <h3><a href={vocabUrl} target="_blank" rel="noreferrer">{vocabUrl}</a></h3>
                        <form>
                            <div className='row form-section'>
                                <h4>Vocabulary filters</h4>
                                <div className='col-4'>
                                    <label className="form-label">
                                        <OverlayTrigger
                                            placement="right"
                                            overlay={
                                                <Tooltip id="vocab-param-tooltip" className="wide-tooltip">
                                                    Use this to specify the search parameter you'd like to see valid values for. Options are enum, platform, source, data, metadata, platform_type, position_qc.
                                                </Tooltip>
                                            }
                                            trigger="click"
                                        >
                                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                                        </OverlayTrigger>
                                        Parameter:
                                        <input type="text" name="vocab_parameter" value={vocab_parameter} onChange={this.handleChange} className="form-control" />
                                    </label>
                                </div>
                            </div>                
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
    );
  }
}

export default ArgoURLhelper;