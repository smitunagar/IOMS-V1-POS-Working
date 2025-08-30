import React from 'react';
import { Info, Clock, CheckCircle, Users, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Reservation {
  customerName: string;
  time: string;
  partySize: number;
  notes?: string;
}

interface TableCardProps {
  number: string;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  capacity: number;
  reservation?: Reservation;
  waiter?: string;
  occupiedSince?: string;
  lastOrderTime?: string;
  onClick?: () => void;
}

const statusMeta = {
  available: { color: 'bg-green-100 text-green-800', icon: <CheckCircle className="w-4 h-4 mr-1" />, label: 'Available' },
  occupied: { color: 'bg-red-100 text-red-800', icon: <Users className="w-4 h-4 mr-1" />, label: 'Occupied' },
  reserved: { color: 'bg-yellow-100 text-yellow-800', icon: <Clock className="w-4 h-4 mr-1" />, label: 'Reserved' },
  cleaning: { color: 'bg-gray-200 text-gray-700', icon: <XCircle className="w-4 h-4 mr-1" />, label: 'Cleaning' },
};

function getDurationString(since: string) {
  if (!since) return '';
  const start = new Date(since);
  const now = new Date();
  const mins = Math.floor((now.getTime() - start.getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''}`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ${mins % 60}m`;
}

function isRecentOrder(since: string) {
  if (!since) return false;
  const start = new Date(since);
  const now = new Date();
  const diff = now.getTime() - start.getTime();
  return diff < 24 * 60 * 60 * 1000; // 24 hours
}

export default function TableCard({ number, status, capacity, reservation, waiter, occupiedSince, lastOrderTime, onClick }: TableCardProps) {
  // Check if reservation is within the next hour
  let isPreReserved = false;
  let reservationInfo = null;
  if (reservation && reservation.time) {
    const now = new Date();
    const resTime = new Date(reservation.time);
    const diff = resTime.getTime() - now.getTime();
    isPreReserved = diff > 0 && diff <= 60 * 60 * 1000;
    reservationInfo = (
      <div className="text-xs p-2">
        <div><b>Name:</b> {reservation.customerName}</div>
        <div><b>Time:</b> {resTime.toLocaleString()}</div>
        <div><b>Party:</b> {reservation.partySize}</div>
        {reservation.notes && <div><b>Notes:</b> {reservation.notes}</div>}
      </div>
    );
  }

  // Color coding
  const meta = statusMeta[isPreReserved ? 'reserved' : status] || statusMeta['available'];

  return (
    <button
      className={`rounded-xl border border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.08)] flex flex-col items-center justify-center p-3 sm:p-4 lg:p-6 min-h-[120px] sm:min-h-[150px] lg:min-h-[170px] min-w-[100px] sm:min-w-[110px] lg:min-w-[130px] bg-white hover:shadow-lg hover:ring-2 ring-blue-300 transition relative gap-1 sm:gap-2 mb-2 sm:mb-4`}
      onClick={onClick}
      style={{ boxSizing: 'border-box' }}
    >
      {/* Status badge */}
      <span className={`absolute top-1 right-1 sm:top-2 sm:right-2 flex items-center px-2 sm:px-3 py-1 rounded-full text-xs font-semibold shadow-sm border ${
        status === 'available' ? 'bg-green-100 text-green-800 border-green-200' :
        status === 'occupied' ? 'bg-red-100 text-red-800 border-red-200' :
        status === 'reserved' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
        'bg-gray-200 text-gray-700 border-gray-300'
      }`}>
        {meta.icon}
        <span className="hidden sm:inline">{meta.label}</span>
      </span>
      <span className="text-xl sm:text-2xl mt-4 sm:mt-6 mb-1 sm:mb-2">🪑</span>
      <span className="font-bold text-sm sm:text-base lg:text-lg mb-1">Table {number}</span>
      <span className="text-xs mb-1 text-gray-600">{capacity} seats</span>
      {/* Timer if occupied */}
      {status === 'occupied' && occupiedSince && (
        <span className="text-xs text-blue-900 flex items-center gap-1 mt-1 text-center px-2"><Clock className="w-3 h-3" /> <span className="hidden sm:inline">Seated for</span> {getDurationString(occupiedSince)}</span>
      )}
      {/* Last order info */}
      {lastOrderTime && isRecentOrder(lastOrderTime) ? (
        <span className="text-xs text-blue-900 flex items-center gap-1 mt-1 text-center px-2">🍽 <span className="hidden sm:inline">Last Order:</span> {getDurationString(lastOrderTime)} ago</span>
      ) : (
        <span className="text-xs text-gray-400 mt-1 text-center px-2">No recent orders</span>
      )}
      {/* Waiter info */}
      {waiter && (
        <span className="text-xs text-gray-700 flex items-center gap-1 mt-1 text-center px-2">👤 <span className="hidden sm:inline">Waiter:</span> {waiter}</span>
      )}
      {/* Reservation info button */}
      {(isPreReserved || status === 'reserved') && reservation && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="absolute top-1 right-1 sm:top-2 sm:right-2 cursor-pointer text-yellow-700"><Info className="h-3 w-3 sm:h-4 sm:w-4" /></span>
            </TooltipTrigger>
            <TooltipContent>
              {reservationInfo}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </button>
  );
} 