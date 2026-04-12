'use client'
import { ButtonHTMLAttributes, AnchorHTMLAttributes, forwardRef, MouseEventHandler } from 'react';
import Link from 'next/link';
import { UrlObject } from 'url';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'link' | 'custom' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';
type ButtonType = 'button' | 'submit' | 'reset' | undefined;

export interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  className?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>, ButtonBaseProps {
  as?: 'button';
  type?: ButtonType;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  href?: never;
}

interface LinkButtonProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonBaseProps | 'href'>, ButtonBaseProps {
  as: 'link';
  href: string | UrlObject;
  target?: string;
  rel?: string;
  type?: never;
  onClick?: MouseEventHandler<HTMLAnchorElement>;
}

type ButtonComponentProps = ButtonProps | LinkButtonProps;

const                                                                                                   Button = forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonComponentProps>(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  onClick,
  type = 'button',
  disabled = false,
  className = '',
  as = 'button',
  ...props
}, ref) => {
  const baseClasses = 'font-medium transition-colors duration-200 focus:outline-none inline-flex items-center justify-center';
  
  const variants = {
    primary: 'bg-[#000054] text-white hover:bg-[#E32845]',
    secondary: 'bg-[#E32845] text-white hover:bg-[#E32845]',
    outline: 'bg-transparent text-[#000054] hover:bg-gray-50 border border-[#000054]',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    custom: 'bg-white text-[#000054] hover:bg-gray-50 border border-[#000054]',
    link: 'bg-transparent text-[#000054] hover:underline p-0 inline-flex items-center justify-start'
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  const commonProps = {
    className: `${classes} ${fullWidth ? 'w-full' : ''} ${className}`.trim(),
    'aria-disabled': disabled,
    ref: ref as React.Ref<never>,
    ...(disabled && { 'aria-busy': true }),
  };

  if (as === 'link') {
    const { href, ...rest } = props as LinkButtonProps;
    return (
      <Link
        href={href}
        className={commonProps.className}
        aria-disabled={commonProps['aria-disabled']}
        aria-busy={commonProps['aria-busy']}
        {...rest}
        ref={ref as React.ForwardedRef<HTMLAnchorElement>}
      >
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick as MouseEventHandler<HTMLButtonElement>}
      {...commonProps}
      {...props as ButtonHTMLAttributes<HTMLButtonElement>}
      ref={ref as React.ForwardedRef<HTMLButtonElement>}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

export default Button;