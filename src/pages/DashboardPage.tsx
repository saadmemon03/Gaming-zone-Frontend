import { useState } from "react";
import { Monitor, CalendarCheck, DollarSign, Users, Plus, Edit, Trash2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi, stationsApi } from "../services/api";
import { toast } from "react-hot-toast";

import Modal from "../components/ui/Modal";
import StationForm from "../components/stations/StationForm";
import ConfirmDialog from "../components/common/ConfirmDialog";
import SearchBar from "../components/common/SearchBar";

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  
  // Add/Edit Station Modal state
  const [isAddStationOpen, setIsAddStationOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<any>(null);

  // Delete Station state
  const [deleteStationId, setDeleteStationId] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboardStats"],
    queryFn: async () => {
      try {
        const res = await dashboardApi.getStats();
        return res.data;
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard stats");
        throw err;
      }
    }
  });

  const { data: stationsData, isLoading: stationsLoading } = useQuery({
    queryKey: ["stations"],
    queryFn: async () => {
      try {
        const res = await stationsApi.getAll();
        return res.data || [];
      } catch (err) {
        console.error(err);
        toast.error("Failed to load stations");
        throw err;
      }
    }
  });

  const stations = stationsData || [];
  const loading = statsLoading || stationsLoading;

  const handleSaveStation = async (data: any) => {
    try {
      if (editingStation) {
        await stationsApi.update(editingStation.id || editingStation._id, data);
        toast.success("Station updated successfully!");
      } else {
        await stationsApi.create(data);
        toast.success("Station created successfully!");
      }
      setIsAddStationOpen(false);
      setEditingStation(null);
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to save station");
    }
  };

  const handleDeleteStation = async () => {
    if (!deleteStationId) return;
    try {
      await stationsApi.delete(deleteStationId);
      toast.success("Station deleted successfully!");
      setDeleteStationId(null);
      queryClient.invalidateQueries({ queryKey: ["dashboardStats"] });
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to delete station");
    }
  };

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <p className="text-slate-400">Loading dashboard...</p>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back! Here's what's happening today.</p>
        </div>
        <button
          onClick={() => {
            setEditingStation(null);
            setIsAddStationOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#6D28D9] sm:w-auto"
        >
          <Plus size={16} strokeWidth={2.5} />
          Add Station
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard icon={<Monitor size={22} className="text-indigo-300" />} label="Total Stations" value={stats?.totalStations ?? 0} color="bg-indigo-400/10" />
        <StatCard icon={<CalendarCheck size={22} className="text-rose-300" />} label="Total Bookings" value={stats?.totalBookings ?? 0} color="bg-rose-400/10" />
        <StatCard icon={<DollarSign size={22} className="text-green-400" />} label="Total Revenue" value={`Rs. ${(stats?.totalRevenue ?? 0).toLocaleString()}`} color="bg-green-500/10" isText />
        <StatCard icon={<Users size={22} className="text-orange-400" />} label="Total Users" value={stats?.totalUsers ?? 0} color="bg-orange-500/10" />
      </div>

      <SearchBar 
        value={search} 
        onChange={setSearch} 
        placeholder="Search stations by name..." 
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredStations.length === 0 ? (
          <p className="text-slate-500">No stations found.</p>
        ) : (
          filteredStations.map((station) => (
            <div
              key={station._id || station.id}
              className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5 transition hover:border-[#7C3AED]/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-400/10">
                    <Monitor size={22} className="text-indigo-300" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{station.name}</h3>
                  </div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748B]">Price</span>
                  <span className="text-sm font-semibold text-white">Rs. {station.hourlyRate}/hr</span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between border-t border-[#273449] pt-4">
                <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                  station.status === 'Available' ? 'bg-green-500/10 text-green-400' :
                  station.status === 'Occupied' ? 'bg-indigo-400/10 text-indigo-300' :
                  station.status === 'Reserved' ? 'bg-rose-400/10 text-rose-300' :
                  'bg-yellow-500/10 text-yellow-400'
                }`}>
                  {station.status}
                </span>
                
                <div className="flex gap-2">
                  <button onClick={() => { setEditingStation(station); setIsAddStationOpen(true); }} className="rounded-lg bg-[#1B2435] p-2 text-rose-300 hover:bg-rose-400/10">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => setDeleteStationId(station._id || station.id)} className="rounded-lg bg-[#1B2435] p-2 text-red-400 hover:bg-red-500/10">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Station Modal */}
      <Modal isOpen={isAddStationOpen} onClose={() => { setIsAddStationOpen(false); setEditingStation(null); }} title={editingStation ? "Edit Station" : "Add Station"}>
        <StationForm existingStations={stations} station={editingStation} onSubmit={handleSaveStation} onCancel={() => { setIsAddStationOpen(false); setEditingStation(null); }} />
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={!!deleteStationId}
        onClose={() => setDeleteStationId(null)}
        onConfirm={handleDeleteStation}
        title="Delete Station"
        message="Are you sure you want to delete this station?"
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color, isText = false
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5">
      <div className={`mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        {icon}
      </div>
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 font-bold text-white ${isText ? "text-lg" : "text-2xl"}`}>{value}</p>
    </div>
  );
}