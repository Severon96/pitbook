import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
}

export default function Card({ children, className, title }: CardProps) {
  return (
    <div className={clsx('bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700', className)}>
      {title && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
      )}
      <div className="px-6 py-4">{children}</div>
    </div>
  );
}
