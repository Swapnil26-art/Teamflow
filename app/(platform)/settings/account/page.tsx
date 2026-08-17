import React from 'react';
import { Icons } from '@/components/ui/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckoutButton } from './checkout-button';

export default function SettingsAccountPage() {
  return (
    <div className="w-full h-full max-w-4xl mx-auto flex flex-col items-center justify-center space-y-8 py-10">
      <div className="text-center space-y-2">
        <Icons.CreditCard className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold">Upgrade to Premium</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Unlock all task generation, unlimited speech recognition, and advanced analytics.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 w-full mt-8">
        <Card className="border-muted bg-background/50">
          <CardHeader>
            <CardTitle>Free Plan</CardTitle>
            <CardDescription>Your current subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$0<span className="text-sm font-normal text-muted-foreground"> / month</span></div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center"><Icons.Check className="w-4 h-4 mr-2" /> Unlimited tasks</li>
              <li className="flex items-center"><Icons.Check className="w-4 h-4 mr-2" /> Labels and lists</li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" disabled>Current Plan</Button>
          </CardFooter>
        </Card>

        <Card className="border-primary shadow-lg shadow-primary/20 relative">
          <div className="absolute top-0 right-0 p-2">
            <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-semibold">Recommended</span>
          </div>
          <CardHeader>
            <CardTitle>Pro Plan</CardTitle>
            <CardDescription>Unlock everything</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-3xl font-bold">$4.99<span className="text-sm font-normal text-muted-foreground"> / month</span></div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center text-primary"><Icons.Check className="w-4 h-4 mr-2" /> Speech Recognition</li>
              <li className="flex items-center text-primary"><Icons.Check className="w-4 h-4 mr-2" /> AI Generated tasks</li>
              <li className="flex items-center text-primary"><Icons.Check className="w-4 h-4 mr-2" /> Analytics & Recurring</li>
            </ul>
          </CardContent>
          <CardFooter>
            <CheckoutButton />
          </CardFooter>
        </Card>
      </div>
      
      <div className="text-center text-xs text-muted-foreground mt-8">
        * This is a demo purchase flow. Payments are safely mocked via test mode.
      </div>
    </div>
  );
}
