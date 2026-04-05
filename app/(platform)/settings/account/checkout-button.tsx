'use client';

import * as React from 'react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

export function CheckoutButton() {
  const [isLoading, setIsLoading] = React.useState(false);

  const onClick = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorText = await response.text();
        toast.error(errorText || 'Failed to initialize checkout');
        return;
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button className="w-full" onClick={onClick} disabled={isLoading}>
      {isLoading ? <Icons.Spinner className="w-4 h-4 mr-2 animate-spin" /> : null}
      Upgrade to Pro
    </Button>
  );
}
