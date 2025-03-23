import * as React from 'react';
import '../../styles/theme.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  emoji?: string;
  isActive?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  emoji,
  isActive = false,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`
        ${variant} 
        ${size} 
        ${isActive ? 'active' : ''} 
        ${className}
      `.trim()}
      {...props}
    >
      {emoji && <span className="button-emoji">{emoji}</span>}
      {children}
    </button>
  );
};

export default Button; 