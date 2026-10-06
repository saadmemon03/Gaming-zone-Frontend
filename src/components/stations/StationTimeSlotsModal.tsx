import { useState, useEffect } from "react";
import { Edit } from "lucide-react";
import { bookingsApi } from "../../services/api";

export default function StationTimeSlotsModal({ station, onBookSlot, onEditBooking }: {
  station: any;
  onBookSlot: (time: Date) => void;
  onEditBooking: (booking: any) => void;
}) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await bookingsApi.getAll();
        // filter for this station and active bookings today
        const now = new Date();
        const stationBookings = (res.data || []).filter((b: any) => 
          (b.station?._id || b.station) === (station._id || station.id) &&
          new Date(b.endTime) > now &&
          ['Pending', 'Confirmed'].includes(b.status)
        );
        setBookings(stationBookings);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, [station]);

  const generateSlots = () => {
    const slots = [];
    let current = new Date();
    current.setMinutes(0, 0, 0); // Start of hour

    for (let i = 0; i < 12; i++) {
      const slotStart = new Date(current);
      const slotEnd = new Date(current.getTime() + 60 * 60 * 1000); // add 1 hour
      
      const overlappingBooking = bookings.find(b => {
        const bStart = new Date(b.startTime);
        const bEnd = new Date(b.endTime);
        return (slotStart < bEnd && slotEnd > bStart); // Overlap condition
      });

      slots.push({
        start: slotStart,
        end: slotEnd,
        booking: overlappingBooking
      });
      current = new Date(current.getTime() + 60 * 60 * 1000);
    }
    return slots;
  };

  if (loading) return <div className="p-4 text-white">Loading schedule...</div>;

  const slots = generateSlots();

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-3 p-2 max-h-[60vh] overflow-y-auto">
      <h3 className="text-lg font-semibold text-white mb-4">Time Slots for {station.name}</h3>
      {slots.map((slot, idx) => {
        const isBooked = !!slot.booking;
        if (isBooked) {
          return (
            <div
              key={idx}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-800/50 p-4"
            >
              <span className="text-sm font-medium text-slate-300">
                {formatTime(slot.start)} - {formatTime(slot.end)}
              </span>
              <div className="flex items-center gap-3">
                <div className="text-right text-xs">
                  <span className="block text-slate-400">
                    {slot.booking.guestName || slot.booking.user?.name || "Guest"}
                  </span>
                  <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] ${
                    slot.booking.status === "Confirmed" ? "bg-indigo-400/10 text-indigo-300" : "bg-yellow-500/10 text-yellow-400"
                  }`}>
                    {slot.booking.status}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onEditBooking(slot.booking)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[#273449] px-2.5 py-1.5 text-xs text-rose-200 hover:bg-rose-400/10"
                >
                  <Edit size={13} />
                  Edit
                </button>
              </div>
            </div>
          );
        }

        return (
          <button
            key={idx}
            onClick={() => onBookSlot(slot.start)}
            className="flex w-full items-center justify-between rounded-xl border border-[#273449] bg-[#151C2C] p-4 transition-all hover:border-[#7C3AED] hover:bg-[#7C3AED]/10"
          >
            <span className="text-sm font-medium text-slate-300">
              {formatTime(slot.start)} - {formatTime(slot.end)}
            </span>
            <span className="rounded-full bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400">
              Available (Click to Book)
            </span>
          </button>
        )
      })}
    </div>
  );
}
