import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/common/SearchBar";
import Table, { type TableColumn } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import type { Booking } from "../types/booking";
import { bookingsApi } from "../services/api";
import { Trash2, Edit, Eye } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../components/ui/Modal";
import BookingForm from "../components/bookings/BookingForm";
import ConfirmDialog from "../components/common/ConfirmDialog";

export default function BookingsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
  const [bookingToDeleteId, setBookingToDeleteId] = useState<string | undefined>();
  const [viewingBooking, setViewingBooking] = useState<any>(null);

  const { data: bookingsData, isLoading: loading } = useQuery({
    queryKey: ["bookings"],
    queryFn: async () => {
      try {
        const bRes = await bookingsApi.getAll();
        return bRes.data || [];
      } catch (err) {
        console.error(err);
        toast.error("Failed to load data");
        throw err;
      }
    }
  });

  const bookings = bookingsData || [];

  const handleDelete = (id: string) => {
    setBookingToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!bookingToDeleteId) return;
    try {
      await bookingsApi.delete(bookingToDeleteId);
      toast.success("Booking deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete booking");
    } finally {
      setBookingToDeleteId(undefined);
    }
  };

  const handleEdit = (booking: Booking) => {
    setSelectedBooking(booking);
    setSelectedStationId(booking.stationId);
    setIsModalOpen(true);
  };

  const handleSaveBooking = async (data: any) => {
    try {
      if (selectedBooking) {
        await bookingsApi.update((selectedBooking.id || selectedBooking._id) as string, data);
        toast.success("Booking updated successfully!");
      } else {
        await bookingsApi.create({ ...data, bookingSource: "Walk-in" });
        toast.success("Booking created successfully!");
      }
      setIsModalOpen(false);
      setSelectedBooking(undefined);
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to create booking");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await bookingsApi.update(id, { status: newStatus as any });
      toast.success("Status updated successfully");
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const columns: TableColumn<Booking>[] = [
    {
      key: "id",
      header: "Booking ID",
      render: (item) => (item.id || item._id)?.slice(-6).toUpperCase(),
    },
    {
      key: "user",
      header: "Customer",
      render: (item: any) => item.guestName || item.user?.name || item.userName || "Guest",
    },
    {
      key: "station",
      header: "Station",
      render: (item: any) => item.station?.name || item.stationName || "Unknown",
    },
    {
      key: "time",
      header: "Time",
      render: (item) => `${new Date(item.startTime).toLocaleString()} - ${new Date(item.endTime).toLocaleString()}`,
    },
    {
      key: "amount",
      header: "Amount",
      render: (item) => `Rs. ${((item as Booking & { totalAmount?: number }).totalAmount ?? item.amount ?? 0).toLocaleString()}`,
    },
    {
      key: "source",
      header: "Source",
      render: (item: any) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${item.bookingSource === "Walk-in" ? "bg-orange-500/20 text-orange-400" : "bg-indigo-400/20 text-indigo-300"}`}>
          {item.bookingSource || "Online"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (item) => (
        <select
          value={item.status}
          onChange={(e) => handleStatusChange(item.id || item._id as string, e.target.value)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border-none outline-none cursor-pointer appearance-none text-center ${
            item.status === "Confirmed" ? "bg-green-500/20 text-green-400"
              : item.status === "Pending" ? "bg-yellow-500/20 text-yellow-400"
              : item.status === "Cancelled" ? "bg-red-500/20 text-red-400"
              : "bg-rose-400/20 text-rose-300"
          }`}
        >
          <option value="Pending" className="bg-[#1a2332] text-yellow-400 font-bold">Pending</option>
          <option value="Confirmed" className="bg-[#1a2332] text-green-400 font-bold">Confirmed</option>
          <option value="Cancelled" className="bg-[#1a2332] text-red-400 font-bold">Cancelled</option>
        </select>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          <button onClick={() => setViewingBooking(item)} className="text-indigo-300 hover:text-indigo-200 p-1">
            <Eye size={16} />
          </button>
          <button onClick={() => handleEdit(item)} className="text-rose-300 hover:text-rose-200 p-1">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete((item.id || item._id) as string)} className="text-red-400 hover:text-red-300 p-1">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  const filteredBookings = bookings.filter((b: any) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (b.guestName || b.user?.name || b.userName || "").toLowerCase().includes(q) ||
      (b.station?.name || b.stationName || "").toLowerCase().includes(q) ||
      (b.game?.name || b.gameName || "").toLowerCase().includes(q) ||
      (b.status || "").toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <PageHeader
        title="Bookings"
        description="Manage gaming station bookings"
      />

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by customer, station, game, status..."
        />
      </div>

      {loading ? (
        <p className="text-white mt-4">Loading bookings...</p>
      ) : (
        <Table
          columns={columns}
          data={filteredBookings}
          rowKey={(item) => item.id}
          emptyMessage="No bookings found."
        />
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedBooking(undefined);
        }}
        title={selectedBooking ? "Edit Booking" : "Create New Booking"}
      >
        {isModalOpen && (
          <BookingForm 
            initialStationId={selectedStationId} 
            initialBooking={selectedBooking}
            onSubmit={handleSaveBooking} 
            onCancel={() => {
              setIsModalOpen(false);
              setSelectedBooking(undefined);
            }}
          />
        )}
      </Modal>

      <Modal
        isOpen={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
        title="Booking Details"
      >
        {viewingBooking && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 border-b border-white/10 pb-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Customer Name</p>
                <p className="text-white font-medium">{viewingBooking.guestName || viewingBooking.user?.name || viewingBooking.userName || "Guest"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Contact</p>
                <p className="text-white font-medium">{viewingBooking.contactNumber || viewingBooking.user?.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Email</p>
                <p className="text-white font-medium">{viewingBooking.customerEmail || viewingBooking.user?.email || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-b border-white/10 pb-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Station</p>
                <p className="text-white font-medium">{viewingBooking.station?.name || viewingBooking.stationName || "Unknown"}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Game</p>
                <p className="text-white font-medium">{viewingBooking.game?.name || viewingBooking.gameName || "N/A"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 border-b border-white/10 pb-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Start Time</p>
                <p className="text-white font-medium">{new Date(viewingBooking.startTime).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">End Time</p>
                <p className="text-white font-medium">{new Date(viewingBooking.endTime).toLocaleString()}</p>
              </div>
            </div>

            {viewingBooking.addons && viewingBooking.addons.length > 0 && (
              <div className="border-b border-white/10 pb-4">
                <p className="text-sm text-slate-500 mb-2">Snacks / Addons</p>
                <ul className="space-y-1">
                  {viewingBooking.addons.map((a: any, i: number) => (
                    <li key={i} className="text-sm text-white flex justify-between">
                      <span>{a.quantity}x {a.name}</span>
                      <span>Rs. {a.price * a.quantity}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-slate-500">Total Amount</p>
                <p className="text-lg font-bold text-green-400">Rs. {viewingBooking.amount || viewingBooking.totalAmount || 0}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500">Status</p>
                <Badge variant={viewingBooking.status === "Confirmed" ? "success" : viewingBooking.status === "Pending" ? "warning" : viewingBooking.status === "Cancelled" ? "danger" : "info"}>
                  {viewingBooking.status}
                </Badge>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button onClick={() => setViewingBooking(null)} className="px-4 py-2 bg-[#273449] hover:bg-[#344662] text-white rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!bookingToDeleteId}
        onClose={() => setBookingToDeleteId(undefined)}
        onConfirm={confirmDelete}
        title="Delete Booking"
        message="Are you sure you want to delete this booking?"
        confirmText="Delete"
      />
    </div>
  );
}