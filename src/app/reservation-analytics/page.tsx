'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { AppLayout } from '@/components/layout/AppLayout';
import { BarChart3 } from 'lucide-react';

export default function ReservationAnalyticsPage() {
  return (
    <AppLayout pageTitle="Reservation Analytics">
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl font-bold">
              <BarChart3 className="h-6 w-6" />
              Reservation Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground mb-6">
              Visualize reservation trends, occupancy, and key metrics for your restaurant.
            </div>
            {/* Placeholder for future charts/metrics */}
            <div className="flex flex-col items-center justify-center py-16">
              <BarChart3 className="h-12 w-12 text-blue-400 mb-4" />
              <div className="font-semibold text-lg mb-2">No analytics data yet</div>
              <div className="text-sm text-muted-foreground">Reservation analytics will appear here once you have data.</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
} 