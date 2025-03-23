import React from 'react';
import '../../styles/theme.css';
import './PanelWrapper.css';

interface PanelWrapperProps {
  children: React.ReactNode;
  className?: string;
  withBackground?: boolean;
}

const PanelWrapper: React.FC<PanelWrapperProps> = ({
  children,
  className = '',
  withBackground = true,
}) => {
  return (
    <div className={`panel-wrapper ${withBackground ? 'with-background' : ''} ${className}`}>
      <div className="panel-content">
        {children}
      </div>
    </div>
  );
};

export default PanelWrapper; 