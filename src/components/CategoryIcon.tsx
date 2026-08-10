import React from 'react';
import * as Icons from 'lucide-react';

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, className = '', size = 20 }) => {
  // @ts-ignore dynamic lookup
  const IconComponent = Icons[name] || Icons.CircleDollarSign;
  return <IconComponent size={size} className={className} />;
};
