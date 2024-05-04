import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

class ArgoURLhelper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
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
      mostRecent: '',
      data: '',
      pressureRange: '',
      batchMetadata: '',

      temp_startDate: '',
      temp_endDate: '',
      datesValid: true, polygonValid: true, boxValid: true, centerValid: true, radiusValid: true, positionQCValid: true, profileSourceValid: true, mostRecentValid: true, dataValid: true, pressureRangeValid: true,
      polygonTouched: false, boxTouched: false, centerTouched: false, radiusTouched: false, positionQCTouched: false, profileSourceTouched: false, mostRecentTouched: false, dataTouched: false, pressureRangeTouched: false,
    };
  }

  handleDateChange = (name, date) => {
    let isValid = true;
  
    if(date.length === 0) {
      isValid = true;
    }else if (name === 'endDate' && this.state.temp_startDate && date.isBefore(this.state.temp_startDate)) {
      isValid = false;
    } else if (name === 'startDate' && this.state.temp_endDate && date.isAfter(this.state.temp_endDate)) {
      isValid = false;
    }
  
    this.setState({
      [`temp_${name}`]: date,
      [`datesValid`]: isValid,
    });
  }

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

  isValidMostRecent = (value) => {
    if(value.length === 0) return true;
    const intValue = parseInt(value, 10);
    return !isNaN(value) && Number(value) === intValue && intValue > 0;
  }

  isValidData = (value) => {
    if(value.length === 0) return true;

    const pattern = "^((~)?((bbp470)|(bbp532)|(bbp700)|(bbp700_2)|(bisulfide)|(cdom)|(chla)|(cndc)|(cndx)|(cp660)|(down_irradiance380)|(down_irradiance412)|(down_irradiance442)|(down_irradiance443)|(down_irradiance490)|(down_irradiance555)|(down_irradiance670)|(downwelling_par)|(doxy)|(doxy2)|(doxy3)|(molar_doxy)|(nitrate)|(ph_in_situ_total)|(pressure)|(salinity)|(salinity_sfile)|(temperature)|(temperature_sfile)|(turbidity)|(up_radiance412)|(up_radiance443)|(up_radiance490)|(up_radiance555){1})((_std)|(_med){1})?(_argoqc)?|all|except-data-values|[0-9]+)$";
    const regex = new RegExp(pattern);
    const tokens = value.split(',').map(token => token.trim());
    
    return tokens.every(token => regex.test(token));
  }

  isValidPressureRange = (value) => {
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

    return (polygonDefined && !boxDefined && !centerDefined && !radiusDefined ||
            boxDefined && !polygonDefined && !centerDefined && !radiusDefined ||
            centerAndRadiusDefined && !polygonDefined && !boxDefined ||
            !polygonDefined && !boxDefined && !centerAndRadiusDefined);
}

  handleDateBlur = (name) => {
    this.setState({
      [name]: this.state[`temp_${name}`].format('YYYY-MM-DDTHH:mm:ss'),
    });
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
    const isValid = this.isValidCoordinatePair(center);
    
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

  handleMostRecentChange = (event) => {
    let mostRecent = event.target.value;
    const isValid = this.isValidMostRecent(mostRecent);
    
    this.setState({
      mostRecent,
      mostRecentValid: isValid,
    });
  }

  handleDataChange = (event) => {
    let data = event.target.value;
    const isValid = this.isValidData(data);
    
    this.setState({
      data,
      dataValid: isValid,
    });
  }

  handlePressureRangeChange = (event) => {
    let pressureRange = event.target.value;
    const isValid = this.isValidPressureRange(pressureRange);
    
    this.setState({
      pressureRange,
      pressureRangeValid: isValid,
    });
  }

  render() {
    const {
      profileId, startDate, endDate, polygon, box, center, radius, metadata,
      platformId, platformType, positionQC, profileSource, compression, mostRecent,
      data, pressureRange, batchMetadata,
      temp_startDate,
      temp_endDate,
      datesValid, polygonValid, boxValid, centerValid, radiusValid, positionQCValid, profileSourceValid, mostRecentValid, dataValid, pressureRangeValid,
      polygonTouched, boxTouched, centerTouched, radiusTouched, positionQCTouched, profileSourceTouched, mostRecentTouched, dataTouched, pressureRangeTouched,
    } = this.state;

    const locationValid = this.isLocationValid();    

    // Create an array of parameters
    const params = [
      profileId && `id=${encodeURIComponent(profileId)}`,
      temp_startDate && `startDate=${temp_startDate.format('YYYY-MM-DDTHH:mm:ss')+'Z'}`,
      temp_endDate && `endDate=${temp_endDate.format('YYYY-MM-DDTHH:mm:ss')+'Z'}`,
      polygon && `polygon=${polygon}`,
      box && `box=${encodeURIComponent(box)}`,
      center && `center=${encodeURIComponent(center)}`,
      radius && `radius=${encodeURIComponent(radius)}`,
      metadata && `metadata=${encodeURIComponent(metadata)}`,
      platformId && `platform=${encodeURIComponent(platformId)}`,
      platformType && `platform_type=${encodeURIComponent(platformType)}`,
      positionQC && `positionqc=${positionQC}`,
      profileSource && `source=${profileSource}`,
      compression && `compression=${encodeURIComponent(compression)}`,
      mostRecent && `mostrecent=${encodeURIComponent(mostRecent)}`,
      data && `data=${data}`,
      pressureRange && `presRange=${pressureRange}`,
      batchMetadata && `batchmeta=${encodeURIComponent(batchMetadata)}`,
    ].filter(Boolean); // Remove any undefined values

    // Join the parameters with '&' to form the query string
    const queryString = params.join('&');

    const url = `https://argovis-api.colorado.edu/argo?${queryString}`;

    return (
    <div>
        <form>
            <div>
                <h2>Temporospatial Filters</h2>
                <div id='time_filters' className={datesValid ? '' : 'invalid'}>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="startDate-tooltip" className="wide-tooltip">
                                    The earliest timestamp to search for, GMT+0, boundary-inclusive.
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
                            onChange={date => this.handleDateChange('startDate', date)}
                            onBlur={() => this.handleDateBlur('startDate')}
                        />
                    </label>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="endDate-tooltip" className="wide-tooltip">
                                    The latest timestamp to search for, GMT+0, boundary-exclusive.
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
                            onChange={date => this.handleDateChange('endDate', date)}
                            onBlur={() => this.handleDateBlur('endDate')}
                        />
                    </label>
                    {!datesValid && <p className="validation-message">Invalid dates. Start date must be before end date, if both are defined.</p>}
                </div>
                <div id='space_filters' className={locationValid ? 'row' : 'row invalid'}>
                    <div class='col-4'>
                        <label class="form-label">
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
                    <div class='col-4'>
                        <label class="form-label">
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
                    <div class='col-4'>
                        <label class="form-label">
                            <OverlayTrigger
                                placement="right"
                                overlay={
                                    <Tooltip id="center-tooltip" className="wide-tooltip">
                                        Use with radius to search for profiles near this centerpoint, written as [longitude,latitude].
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
                        <label class="form-label">
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
                        {!centerValid && !centerTouched && <p className="validation-message">Invalid center. A valid center is descrbed by a longitude, latitude pair, for example: [0,0].</p>}
                        {!radiusValid && !radiusTouched && <p className="validation-message">Invalid radius. A valid radius is descrbed by a single number, in kilometers.</p>}
                    </div>
                    {!locationValid && <span className="validation-message">Invalid location. Please only specify one of polygon, box, or center plus radius.</span>}
                </div>
            </div>
            <div>
                <h2>Data Filters</h2>
                <div>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="data-tooltip" className="wide-tooltip">
                                    List the data variables you want to search for, for example temperature,doxy; you will get back only profiles that have these measurements, and only these measurements plus pressure. <br/>You can also enforce QC requirements: temperature,1 will return only levels that have temperature QC of 1, for example. <br/>Furthermore, you can also negate variables: temperature,~doxy will return the temperature measurements from profiles that do not include a doxy measurement. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=data' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=data</a> for a list of Argo data variables. <br/>Finally, you can use 'all' to get every measurement avaialble in the profile, or 'except-data-values' to perform the same filtering, but then suppress the actual data values (typically for mapping applications).
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
                <div>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="presrange-tooltip" className="wide-tooltip">
                                    List the pressure range you want to search for, for example 0,10; you'll only download levels in this pressure range in the profiles matching the rest of your search. <br/>Note that the pressure range is in dbar below the surface, so 0,10 would filter for levels at the surface down to 10 dbar.
                                </Tooltip>
                            }
                            trigger="click"
                        >
                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                        </OverlayTrigger>
                        Pressure Range:
                        <input
                            type="text"
                            name="pressureRange"
                            value={this.state.pressureRange}
                            onChange={this.handlePressureRangeChange}
                            onBlur={this.handleGenericBlur.bind(this, 'pressureRangeTouched')}
                            onFocus={this.handleGenericFocus.bind(this, 'pressureRangeTouched')}
                            className={pressureRangeValid ? 'form-control' : 'form-control invalid'}
                        />
                    </label>
                    {!pressureRangeValid && !pressureRangeTouched && <p className="validation-message">Invalid pressure range. Should be two comma separated numbers representing dbar below surface; so, 0,10 would filter for levels at the surface down to 10 dbar.</p>}
                </div>
            </div>
            <div>
                <h2>Other Filters</h2>
                <div>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="id-tooltip" className="wide-tooltip">
                                    Use this to specify a single profile by ID.
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
                <div>
                    <label class="form-label">
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
                </div>
                <div>
                    <label class="form-label">
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
                </div>
                <div>
                    <label class="form-label">
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
                <div>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="positionqc-tooltip" className="wide-tooltip">
                                    Use this to filter profiles for any of a list of position QC flags, for example 1,2,8,9. See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=position_qc' target="_blank" rel="noreferrer">https://argovis-api.colorado.edu/argo/vocabulary?parameter=position_qc</a> for a list of position QC flags.
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
                </div>
                <div>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="source-tooltip" className="wide-tooltip">
                                    Use this to filter profiles by their source, any of argo_core, argo_bgc, argo_deep, possibly negated with a ~. For example, argo_core,~argo_deep filters for argo core profiles that are not also argo deep profiles.
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
                <div>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="compression-tooltip" className="wide-tooltip">
                                    Check this box to get back only minimal data for each matching profile, like longitude, latitude, timestamp and profile ID for each. Good for making maps.
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
                <div>
                    <label class="form-label">
                        <OverlayTrigger
                            placement="right"
                            overlay={
                                <Tooltip id="mostrecent-tooltip" className="wide-tooltip">
                                    Use this to get the most recent profiles that match your other filter parameters. For example, setting this to 7 means you'll get the 7 most chronologically recent profiles that match your other filter parameters.
                                </Tooltip>
                            }
                            trigger="click"
                        >
                            <i className="fa fa-question-circle" aria-hidden="true"></i>
                        </OverlayTrigger>
                        Most Recent:
                        <input
                            type="text"
                            value={this.state.mostRecent}
                            onChange={this.handleMostRecentChange}
                            onBlur={this.handleGenericBlur.bind(this, 'mostRecentTouched')}
                            onFocus={this.handleGenericFocus.bind(this, 'mostRecentTouched')}
                            className={mostRecentValid ? 'form-control' : 'form-control invalid'}
                        />
                    </label>
                    {!mostRecentValid && !mostRecentTouched && <p className="validation-message">Invalid most recent value. Most recent should be an integer, corresponding to the maximum number of profiles you want returned. Setting it to 7 means you'll get the 7 most chronologically recent profiles that match your other filter parameters. </p>}
                </div>
                <div>
                    <label class="form-label">
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
                        <input type="text" name="batchMetadata" value={batchMetadata} onChange={this.handleChange} className="form-control"/>
                    </label>
                </div>
            </div>
        </form>
        <a href={url}>{url}</a>
    </div>
    );
  }
}

export default ArgoURLhelper;