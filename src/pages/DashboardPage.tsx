import { useState } from "react";
import { Clock3, Monitor } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getApiErrorMessage, stationsApi, bookingsApi } from "../services/api";
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

  // ================================
  // Time Slots & Booking State
  // ================================
  const [timeSlotsStation, setTimeSlotsStation] = useState<
    Station | undefined
  >();

  const [bookingStationId, setBookingStationId] = useState<
    string | undefined
  >();

  const [bookingStartTime, setBookingStartTime] = useState<
    Date | undefined
  >();

  const [editingBooking, setEditingBooking] = useState<
    Booking | undefined
  >();

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  // ================================
  // Separate Error States
  // ================================
  const [bookingCreateError, setBookingCreateError] = useState("");
  const [bookingUpdateError, setBookingUpdateError] = useState("");

  // ================================
  // Get Stations
  // ================================
  const {
    data: stationsData,
    isLoading: stationsLoading,
    isError: stationsIsError,
    error: stationsError,
  } = useQuery({
    queryKey: ["stations"],

    queryFn: async () => {
      const res = await stationsApi.getAll();
      return res.data || [];
    },
  });

  const stations: Station[] = stationsData || [];

  // ================================
  // Station Error Message
  // ================================
  const stationErrorMessage = stationsIsError
    ? getApiErrorMessage(stationsError, "Failed to load stations")
    : "";

  // ================================
  // Filter Stations
  // ================================
  const filteredStations = stations.filter((station) =>
    station.name.toLowerCase().includes(search.toLowerCase())
  );

  // ================================
  // Booking Submit
  // ================================
  const handleBookingSubmit = async (data: any) => {
    // Reset previous errors
    setBookingCreateError("");
    setBookingUpdateError("");

    try {
      // ============================
      // Update Booking
      // ============================
      if (editingBooking) {
        try {
          await bookingsApi.update(editingBooking.id, data);

          toast.success("Booking updated successfully!");

          setIsBookingModalOpen(false);
          setEditingBooking(undefined);

          await queryClient.invalidateQueries({
            queryKey: ["stations"],
          });
        } catch (error) {
          console.error("Update Booking Error:", error);

          const message = getApiErrorMessage(
            error,
            "Failed to update booking"
          );

          setBookingUpdateError(message);
          toast.error(message);

          return;
        }

        return;
      }

      // ============================
      // Create Booking
      // ============================
      try {
        await bookingsApi.create(data);

        toast.success("Booking created successfully!");

        setIsBookingModalOpen(false);
        setEditingBooking(undefined);

        await queryClient.invalidateQueries({
          queryKey: ["stations"],
        });
      } catch (error) {
        console.error("Create Booking Error:", error);

        const message = getApiErrorMessage(
          error,
          "Failed to create booking"
        );

        setBookingCreateError(message);
        toast.error(message);

        return;
      }
    } catch (error) {
      console.error("Booking Error:", error);

      toast.error("Something went wrong with booking");
    }
  };

  return (
    <div className="space-y-6">

      {/* ================================
          Header
      ================================= */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Gaming Stations
          </h1>

          <p className="mt-1 text-sm text-[#64748B]">
            Select a station to create a new booking.
          </p>
        </div>
      </div>

      {/* ================================
          Stations API Error
      ================================= */}
      {stationsIsError && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4">
          <p className="text-sm font-medium text-red-400">
            Failed to load stations
          </p>

          <p className="mt-1 text-sm text-red-300">
            {stationErrorMessage}
          </p>

          <button
            type="button"
            onClick={() =>
              queryClient.invalidateQueries({
                queryKey: ["stations"],
              })
            }
            className="mt-3 rounded-lg bg-red-500/10 px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/20"
          >
            Try Again
          </button>
        </div>
      )}

      {/* ================================
          Stats
      ================================= */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StationStat
          title="Total Stations"
          value={stations.length.toString()}
        />

        <StationStat
          title="Available"
          value={stations
            .filter((s) => s.status === "Available")
            .length.toString()}
          color="text-green-400"
        />

        <StationStat
          title="Occupied"
          value={stations
            .filter((s) => s.status === "Occupied")
            .length.toString()}
          color="text-indigo-300"
        />

        <StationStat
          title="Maintenance"
          value={stations
            .filter((s) => s.status === "Maintenance")
            .length.toString()}
          color="text-yellow-400"
        />
      </div>

      {/* ================================
          Search
      ================================= */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search stations by name..."
      />

      {/* ================================
          Loading
      ================================= */}
      {stationsLoading && (
        <div className="rounded-xl border border-[#273449] bg-[#151C2C] p-6">
          <p className="text-sm text-slate-400">
            Loading stations...
          </p>
        </div>
      )}

      {/* ================================
          Station List
      ================================= */}
      {!stationsLoading && !stationsIsError && (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {filteredStations.length === 0 ? (
            <div className="col-span-full rounded-xl border border-[#273449] bg-[#151C2C] p-8 text-center">
              <p className="text-slate-400">
                No stations found.
              </p>
            </div>
          ) : (
            filteredStations.map((station) => (
              <div
                key={(station.id || station._id) as string}
                className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5 transition hover:border-[#7C3AED]/50"
              >

                {/* Station Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-400/10">
                      <Monitor
                        size={22}
                        className="text-indigo-300"
                      />
                    </div>

                    <div>
                      <h3 className="font-semibold text-white">
                        {station.name}
                      </h3>
                    </div>

                  </div>
                </div>

                {/* Price */}
                <div className="mt-5 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#64748B]">
                      Price
                    </span>

                    <span className="text-sm font-semibold text-white">
                      Rs. {station.hourlyRate}/hr
                    </span>
                  </div>
                </div>

                {/* Available Hours */}
                <button
                  type="button"
                  onClick={() => setTimeSlotsStation(station)}
                  className="mt-4 flex w-full items-center gap-3 rounded-lg border border-[#273449] bg-[#101827] px-3 py-3 text-left hover:border-[#7C3AED]/60"
                >
                  <Clock3
                    size={17}
                    className="shrink-0 text-green-400"
                  />

                  <span>
                    <span className="block text-sm font-medium text-white">
                      Available hours
                    </span>

                    <span className="block text-xs text-slate-500">
                      Choose a time to book
                    </span>
                  </span>
                </button>

                {/* Status */}
                <div className="mt-5 flex items-center justify-between border-t border-[#273449] pt-4">
                  <StatusBadge status={station.status} />
                </div>

              </div>
            ))
          )}

        </div>
      )}

      {/* ================================
          Time Slots Modal
      ================================= */}
      <Modal
        isOpen={!!timeSlotsStation}
        onClose={() => setTimeSlotsStation(undefined)}
        title="Select Time Slot"
      >
        {timeSlotsStation && (
          <StationTimeSlotsModal
            station={timeSlotsStation}

            onEditBooking={(booking) => {
              setBookingCreateError("");
              setBookingUpdateError("");

              setEditingBooking(booking);

              setBookingStationId(
                (timeSlotsStation.id ||
                  timeSlotsStation._id) as string
              );

              setBookingStartTime(
                new Date(booking.startTime)
              );

              setTimeSlotsStation(undefined);
              setIsBookingModalOpen(true);
            }}

            onBookSlot={(time) => {
              setBookingCreateError("");
              setBookingUpdateError("");

              setEditingBooking(undefined);

              setBookingStationId(
                (timeSlotsStation.id ||
                  timeSlotsStation._id) as string
              );

              setTimeSlotsStation(undefined);

              setBookingStartTime(time);

              setIsBookingModalOpen(true);
            }}
          />
        )}
      </Modal>

      {/* ================================
          Booking Modal
      ================================= */}
      <Modal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(undefined);
          setBookingCreateError("");
          setBookingUpdateError("");
        }}
        title={
          editingBooking
            ? "Edit Booking"
            : "New Booking"
        }
      >

        {/* Create Booking Error */}
        {!editingBooking && bookingCreateError && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm font-medium text-red-400">
              Booking Creation Error
            </p>

            <p className="mt-1 text-sm text-red-300">
              {bookingCreateError}
            </p>
          </div>
        )}

        {/* Update Booking Error */}
        {editingBooking && bookingUpdateError && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3">
            <p className="text-sm font-medium text-red-400">
              Booking Update Error
            </p>

            <p className="mt-1 text-sm text-red-300">
              {bookingUpdateError}
            </p>
          </div>
        )}

        <BookingForm
          initialStationId={bookingStationId}
          initialStartTime={bookingStartTime?.toISOString()}
          initialBooking={editingBooking}

          onSubmit={handleBookingSubmit}

          onCancel={() => {
            setIsBookingModalOpen(false);
            setEditingBooking(undefined);
            setBookingCreateError("");
            setBookingUpdateError("");
          }}
        />

      </Modal>
    </div>
  );
};

// ========================================
// Station Stat
// ========================================
const StationStat = ({
  title,
  value,
  color = "text-white",
}: {
  title: string;
  value: string;
  color?: string;
}) => (
  <div className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5">
    <p className="text-sm text-[#64748B]">
      {title}
    </p>

    <p className={`mt-2 text-2xl font-bold ${color}`}>
      {value}
    </p>
  </div>
);

// ========================================
// Status Badge
// ========================================
const StatusBadge = ({
  status,
}: {
  status: string;
}) => {
  const styles: Record<string, string> = {
    Available:
      "bg-green-500/10 text-green-400",

    Occupied:
      "bg-indigo-400/10 text-indigo-300",

    Reserved:
      "bg-rose-400/10 text-rose-300",

    Maintenance:
      "bg-yellow-500/10 text-yellow-400",
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        styles[status] ||
        "bg-slate-500/10 text-slate-400"
      }`}
    >
      {status}
    </span>
  );
};

export default StationsPage;