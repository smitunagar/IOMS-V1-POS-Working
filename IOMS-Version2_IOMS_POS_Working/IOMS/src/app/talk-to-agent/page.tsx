'use client';

import React from 'react';
import { AppLayout } from "@/components/layout/AppLayout";
import { TalkToAgent } from "@/components/TalkToAgent";

export default function TalkToAgentPage() {
  return (
    <AppLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Talk to Our AI Agent
          </h1>
          <p className="text-lg text-gray-600">
            Get instant help with orders, reservations, and restaurant information
          </p>
        </div>
        
        <TalkToAgent />
      </div>
    </AppLayout>
  );
}
