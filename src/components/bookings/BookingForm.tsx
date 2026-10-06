import { useState, useEffect } from "react";
import Button from "../ui/Button";
import Select from "../ui/Select";
import Input from "../ui/Input";
import ConfirmDialog from "../common/ConfirmDialog";
import { stationsApi, gamesApi } from "../../services/api";
import type { Booking, BookingStatus } from "../../types/booking";
import type { Game } from "../../types/game";

type BookingRecord = Partial<Booking> & {
  _id?: string;
  guestName?: string;
  contactNumber?: string | null;
  station?: string | { id?: string; _id?: string };
  game?: string | { id?: string; _id?: string } | null;
};

const asLocalDateTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};

const getId = (value?: string | { id?: string; _id?: string } | null) =>
  typeof value === "string" ? value : value?._id || value?.id || "";

interface BookingFormProps {
  initialStationId?: string;
  initialStartTime?: string;
  initialBooking?: BookingRecord;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export default function BookingForm({ initialStationId, initialStartTime, initialBooking, onSubmit, onCancel }: BookingFormProps) {
  const [stations, setStations] = useState<any[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [guestName, setGuestName] = useState(initialBooking?.guestName || initialBooking?.userName || "");
  const [contactNumber, setContactNumber] = useState(initialBooking?.contactNumber || "");
  const [station, setStation] = useState(initialStationId || getId(initialBooking?.station) || initialBooking?.stationId || "");
  const [startTime, setStartTime] = useState(asLocalDateTime(initialStartTime || initialBooking?.startTime));
  const [hours, setHours] = useState(
    initialBooking?.startTime && initialBooking.endTime
      ? String((new Date(initialBooking.endTime).getTime() - new Date(initialBooking.startTime).getTime()) / 3600000)
      : ""
  );
  const [amount, setAmount] = useState(initialBooking?.amount === undefined ? "" : String(initialBooking.amount));
  const [status, setStatus] = useState(initialBooking?.status || "Pending");
  const [game, setGame] = useState(getId(initialBooking?.game) || initialBooking?.gameId || "");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<any>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [sRes, gRes] = await Promise.all([
          stationsApi.getAll(),
          gamesApi.getAll({ isActive: true }),
        ]);
        setStations(sRes.data || []);
        setGames((gRes.data || []).filter((entry) => entry.isActive));
        if (!initialStationId && sRes.data?.length > 0) setStation(sRes.data[0]._id || sRes.data[0].id);
      } catch (err) {
        console.error("Failed to fetch form options", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [initialStationId]);

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
  };

  const handleHoursChange = (val: string) => {
    setHours(val);
    if (startTime && val) {
      // Auto calculate amount if station is selected
      const selectedStation = stations.find(s => (s._id || s.id) === station);
      if (selectedStation?.hourlyRate) {
        setAmount((selectedStation.hourlyRate * Number(val)).toString());
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startTime || !hours || Number(hours) <= 0) {
      alert("Please select a start time and booking duration");
      return;
    }
    if (!station) {
      alert("Please select a Gaming Station");
      return;
    }
    
    setPendingBookingData({
      guestName: guestName || "Walk-in Guest",
      contactNumber: contactNumber || null,
      station,
      game: game || null,
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(new Date(startTime).getTime() + Number(hours) * 60 * 60 * 1000).toISOString(),
      amount: Number(amount),
      status
    });
    setIsConfirmOpen(true);
  };

  const confirmBooking = () => {
    if (!pendingBookingData) return;
    onSubmit(pendingBookingData);
    setPendingBookingData(undefined);
    setIsConfirmOpen(false);
  };

  const sortedStations = [...stations].sort((a, b) => {
    if (a.status === 'Available' && b.status !== 'Available') return -1;
    if (a.status !== 'Available' && b.status === 'Available') return 1;
    return 0;
  });

  if (loading) return <div className="text-slate-400 p-4">Loading options...</div>;

  const availableGames = games; // Sab active games dikhao, platform filter nahi

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="booking-guest"
          label="Customer Name"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          placeholder="E.g. Ali Khan"
          required
        />
        <Input
          id="booking-contact"
          label="Contact Number"
          value={contactNumber}
          onChange={(e) => setContactNumber(e.target.value)}
          placeholder="0300 1234567"
        />
      </div>

      <div>
        <Select
          id="booking-station"
          label={initialStationId ? "Gaming Station (Locked)" : "Select Gaming Station"}
          value={station}
          disabled={!!initialStationId}
          onChange={(e) => {
            setStation(e.target.value);
            setGame("");
          }}
          options={sortedStations.map(s => ({
            label: `${s.name} (${s.status})`,
            value: s._id || s.id
          }))}
          className={initialStationId ? "opacity-60 cursor-not-allowed" : ""}
        />
        {initialStationId && (
          <p className="mt-1 text-xs text-slate-500">
            Station is fixed — selected from station page
          </p>
        )}
      </div>

      <Select
        id="booking-game"
        label="Game"
        value={game}
        onChange={(e) => setGame(e.target.value)}
        options={[
          { label: availableGames.length ? "Select a game" : "No games available for this station", value: "" },
          ...availableGames.map((entry) => ({
            label: entry.name,
            value: entry._id || entry.id,
          })),
        ]}
      />



      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          id="booking-start"
          label="Start Time"
          type="datetime-local"
          value={startTime}
          onChange={(e) => handleStartTimeChange(e.target.value)}
          required
        />
        <Input
          id="booking-hours"
          label="Hours"
          type="number"
          min="0.5"
          step="0.5"
          value={hours}
          onChange={(e) => handleHoursChange(e.target.value)}
          placeholder="e.g. 2"
          required
        />
      </div>

      <Input
        id="booking-amount"
        label="Amount (Rs)"
        type="number"
        min="0"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        required
      />

      <Select
        id="booking-status"
        label="Status"
        value={status}
        onChange={(e) => setStatus(e.target.value as BookingStatus)}
        options={[
          { label: "Pending", value: "Pending" },
          { label: "Confirmed", value: "Confirmed" },
          { label: "Completed", value: "Completed" },
          { label: "Cancelled", value: "Cancelled" },
        ]}
      />

      <div className="flex justify-end gap-3 pt-3">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{initialBooking ? "Update Booking" : "Create Booking"}</Button>
      </div>
    </form>
    <ConfirmDialog
      isOpen={isConfirmOpen}
      onClose={() => {
        setIsConfirmOpen(false);
        setPendingBookingData(undefined);
      }}
      onConfirm={confirmBooking}
      title={initialBooking ? "Confirm Booking Update" : "Confirm Booking"}
      message={initialBooking
        ? "Are you sure you want to save these booking changes?"
        : "Are you sure you want to create this booking?"}
      confirmText={initialBooking ? "Save Changes" : "Create Booking"}
      confirmVariant="primary"
    />
    </>
  );
}
