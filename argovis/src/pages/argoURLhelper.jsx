import React from 'react';
import Datetime from 'react-datetime';
import 'react-datetime/css/react-datetime.css';

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
      datesValid: true, polygonValid: true, boxValid: true, centerValid: true, radiusValid: true, profileSourceValid: true, mostRecentValid: true, dataValid: true, pressureRangeValid: true,
      polygonTouched: false,
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
    if(polygon.length == 0) return true;

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
    if(box.length == 0) return true;

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
    if(pair.length == 0) return true;

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
    if(value.length == 0) return true;

    const tokens = value.split(',').map(token => token.trim());
    const validTokens = ['argo_core', 'argo_bgc', 'argo_deep'];
    
    return tokens.every(token => {
      const isNegated = token.startsWith('~');
      const actualToken = isNegated ? token.slice(1) : token;
      return validTokens.includes(actualToken);
    });
  }

  isValidMostRecent = (value) => {
    if(value.length == 0) return true;
    const intValue = parseInt(value, 10);
    return !isNaN(value) && Number(value) === intValue && intValue > 0;
  }

  isValidData = (value) => {
    if(value.length == 0) return true;

    const pattern = "^((~)?((bbp470)|(bbp532)|(bbp700)|(bbp700_2)|(bisulfide)|(cdom)|(chla)|(cndc)|(cndx)|(cp660)|(down_irradiance380)|(down_irradiance412)|(down_irradiance442)|(down_irradiance443)|(down_irradiance490)|(down_irradiance555)|(down_irradiance670)|(downwelling_par)|(doxy)|(doxy2)|(doxy3)|(molar_doxy)|(nitrate)|(ph_in_situ_total)|(pressure)|(salinity)|(salinity_sfile)|(temperature)|(temperature_sfile)|(turbidity)|(up_radiance412)|(up_radiance443)|(up_radiance490)|(up_radiance555){1})((_std)|(_med){1})?(_argoqc)?|all|except-data-values|[0-9]+)$";
    const regex = new RegExp(pattern);
    const tokens = value.split(',').map(token => token.trim());
    
    return tokens.every(token => regex.test(token));
  }

  isValidPressureRange = (value) => {
    if(value.length == 0) return true;

    const tokens = value.split(',').map(token => parseFloat(token.trim()));
    
    if (tokens.length !== 2) return false;
    
    const [first, second] = tokens;
    
    return !isNaN(first) && !isNaN(second) && first >= 0 && second >= 0 && second > first;
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
    this.setState({
      positionQC: event.target.value,
    });
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
    this.setState({
      compression: event.target.value === 'none' ? null : 'minimal',
    });
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
      datesValid, polygonValid, boxValid, centerValid, radiusValid, profileSourceValid, mostRecentValid, dataValid, pressureRangeValid,
      polygonTouched,
    } = this.state;

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
      positionQC && `positionqc=${encodeURIComponent(positionQC)}`,
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
                <label>
                    Profile ID:
                    <input type="text" name="profileId" value={profileId} onChange={this.handleChange} />
                </label>
            </div>
            <div className={datesValid ? '' : 'invalid'}>
                <label>
                    Start Date:
                    <Datetime
                        dateFormat="YYYY-MM-DD"
                        timeFormat="HH:mm:ss"
                        value={this.state.temp_startDate}
                        onChange={date => this.handleDateChange('startDate', date)}
                        onBlur={() => this.handleDateBlur('startDate')}
                    />
                </label>
                <label>
                    End Date:
                    <Datetime
                        dateFormat="YYYY-MM-DD"
                        timeFormat="HH:mm:ss"
                        value={this.state.temp_endDate}
                        onChange={date => this.handleDateChange('endDate', date)}
                        onBlur={() => this.handleDateBlur('endDate')}
                    />
                </label>
                {!datesValid && <span className="validation-message">Invalid dates. Start date must be before end date, if both are defined.</span>}
            </div>
            <div>
                <label>
                    Polygon:
                    <input
                        type="text"
                        value={this.state.polygon}
                        onChange={this.handlePolygonChange}
                        onBlur={this.handleGenericBlur.bind(this, 'polygonTouched')}
                        onFocus={this.handleGenericFocus.bind(this, 'polygonTouched')}
                        className={polygonValid ? '' : 'invalid'}
                    />
                    {!polygonValid && !polygonTouched && <span className="validation-message">Invalid polygon. A valid polygon is an array of longitude, longitude pairs, for example: [[0,0],[0,1],[1,1],[1,0],[0,0]]. Notice the first and last vertexes match, per the geoJSON spec.</span>}
                </label>
            </div>
            <div>
                <label>
                    Box:
                    <input
                        type="text"
                        value={this.state.box}
                        onChange={this.handleBoxChange}
                        className={boxValid ? '' : 'invalid'}
                    />
                    {!boxValid && <span className="validation-message">Invalid box. A valid box is descrbed by its southwest corner followed by its northeast corner, set as longitude,latitude, for example: [[0,0],[10,10]].</span>}
                </label>
            </div>
            <div>
                <label>
                    Center:
                    <input
                        type="text"
                        value={this.state.center}
                        onChange={this.handleCenterChange}
                        className={centerValid ? '' : 'invalid'}
                    />
                    {!centerValid && <span className="validation-message">Invalid center. A valid center is descrbed by a longitude, latitude pair, for example: [0,0].</span>}
                </label>
                <label>
                    Radius:
                    <input
                        type="text"
                        value={this.state.radius}
                        onChange={this.handleRadiusChange}
                        className={radiusValid ? '' : 'invalid'}
                    />
                    {!radiusValid && <span className="validation-message">Invalid radius. A valid radius is descrbed by a single number, in kilometers.</span>}
                </label>
            </div>
            <div>
                <label>
                    Metadata:
                    <input type="text" name="metadata" value={metadata} onChange={this.handleChange} />
                </label>
            </div>
            <div>
                <label>
                    Platform ID:
                    <input type="text" name="platformId" value={platformId} onChange={this.handleChange} />
                </label>
            </div>
            <div>
                <label>
                    Platform Type:
                    <input type="text" name="platformType" value={platformType} onChange={this.handleChange} />
                </label>
            </div>
            <div>
                <label>
                    Position QC:
                    <select
                        value={positionQC}
                        onChange={this.handlePositionQCChange}
                    >
                        <option value="">No filter</option>
                        {Array.from({length: 11}, (_, i) => i - 1).map(value => (
                            <option key={value} value={value}>{value}</option>
                        ))}
                    </select>
                </label>
            </div>
            <div>
                <label>
                    Profile Source:
                    <input
                        type="text"
                        name="profileSource"
                        value={this.state.profileSource}
                        onChange={this.handleProfileSourceChange}
                        className={profileSourceValid ? '' : 'invalid'}
                    />
                    {!profileSourceValid && <span className="validation-message">Invalid profile source. A valid profile source is a list of the tokens argo_core, argo_bgc, and / or argo_deep, each possibly negated with a ~. For example, argo_core,~argo_deep filters for argo core profiles that are not also argo deep profiles.</span>}
                </label>
            </div>
            <div>
                <label>
                    Compression:
                    <div>
                        <label>
                            <input
                                type="radio"
                                value="none"
                                checked={compression === null}
                                onChange={this.handleCompressionChange}
                            />
                            None
                        </label>
                        <label>
                            <input
                                type="radio"
                                value="minimal"
                                checked={compression === 'minimal'}
                                onChange={this.handleCompressionChange}
                            />
                            Minimal
                        </label>
                    </div>
                </label>
            </div>
            <div>
                <label>
                    Most Recent:
                    <input
                        type="text"
                        value={this.state.mostRecent}
                        onChange={this.handleMostRecentChange}
                        className={mostRecentValid ? '' : 'invalid'}
                    />
                    {!mostRecentValid && <span className="validation-message">Invalid most recent value. Most recent should be an integer, corresponding to the maximum number of profiles you want returned. Setting it to 7 means you'll get the 7 most chronologically recent profiles that match your other filter parameters. </span>}
                </label>
            </div>
            <div>
                <label>
                    Data:
                    <input
                        type="text"
                        name="data"
                        value={this.state.data}
                        onChange={this.handleDataChange}
                        className={dataValid ? '' : 'invalid'}
                    />
                    {!dataValid && <span className="validation-message">Invalid data string. data should be a comma separated list of the measurements you want profiles for; you may also negate a parameter with ~ to get profiles that do not include this measurement. Furthermore, you can add 'all' to the list to get every measurement avaialble in the profile, or 'except-data-values' to perform the same filtering, but then suppress the actual data values (typically for mapping applications). See <a href='https://argovis-api.colorado.edu/argo/vocabulary?parameter=data' target="_blank" rel="noreferrer">this vocabulary</a> for a list of Argo data variables.</span>}
                </label>
            </div>
            <div>
                <label>
                    Pressure Range:
                    <input
                        type="text"
                        name="pressureRange"
                        value={this.state.pressureRange}
                        onChange={this.handlePressureRangeChange}
                        className={pressureRangeValid ? '' : 'invalid'}
                    />
                    {!pressureRangeValid && <span className="validation-message">Invalid pressure range. Should be two comma separated numbers representing dbar below surface; so, 0,10 would filter for levels at the surface down to 10 dbar.</span>}
                </label>
            </div>
            <div>
                <label>
                    Batch Metadata:
                    <input type="text" name="batchMetadata" value={batchMetadata} onChange={this.handleChange} />
                </label>
            </div>
        </form>
        <a href={url}>{url}</a>
    </div>
    );
  }
}

export default ArgoURLhelper;