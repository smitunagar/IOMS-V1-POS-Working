"use client";

import { MainLayout } from '@/components/layout/MainLayout';

export default function ReceptionistPage() {
  return (
    <MainLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Receptionist Dashboard</h1>
        <p className="text-gray-600">Welcome to the receptionist interface.</p>
        <p className="text-sm text-gray-500 mt-1">by IOMS team</p>
      </div>
    </MainLayout>
  );
} 