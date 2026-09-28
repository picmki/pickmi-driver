const fs = require('fs');
const path = require('path');

const adminComp = '/Users/karthikp/Desktop/V.2 _ Admin/src/components';
const adminSrc = '/Users/karthikp/Desktop/V.2 _ Admin/src';

// ── 1. TripsManager.tsx ─────────────────────────────────────────────────────
const tripsManagerTsx = `import React, { useState } from 'react';
import {
  MapPin,
  PlusCircle,
  Search,
  Filter,
  UserCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Car,
  Phone,
  Shield,
  Send,
  Sliders,
  IndianRupee,
  Navigation
} from 'lucide-react';
import type { Driver, Trip, TripStatus } from '../types';

interface TripsManagerProps {
  trips: Trip[];
  drivers: Driver[];
  onOpenCreateModal: () => void;
  onUpdateTripStatus: (tripId: string, status: TripStatus, driverId?: string) => Promise<void>;
  onAssignDriver: (tripId: string, driverId: string) => Promise<void>;
}

export const TripsManager: React.FC<TripsManagerProps> = ({
  trips,
  drivers,
  onOpenCreateModal,
  onUpdateTripStatus,
  onAssignDriver,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | TripStatus>('ALL');
  const [selectedTripForAssign, setSelectedTripForAssign] = useState<Trip | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const onlineDrivers = drivers.filter((d) => d.online_status === 'ONLINE');

  const filteredTrips = trips.filter((t) => {
    const matchesFilter = selectedFilter === 'ALL' ? true : t.status === selectedFilter;
    const matchesSearch =
      t.trip_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.customer_phone.includes(searchTerm) ||
      t.pickup_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.drop_location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleConfirmAssign = async () => {
    if (!selectedTripForAssign || !selectedDriverId) return;
    setIsProcessing(true);
    try {
      await onAssignDriver(selectedTripForAssign.id, selectedDriverId);
      setSelectedTripForAssign(null);
      setSelectedDriverId('');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: TripStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return 'bg-blue-50 text-[#0043DC] border-blue-200';
      case 'ASSIGNED':
      case 'ACCEPTED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ON_THE_WAY':
      case 'ARRIVED':
      case 'STARTED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'COMPLETED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CANCELLED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Trips & Fleet Dispatch Center</h2>
          <p className="text-xs text-slate-500">
            Realtime database stream: Dispatch rides to online drivers and track live journey status
          </p>
        </div>

        <button
          onClick={onOpenCreateModal}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#0043DC] hover:bg-[#0036b3] text-white font-bold text-xs transition shadow-md shadow-[#0043DC]/20 self-start sm:self-auto active:scale-95"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Dispatch New Trip</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        {/* Status Badges */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 lg:pb-0">
          {(['ALL', 'AVAILABLE', 'ASSIGNED', 'ARRIVED', 'STARTED', 'COMPLETED', 'CANCELLED'] as const).map(
            (status) => {
              const count = status === 'ALL' ? trips.length : trips.filter((t) => t.status === status).length;
              const isActive = selectedFilter === status;
              return (
                <button
                  key={status}
                  onClick={() => setSelectedFilter(status)}
                  className={\`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all \${
                    isActive
                      ? 'bg-[#0043DC] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }\`}
                >
                  {status} ({count})
                </button>
              );
            }
          )}
        </div>

        {/* Search */}
        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by trip #, customer, route..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0043DC]"
          />
        </div>
      </div>

      {/* Trips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filteredTrips.map((trip) => {
          return (
            <div
              key={trip.id}
              className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 hover:border-[#0043DC]/40 hover:shadow-md transition shadow-sm flex flex-col justify-between"
            >
              <div className="space-y-3.5">
                {/* Top Row: Trip Number & Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-sm font-black text-slate-900">{trip.trip_number}</span>
                    <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-600">
                      {trip.vehicle_type}
                    </span>
                  </div>
                  <span className={\`text-[11px] font-bold px-2.5 py-0.5 rounded-full border \${getStatusBadge(trip.status)}\`}>
                    {trip.status}
                  </span>
                </div>

                {/* Fare & Cash to Collect Banner */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Total Trip Fare</div>
                    <div className="text-xl font-black text-slate-900">₹{trip.fare}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-emerald-700">Driver Cash to Collect</div>
                    <div className="text-lg font-black text-emerald-600">
                      ₹{trip.cash_to_collect || trip.fare}
                    </div>
                  </div>
                </div>

                {/* Specific Breakdown Badges (User Audio Requirement) */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className={\`text-[10px] px-2 py-0.5 rounded-md font-bold border \${
                    trip.toll_included === 'INCLUDED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }\`}>
                    Toll: {trip.toll_included || 'INCLUDED'}
                  </span>

                  <span className={\`text-[10px] px-2 py-0.5 rounded-md font-bold border \${
                    trip.permit_included === 'INCLUDED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }\`}>
                    Permit: {trip.permit_included || 'EXCLUDED'}
                  </span>

                  <span className={\`text-[10px] px-2 py-0.5 rounded-md font-bold border \${
                    trip.batta_included === 'INCLUDED'
                      ? 'bg-blue-50 text-[#0043DC] border-blue-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }\`}>
                    Batta: {trip.batta_included || 'INCLUDED'}
                  </span>

                  {trip.hill_charges_applicable === 'APPLICABLE' && (
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      ⛰️ Hill Route
                    </span>
                  )}
                </div>

                {/* Distance & Extra Km Rule */}
                <div className="text-[11px] text-slate-500 font-medium flex items-center justify-between border-t border-slate-100 pt-2">
                  <span>Est: <strong>{trip.distance}</strong></span>
                  <span>Limit: <strong>{trip.allowed_km || 50} km</strong></span>
                  <span className="text-[#0043DC] font-bold">Extra: ₹{trip.extra_km_rate || 14}/km</span>
                </div>

                {/* Route */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                    <span className="text-slate-700 font-medium line-clamp-1">{trip.pickup_location}</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                    <span className="text-slate-700 font-medium line-clamp-1">{trip.drop_location}</span>
                  </div>
                </div>

                {/* Customer Info */}
                <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="font-semibold text-slate-900">{trip.customer_name}</span>
                  <span className="text-slate-500 font-mono">{trip.customer_phone}</span>
                </div>

                {/* Driver Info */}
                <div className="text-xs">
                  {trip.assigned_driver_id ? (
                    <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
                      <UserCheck className="w-4 h-4 flex-shrink-0" />
                      <span className="font-bold truncate">
                        Assigned: {trip.driver?.name || 'Driver ' + trip.assigned_driver_id.substring(0, 8)}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2 text-[#0043DC] bg-blue-50 p-2 rounded-xl border border-blue-200">
                      <Send className="w-4 h-4 flex-shrink-0" />
                      <span className="font-bold">Broadcast to All Online Drivers</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {!trip.assigned_driver_id && trip.status === 'AVAILABLE' && (
                  <button
                    onClick={() => {
                      setSelectedTripForAssign(trip);
                      setSelectedDriverId('');
                    }}
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-[#0043DC] hover:text-white text-slate-700 font-bold text-xs transition border border-slate-200 hover:border-transparent text-center"
                  >
                    Assign Driver
                  </button>
                )}

                {trip.status !== 'COMPLETED' && trip.status !== 'CANCELLED' && (
                  <button
                    onClick={() => onUpdateTripStatus(trip.id, 'CANCELLED')}
                    className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition border border-rose-200"
                  >
                    Cancel
                  </button>
                )}

                {trip.status === 'STARTED' && (
                  <button
                    onClick={() => onUpdateTripStatus(trip.id, 'COMPLETED')}
                    className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm text-center"
                  >
                    Mark Completed
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Driver Assignment Modal */}
      {selectedTripForAssign && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="text-base font-bold text-slate-900">
              Assign Driver to Trip {selectedTripForAssign.trip_number}
            </h3>
            <p className="text-xs text-slate-500">
              Select an active driver to assign this trip directly.
            </p>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                Select Online Driver
              </label>
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-900 font-medium focus:ring-2 focus:ring-[#0043DC]"
              >
                <option value="">-- Choose a Driver --</option>
                {onlineDrivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.mobile}) • Online
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setSelectedTripForAssign(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                disabled={!selectedDriverId || isProcessing}
                onClick={handleConfirmAssign}
                className="px-4 py-2 rounded-xl bg-[#0043DC] hover:bg-[#0036b3] text-white text-xs font-bold transition disabled:opacity-50"
              >
                {isProcessing ? 'Assigning...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
`;

