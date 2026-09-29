import { useState, useEffect } from "react";
import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/common/SearchBar";
import Table, { type TableColumn } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import type { Booking } from "../types/booking";
import { bookingsApi } from "../services/api";
import { Trash2, Edit } from "lucide-react";
import { toast } from "react-hot-toast";
import Modal from "../components/ui/Modal";
import BookingForm from "../components/bookings/BookingForm";
import ConfirmDialog from "../components/common/ConfirmDialog";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState<string | undefined>();
  const [selectedBooking, setSelectedBooking] = useState<Booking | undefined>();
  const [bookingToDeleteId, setBookingToDeleteId] = useState<string | undefined>();

  const fetchData = async () => {
    try {
      const bRes = await bookingsApi.getAll();
      setBookings(bRes.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = (id: string) => {
    setBookingToDeleteId(id);
  };

  const confirmDelete = async () => {
    if (!bookingToDeleteId) return;
    try {
      await bookingsApi.delete(bookingToDeleteId);
      toast.success("Booking deleted successfully");
      fetchData();
    } catch (err) {
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
        await bookingsApi.update(selectedBooking.id, data);
        toast.success("Booking updated successfully!");
      } else {
        await bookingsApi.create(data);
        toast.success("Booking created successfully!");
      }
      setIsModalOpen(false);
      setSelectedBooking(undefined);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to create booking");
    }
  };

  const columns: TableColumn<Booking>[] = [
    {
      key: "id",
      header: "Booking ID",
      render: (item) => item.id,
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
      key: "game",
      header: "Game",
      render: (item: any) => item.game?.name || item.gameName || "-",
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
      key: "status",
      header: "Status",
      render: (item) => (
        <Badge
          variant={
            item.status === "Confirmed" ? "success"
              : item.status === "Pending" ? "warning"
              : item.status === "Cancelled" ? "danger"
              : "info"
          }
        >
          {item.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (item) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(item)} className="text-blue-400 hover:text-blue-300 p-1">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete(item.id)} className="text-red-400 hover:text-red-300 p-1">
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