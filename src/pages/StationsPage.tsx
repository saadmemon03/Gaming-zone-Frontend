import { useState } from "react";
import { Clock3, Monitor } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { stationsApi, bookingsApi } from "../services/api";
import { toast } from "react-hot-toast";
import type { Station } from "../types/Station";
import type { Booking } from "../types/booking";
import Modal from "../components/ui/Modal";
import StationTimeSlotsModal from "../components/stations/StationTimeSlotsModal";
import BookingForm from "../components/bookings/BookingForm";
import SearchBar from "../components/common/SearchBar";

const StationsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  // Time Slots & Bookings State
  const [timeSlotsStation, setTimeSlotsStation] = useState<Station | undefined>();
  const [bookingStationId, setBookingStationId] = useState<string | undefined>();
  const [bookingStartTime, setBookingStartTime] = useState<Date | undefined>();
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const { data: stationsData, isLoading: loading } = useQuery({
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

  const filteredStations = stations.filter(s => 
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Gaming Stations</h1>
          <p className="mt-1 text-sm text-[#64748B]">Select a station to create a new booking.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StationStat title="Total Stations" value={stations.length.toString()} />
        <StationStat title="Available" value={stations.filter(s => s.status === 'Available').length.toString()} color="text-green-400" />
        <StationStat title="Occupied" value={stations.filter(s => s.status === 'Occupied').length.toString()} color="text-indigo-300" />
        <StationStat title="Maintenance" value={stations.filter(s => s.status === 'Maintenance').length.toString()} color="text-yellow-400" />
      </div>

      <SearchBar 
        value={search} 
        onChange={setSearch} 
        placeholder="Search stations by name..." 
      />

      {loading ? (
        <p className="text-white">Loading stations...</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredStations.map((station) => (
            <div
              key={(station.id || station._id) as string} 
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

              <button
                type="button"
                onClick={() => setTimeSlotsStation(station)}
                className="mt-4 flex w-full items-center gap-3 rounded-lg border border-[#273449] bg-[#101827] px-3 py-3 text-left hover:border-[#7C3AED]/60"
              >
                <Clock3 size={17} className="shrink-0 text-green-400" />
                <span>
                  <span className="block text-sm font-medium text-white">Available hours</span>
                  <span className="block text-xs text-slate-500">Choose a time to book</span>
                </span>
              </button>

              <div className="mt-5 flex items-center justify-between border-t border-[#273449] pt-4">
                <StatusBadge status={station.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Time Slots Modal */}
      <Modal isOpen={!!timeSlotsStation} onClose={() => setTimeSlotsStation(undefined)} title="Select Time Slot">
        {timeSlotsStation && (
          <StationTimeSlotsModal 
            station={timeSlotsStation} 
            onEditBooking={(booking) => {
              setEditingBooking(booking);
              setBookingStationId((timeSlotsStation.id || timeSlotsStation._id) as string);
              setBookingStartTime(new Date(booking.startTime));
              setTimeSlotsStation(undefined);
              setIsBookingModalOpen(true);
            }}
            onBookSlot={(time) => {
              setEditingBooking(undefined);
              setBookingStationId((timeSlotsStation.id || timeSlotsStation._id) as string);
              setTimeSlotsStation(undefined);
              setBookingStartTime(time);
              setIsBookingModalOpen(true);
            }} 
          />
        )}
      </Modal>

      {/* Quick Booking Modal */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(undefined);
        }}
        title={editingBooking ? "Edit Booking" : "New Booking"}
      >
        <BookingForm 
          initialStationId={bookingStationId}
          initialStartTime={bookingStartTime?.toISOString()}
          initialBooking={editingBooking}
          onSubmit={async (data) => {
            try {
              if (editingBooking) {
                await bookingsApi.update(editingBooking.id, data);
                toast.success("Booking updated successfully!");
              } else {
                await bookingsApi.create(data);
                toast.success("Booking created successfully!");
              }
              setIsBookingModalOpen(false);
              setEditingBooking(undefined);
              queryClient.invalidateQueries({ queryKey: ["stations"] }); // Refresh station statuses
            } catch (err: any) {
              console.error(err);
              toast.error(err.message || "Failed to create booking");
            }
          }} 
          onCancel={() => {
            setIsBookingModalOpen(false);
            setEditingBooking(undefined);
          }}
        />
      </Modal>
    </div>
  );
};

const StationStat = ({ title, value, color = "text-white" }: { title: string, value: string, color?: string }) => (
  <div className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5">
    <p className="text-sm text-[#64748B]">{title}</p>
    <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
  </div>
);

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    Available: "bg-green-500/10 text-green-400",
    Occupied: "bg-indigo-400/10 text-indigo-300",
    Reserved: "bg-rose-400/10 text-rose-300",
    Maintenance: "bg-yellow-500/10 text-yellow-400",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
};

export default StationsPage;
