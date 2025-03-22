import React from 'react';
import { getFormattedTimestamp, getBuildInfo } from '../utils/timeUtils';

const TimeStamp: React.FC = () => {
  return (
    <div className="timestamp-container" style={{
      fontSize: '12px',
      color: '#666',
      textAlign: 'center',
      marginTop: '20px',
      padding: '5px',
      borderTop: '1px solid #eee'
    }}>
      <div>{getFormattedTimestamp()}</div>
      <div>Brass & Wind Instrument Explorer {getBuildInfo()}</div>
    </div>
  );
};

export default TimeStamp; 