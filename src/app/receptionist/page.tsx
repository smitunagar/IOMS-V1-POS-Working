"use client";

import { AppLayout } from '@/components/layout/AppLayout';

export default function ReceptionistPage() {
  return (
    <AppLayout pageTitle="Receptionist Dashboard">
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Receptionist Dashboard</h1>
        <p className="text-gray-600">Welcome to the receptionist interface.</p>
        <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
      </div>
    </AppLayout>
  );
} 