fs.writeFileSync(path.join(adminComp, 'TripsManager.tsx'), tripsManagerTsx, 'utf8');
console.log('✅ Updated TripsManager.tsx (White & PickMi Blue Theme)');

// ── 2. DashboardOverview.tsx ─────────────────────────────────────────────────
const dashboardTsx = `import React from 'react';
import {
  Users,
  MapPin,
  FileCheck2,
  ShieldCheck,
  TrendingUp,
  Car,
  AlertCircle,
  PlusCircle,
  Clock,
  ArrowRight,
  Send,
  Navigation
} from 'lucide-react';
import type { Driver, DriverDocument, Trip, NavTab } from '../types';

interface DashboardOverviewProps {
  drivers: Driver[];
  trips: Trip[];
  documents: DriverDocument[];
  onOpenCreateTrip: () => void;
  onNavigateTab: (tab: NavTab) => void;
  onQuickDispatch: (preset: string) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  drivers,
  trips,
  documents,
  onOpenCreateTrip,
  onNavigateTab,
  onQuickDispatch,
}) => {
  const onlineDrivers = drivers.filter((d) => d.online_status === 'ONLINE');
  const activeTrips = trips.filter((t) => t.status === 'ASSIGNED' || t.status === 'STARTED' || t.status === 'ARRIVED');
  const pendingDocs = documents.filter((d) => d.verification_status === 'Pending');
  const paidDeposits = drivers.filter((d) => d.deposit_status === 'PAID');
  const todayTrips = trips.filter((t) => t.pickup_date === 'Today');

  const stats = [
    {
      title: 'Online Drivers',
      value: onlineDrivers.length,
      subtitle: \`\${drivers.length} registered fleet\`,
      icon: Users,
      color: 'text-[#0043DC]',
      bg: 'bg-blue-50 border-blue-100',
      actionTab: 'drivers' as NavTab,
    },
    {
      title: 'Active Trips',
      value: activeTrips.length,
      subtitle: \`\${trips.length} total bookings\`,
      icon: Navigation,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50 border-indigo-100',
      actionTab: 'trips' as NavTab,
    },
    {
      title: 'Pending Verifications',
      value: pendingDocs.length,
      subtitle: 'DL, RC & insurance reviews',
      icon: FileCheck2,
      color: 'text-amber-600',
      bg: 'bg-amber-50 border-amber-100',
      actionTab: 'documents' as NavTab,
    },
    {
      title: 'Security Deposits',
      value: paidDeposits.length,
      subtitle: '₹250/yr paid accounts',
      icon: ShieldCheck,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50 border-emerald-100',
      actionTab: 'deposits' as NavTab,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0043DC] to-[#1E6BFF] rounded-2xl p-6 text-white shadow-lg shadow-[#0043DC]/15 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-white/20 rounded-md">Live Command</span>
            <span className="text-xs text-blue-100">Supabase Connected Fleet Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">PickMi Fleet Control Center</h1>
          <p className="text-xs text-blue-100 max-w-xl">
            Realtime operations hub for automated dispatching, driver compliance, document approval and safety.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenCreateTrip}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-white text-[#0043DC] font-black text-xs transition shadow-md hover:bg-blue-50 active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create & Dispatch Trip</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigateTab(s.actionTab)}
              className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-[#0043DC]/40 hover:shadow-md transition cursor-pointer shadow-sm group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{s.title}</span>
                <div className={\`w-9 h-9 rounded-xl \${s.bg} border flex items-center justify-center\`}>
                  <Icon className={\`w-5 h-5 \${s.color}\`} />
                </div>
              </div>
              <div className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{s.value}</div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span>{s.subtitle}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#0043DC] transition-transform group-hover:translate-x-0.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Dispatch Presets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-black text-slate-900">Instant Quick Dispatch Presets</h3>
            <p className="text-xs text-slate-500">1-click test trips that instantly wake drivers' phones via Push Notifications</p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-[#0043DC] font-bold border border-blue-100">
            Live Testing
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => onQuickDispatch('Airport Express')}
            className="p-4 rounded-xl border border-slate-200 hover:border-[#0043DC] hover:bg-blue-50/50 text-left transition space-y-1 group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-[#0043DC]">
              <span>Koramangala ➔ Airport (BLR)</span>
              <Send className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">₹1,250 • 42 km • Sedan • Toll Included</p>
          </button>

          <button
            onClick={() => onQuickDispatch('City Ride')}
            className="p-4 rounded-xl border border-slate-200 hover:border-[#0043DC] hover:bg-blue-50/50 text-left transition space-y-1 group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-[#0043DC]">
              <span>Indiranagar ➔ Whitefield ITPL</span>
              <Send className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">₹520 • 16 km • Hatchback • Cash</p>
          </button>

          <button
            onClick={() => onQuickDispatch('Outstation Trip')}
            className="p-4 rounded-xl border border-slate-200 hover:border-[#0043DC] hover:bg-blue-50/50 text-left transition space-y-1 group"
          >
            <div className="flex items-center justify-between text-xs font-bold text-slate-900 group-hover:text-[#0043DC]">
              <span>Bengaluru ➔ Mysuru Palace</span>
              <Send className="w-3.5 h-3.5" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">₹3,400 • 145 km • SUV • Batta Included</p>
          </button>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path.join(adminComp, 'DashboardOverview.tsx'), dashboardTsx, 'utf8');
console.log('✅ Updated DashboardOverview.tsx (White & PickMi Blue Theme)');

// ── 3. App.tsx (Fixed Sidebar Layout + White Theme + CreateTripPage) ────────
const appTsx = `import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardOverview } from './components/DashboardOverview';
import { TripsManager } from './components/TripsManager';
import { DriversManager } from './components/DriversManager';
import { DocumentVerification } from './components/DocumentVerification';
import { SecurityDepositTracker } from './components/SecurityDepositTracker';
import { CreateTripPage } from './components/CreateTripPage';
import { SchemaSetupModal } from './components/SchemaSetupModal';
import {
  supabase,
  checkDatabaseConnection,
  getDrivers,
  getTrips,
  getPendingDocuments,
  createTrip,
  updateTripStatus,
  createDriver,
  updateDriverOnlineStatus,
  updateDriverDepositStatus,
  verifyDocument,
} from './lib/supabase';
import type { Driver, DriverDocument, Trip, TripStatus, NavTab } from './types';
import { AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('overview');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    ok: boolean;
    tablesExist: boolean;
    message: string;
  }>({
    ok: false,
    tablesExist: false,
    message: 'Connecting to Supabase...',
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);

  // 1. Check connection and fetch live data
  const loadDatabase = useCallback(async () => {
    setIsSyncing(true);
    try {
      const status = await checkDatabaseConnection();
      setSupabaseStatus(status);

      if (status.tablesExist) {
        const [liveDrivers, liveTrips, liveDocs] = await Promise.allSettled([
          getDrivers(),
          getTrips(),
          getPendingDocuments(),
        ]);

        if (liveDrivers.status === 'fulfilled') {
          setDrivers(liveDrivers.value || []);
        }
        if (liveTrips.status === 'fulfilled') {
          setTrips(liveTrips.value || []);
        }
        if (liveDocs.status === 'fulfilled') {
          setDocuments(liveDocs.value || []);
        }
      }
    } catch (err: any) {
      console.warn('Supabase fetch notice:', err.message);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    loadDatabase();

    // 2. Realtime Subscriptions
    const channel = supabase
      .channel('admin_unified_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips' }, () => {
        loadDatabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, () => {
        loadDatabase();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_documents' }, () => {
        loadDatabase();
      })
      .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [loadDatabase]);

  // Trip Handlers
  const handleCreateTrip = async (payload: any) => {
    const newTrip = await createTrip(payload);
    setTrips((prev) => [newTrip, ...prev]);
  };

  const handleUpdateTripStatus = async (tripId: string, status: TripStatus, driverId?: string) => {
    await updateTripStatus(tripId, status, driverId);
    setTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, status, assigned_driver_id: driverId || t.assigned_driver_id } : t))
    );
  };

  const handleAssignDriver = async (tripId: string, driverId: string) => {
    await handleUpdateTripStatus(tripId, 'ASSIGNED', driverId);
  };

  const handleQuickDispatch = (presetName: string) => {
    handleCreateTrip({
      customer_name: 'Karthik P (Express)',
      customer_phone: '+91 98450 12345',
      pickup_location: 'Koramangala 5th Block, Bengaluru',
      pickup_latitude: 12.9352,
      pickup_longitude: 77.6245,
      drop_location: 'Kempegowda International Airport (BLR), Terminal 2',
      drop_latitude: 13.1989,
      drop_longitude: 77.7068,
      fare: 1250,
      distance: '42.5 km',
      vehicle_type: 'Sedan',
      trip_type: 'Airport Transfer',
      payment_method: 'Cash',
      cash_to_collect: 1250,
      allowed_km: 45,
      extra_km_rate: 14,
      toll_included: 'INCLUDED',
      permit_included: 'EXCLUDED',
      batta_included: 'INCLUDED',
      hill_charges_applicable: 'NOT_APPLICABLE',
    });
    setCurrentTab('trips');
  };

  // Driver Handlers
  const handleAddDriver = async (payload: any) => {
    const created = await createDriver(payload);
    setDrivers((prev) => [created, ...prev]);
  };

  const handleToggleOnline = async (driverId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ONLINE' ? 'OFFLINE' : 'ONLINE';
    await updateDriverOnlineStatus(driverId, nextStatus);
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, online_status: nextStatus } : d))
    );
  };

  const handleToggleDeposit = async (driverId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';
    await updateDriverDepositStatus(driverId, nextStatus);
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, deposit_status: nextStatus } : d))
    );
  };

  const handleUpdateDeposit = async (driverId: string, status: 'PAID' | 'PENDING', paymentId?: string) => {
    await updateDriverDepositStatus(driverId, status, paymentId);
    setDrivers((prev) =>
      prev.map((d) => (d.id === driverId ? { ...d, deposit_status: status } : d))
    );
  };

  const handleVerifyDocument = async (docId: string, status: 'Verified' | 'Rejected', reason?: string) => {
    await verifyDocument(docId, status, reason);
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.id === docId ? { ...doc, verification_status: status, rejection_reason: reason || null } : doc
      )
    );
  };

  const pendingDocCount = documents.filter((d) => d.verification_status === 'Pending').length;
  const onlineDriverCount = drivers.filter((d) => d.online_status === 'ONLINE').length;
  const activeTripCount = trips.filter((t) => t.status === 'ASSIGNED' || t.status === 'STARTED' || t.status === 'ARRIVED').length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Fixed Left Navigation Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'schema') {
            setIsSetupModalOpen(true);
          } else {
            setCurrentTab(tab);
          }
        }}
        pendingDocCount={pendingDocCount}
        onlineDriverCount={onlineDriverCount}
        activeTripCount={activeTripCount}
      />

      {/* Main Content Area offset by Sidebar width (w-64 = 16rem = 256px) */}
      <div className="ml-64 flex-1 flex flex-col min-h-screen">
        <Header
          supabaseStatus={supabaseStatus}
          isSyncing={isSyncing}
          onRefresh={loadDatabase}
          onOpenCreateTrip={() => setCurrentTab('create-trip')}
          onOpenSetupModal={() => setIsSetupModalOpen(true)}
        />

        {/* Database Warning Banner */}
        {!supabaseStatus.tablesExist && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 text-xs text-amber-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Connected to <strong>https://awwrbgwpzgtbunrvsmyu.supabase.co</strong>. Database tables not detected yet.
              </span>
            </div>
            <button
              onClick={() => setIsSetupModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 transition"
            >
              SQL Schema Setup
            </button>
          </div>
        )}

        {/* Main Routed Page Content */}
        <main className="p-8 flex-1">
          {currentTab === 'overview' && (
            <DashboardOverview
              drivers={drivers}
              trips={trips}
              documents={documents}
              onOpenCreateTrip={() => setCurrentTab('create-trip')}
              onNavigateTab={setCurrentTab}
              onQuickDispatch={handleQuickDispatch}
            />
          )}

          {currentTab === 'create-trip' && (
            <CreateTripPage
              drivers={drivers}
              onSubmit={handleCreateTrip}
              onNavigateToTrips={() => setCurrentTab('trips')}
            />
          )}

          {currentTab === 'trips' && (
            <TripsManager
              trips={trips}
              drivers={drivers}
              onOpenCreateModal={() => setCurrentTab('create-trip')}
              onUpdateTripStatus={handleUpdateTripStatus}
              onAssignDriver={handleAssignDriver}
            />
          )}

          {currentTab === 'drivers' && (
            <DriversManager
              drivers={drivers}
              onToggleOnline={handleToggleOnline}
              onToggleDeposit={handleToggleDeposit}
              onInspectDocuments={() => setCurrentTab('documents')}
              onAddDriver={handleAddDriver}
            />
          )}

          {currentTab === 'documents' && (
            <DocumentVerification
              documents={documents}
              onVerifyDocument={handleVerifyDocument}
            />
          )}

          {currentTab === 'deposits' && (
            <SecurityDepositTracker
              drivers={drivers}
              onUpdateDeposit={handleUpdateDeposit}
            />
          )}
        </main>
      </div>

      {/* Supabase Schema Modal */}
      <SchemaSetupModal
        isOpen={isSetupModalOpen}
        onClose={() => setIsSetupModalOpen(false)}
        onRefresh={loadDatabase}
        isSyncing={isSyncing}
      />
    </div>
  );
}
`;

fs.writeFileSync(path.join(adminSrc, 'App.tsx'), appTsx, 'utf8');
console.log('✅ Updated App.tsx (Fixed Sidebar, White Theme, CreateTripPage Routing)');
