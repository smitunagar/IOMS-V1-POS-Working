import * as React from 'react';

export const Separator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={`border-b border-gray-200 dark:border-gray-700 ${className || ''}`}
      {...props}
    />
  )
);
Separator.displayName = 'Separator'; 