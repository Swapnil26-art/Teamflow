import React from 'react';
import { Icons } from '@/components/ui/icons';

export default function AnalyticsPage() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
      <Icons.LineChart className="w-16 h-16 text-muted-foreground opacity-50" />
      <h1 className="text-2xl font-bold">Analytics</h1>
      <p className="text-muted-foreground max-w-md text-center">
        This feature is under construction. Future updates will bring you detailed insights into your task management efficiency.
      </p>
    </div>
  );
}
