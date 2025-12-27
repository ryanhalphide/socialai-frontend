import { forwardRef, type ImgHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn, getInitials } from '../../lib/utils';

const avatarVariants = cva(
  'inline-flex items-center justify-center rounded-full bg-gray-200 font-medium text-gray-600',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-xs',
        md: 'h-10 w-10 text-sm',
        lg: 'h-12 w-12 text-base',
        xl: 'h-16 w-16 text-lg',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface AvatarProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'size'>,
    VariantProps<typeof avatarVariants> {
  name?: string;
}

const Avatar = forwardRef<HTMLImageElement, AvatarProps>(
  ({ className, size, src, alt, name, ...props }, ref) => {
    if (src) {
      return (
        <img
          ref={ref}
          src={src}
          alt={alt || name || 'Avatar'}
          className={cn(avatarVariants({ size }), 'object-cover', className)}
          {...props}
        />
      );
    }

    return (
      <span className={cn(avatarVariants({ size }), className)}>
        {name ? getInitials(name) : '?'}
      </span>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar, avatarVariants };
