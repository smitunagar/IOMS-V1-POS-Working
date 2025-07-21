'use client';

import { useState } from 'react';
import { ArrowLeft, Users, Clock, CheckCircle, XCircle, Plus, Edit, Trash2, Calendar, MapPin } from 'lucide-react';
import Link from 'next/link';

interface Table {
  id: string;
  number: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  currentOrder?: {
    orderId: string;
    items: number;
    total: number;
    startTime: string;
  };
  reservation?: {
    customerName: string;
    time: string;
    partySize: number;
    phone: string;
  };
}

interface Reservation {
  id: string;
  tableNumber: string;
  customerName: string;
  date: string;
  time: string;
  partySize: number;
  phone: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  specialRequests?: string;
}

export default function TableManagement() {
  const [tables, setTables] = useState<Table[]>([
    {
      id: '1',
      number: '1',
      capacity: 4,
      status: 'occupied',
      currentOrder: {
        orderId: 'ORD-001',
        items: 3,
        total: 45.50,
        startTime: '19:30'
      }
    },
    {
      id: '2',
      number: '2',
      capacity: 6,
      status: 'reserved',
      reservation: {
        customerName: 'Maria Schmidt',
        time: '20:00',
        partySize: 5,
        phone: '+49 123 456789'
      }
    },
    {
      id: '3',
      number: '3',
      capacity: 2,
      status: 'available'
    },
    {
      id: '4',
      number: '4',
      capacity: 8,
      status: 'occupied',
      currentOrder: {
        orderId: 'ORD-002',
        items: 6,
        total: 78.90,
        startTime: '18:45'
      }
    },
    {
      id: '5',
      number: '5',
      capacity: 4,
      status: 'cleaning'
    },
    {
      id: '6',
      number: '6',
      capacity: 6,
      status: 'available'
    }
  ]);

  const [reservations, setReservations] = useState<Reservation[]>([
    {
      id: '1',
      tableNumber: '2',
      customerName: 'Maria Schmidt',
      date: '2024-01-15',
      time: '20:00',
      partySize: 5,
      phone: '+49 123 456789',
      status: 'confirmed',
      specialRequests: 'Window seat preferred'
    },
    {
      id: '2',
      tableNumber: '3',
      customerName: 'Hans Mueller',
      date: '2024-01-15',
      time: '19:30',
      partySize: 2,
      phone: '+49 987 654321',
      status: 'pending'
    }
  ]);

  const [activeTab, setActiveTab] = useState<'tables' | 'reservations'>('tables');
  const [showAddReservation, setShowAddReservation] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'occupied': return 'bg-red-100 text-red-800';
      case 'reserved': return 'bg-blue-100 text-blue-800';
      case 'cleaning': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'available': return <CheckCircle className="w-4 h-4" />;
      case 'occupied': return <Users className="w-4 h-4" />;
      case 'reserved': return <Clock className="w-4 h-4" />;
      case 'cleaning': return <XCircle className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const addReservation = (reservation: Omit<Reservation, 'id'>) => {
    const newReservation: Reservation = {
      ...reservation,
      id: Date.now().toString()
    };
    setReservations([...reservations, newReservation]);
    setShowAddReservation(false);
  };

  const updateTableStatus = (tableId: string, status: Table['status']) => {
    setTables(tables.map(table => 
      table.id === tableId ? { ...table, status } : table
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link 
                href="/ioms-dashboard" 
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Dashboard</span>
              </Link>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Table Management</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {tables.filter(t => t.status === 'occupied').length} tables occupied
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('tables')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'tables'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tables
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'reservations'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Reservations
            </button>
          </div>
        </div>

        {activeTab === 'tables' && (
          <div className="space-y-6">
            {/* Table Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tables.map(table => (
                <div key={table.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Table {table.number}</h3>
                      <p className="text-sm text-gray-600">{table.capacity} seats</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(table.status)}`}>
                      {getStatusIcon(table.status)}
                      {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                    </div>
                  </div>

                  {table.currentOrder && (
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Current Order</h4>
                      <div className="space-y-1 text-sm text-blue-800">
                        <p><span className="font-medium">Order ID:</span> {table.currentOrder.orderId}</p>
                        <p><span className="font-medium">Items:</span> {table.currentOrder.items}</p>
                        <p><span className="font-medium">Total:</span> €{table.currentOrder.total.toFixed(2)}</p>
                        <p><span className="font-medium">Started:</span> {table.currentOrder.startTime}</p>
                      </div>
                    </div>
                  )}

                  {table.reservation && (
                    <div className="mb-4 p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">Reservation</h4>
                      <div className="space-y-1 text-sm text-green-800">
                        <p><span className="font-medium">Customer:</span> {table.reservation.customerName}</p>
                        <p><span className="font-medium">Time:</span> {table.reservation.time}</p>
                        <p><span className="font-medium">Party:</span> {table.reservation.partySize}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <button
                      onClick={() => updateTableStatus(table.id, 'available')}
                      className="flex-1 py-2 px-3 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                    >
                      Available
                    </button>
                    <button
                      onClick={() => updateTableStatus(table.id, 'occupied')}
                      className="flex-1 py-2 px-3 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                    >
                      Occupied
                    </button>
                    <button
                      onClick={() => updateTableStatus(table.id, 'cleaning')}
                      className="flex-1 py-2 px-3 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 transition-colors"
                    >
                      Cleaning
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Available</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tables.filter(t => t.status === 'available').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Occupied</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tables.filter(t => t.status === 'occupied').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Reserved</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tables.filter(t => t.status === 'reserved').length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-600">Cleaning</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {tables.filter(t => t.status === 'cleaning').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reservations' && (
          <div className="space-y-6">
            {/* Reservations Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Reservations</h2>
              <button
                onClick={() => setShowAddReservation(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Add Reservation</span>
              </button>
            </div>

            {/* Reservations List */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Table
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Party Size
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reservations.map(reservation => (
                      <tr key={reservation.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {reservation.customerName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {reservation.phone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          Table {reservation.tableNumber}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {new Date(reservation.date).toLocaleDateString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            {reservation.time}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {reservation.partySize} people
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            reservation.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                            reservation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {reservation.status.charAt(0).toUpperCase() + reservation.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-blue-600 hover:text-blue-900">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-red-600 hover:text-red-900">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Reservation Modal */}
      {showAddReservation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Reservation</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              addReservation({
                tableNumber: formData.get('tableNumber') as string,
                customerName: formData.get('customerName') as string,
                date: formData.get('date') as string,
                time: formData.get('time') as string,
                partySize: parseInt(formData.get('partySize') as string),
                phone: formData.get('phone') as string,
                status: 'confirmed'
              });
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Table Number
                  </label>
                  <select name="tableNumber" className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {tables.map(table => (
                      <option key={table.id} value={table.number}>
                        Table {table.number} ({table.capacity} seats)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      name="date"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Party Size
                    </label>
                    <input
                      type="number"
                      name="partySize"
                      min="1"
                      max="20"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Add Reservation
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddReservation(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 