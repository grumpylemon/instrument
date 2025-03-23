import * as React from 'react';
import '../../styles/theme.css';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
  withBlur?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = true,
  withBlur = true
}) => {
  return (
    <div
      className={`
        card
        ${hoverable ? 'card-hoverable' : ''}
        ${withBlur ? 'card-with-blur' : ''}
        ${className}
      `.trim()}
      onClick={onClick}
      style={{
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {children}
    </div>
  );
};

export default Card; 