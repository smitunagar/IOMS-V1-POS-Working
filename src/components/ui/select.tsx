import * as React from 'react';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  children: React.ReactNode;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ children, ...props }, ref) => (
    <select ref={ref} {...props} className={props.className}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

export const SelectTrigger: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue: React.FC<{ value?: string }> = ({ value }) => <span>{value}</span>;
SelectValue.displayName = 'SelectValue';

export const SelectContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, ...props }) => (
  <div {...props}>{children}</div>
);
SelectContent.displayName = 'SelectContent';

export const SelectItem: React.FC<React.OptionHTMLAttributes<HTMLOptionElement>> = ({ children, ...props }) => (
  <option {...props}>{children}</option>
);
SelectItem.displayName = 'SelectItem'; 