
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface BillingHistoryTabProps {
  isFreeTier: boolean;
  subscriptionTier: 'free' | 'limited' | 'unlimited';
}

const BillingHistoryTab: React.FC<BillingHistoryTabProps> = ({ isFreeTier, subscriptionTier }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Information</CardTitle>
        <CardDescription>
          Manage your payment methods and view billing history
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Payment Methods</h3>
            {isFreeTier ? (
              <p className="text-muted-foreground">No payment methods available. Upgrade to a paid plan to add a payment method.</p>
            ) : (
              <div className="border rounded-md p-4 flex items-center justify-between">
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-3" />
                  <div>
                    <p className="font-medium">Card ending in •••• 1234</p>
                    <p className="text-sm text-muted-foreground">Expires 09/2025</p>
                  </div>
                </div>
                <div>
                  <Button variant="ghost" size="sm">Update</Button>
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="text-lg font-medium mb-4">Billing History</h3>
            {isFreeTier ? (
              <p className="text-muted-foreground">No billing history available.</p>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Amount</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="bg-background divide-y divide-border">
                    <tr>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">May 1, 2025</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{subscriptionTier === 'limited' ? 'Limited' : 'Unlimited'} Plan Subscription</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">${subscriptionTier === 'limited' ? '20.00' : '99.00'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <Button variant="link" size="sm">View</Button>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">April 1, 2025</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">{subscriptionTier === 'limited' ? 'Limited' : 'Unlimited'} Plan Subscription</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm">${subscriptionTier === 'limited' ? '20.00' : '99.00'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-right">
                        <Button variant="link" size="sm">View</Button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingHistoryTab;
