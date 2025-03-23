import React from 'react';
import '../styles/theme.css';
import './MusicalStaffWrapper.css';

interface MusicalStaffWrapperProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  className?: string;
}

const MusicalStaffWrapper: React.FC<MusicalStaffWrapperProps> = ({
  children,
  title,
  subtitle,
  className = '',
}) => {
  return (
    <div className={`musical-staff-wrapper ${className}`}>
      {title && <h3 className="musical-staff-title">{title}</h3>}
      {subtitle && <p className="musical-staff-subtitle">{subtitle}</p>}
      
      <div className="musical-staff-container">
        {children}
      </div>
    </div>
  );
};

export default MusicalStaffWrapper; 