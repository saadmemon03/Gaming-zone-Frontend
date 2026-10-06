import { useState } from "react";

import type { Station } from "../../types/Station";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface StationFormProps {
  station?: Station;
  existingStations?: Station[];
  onSubmit: (data: Omit<Station, "id">) => void;
  onCancel: () => void;
}

export default function StationForm({
  station,
  existingStations = [],
  onSubmit,
  onCancel,
}: StationFormProps) {
  const [name, setName] = useState(station?.name ?? "");
  const [nameError, setNameError] = useState("");

  const [hourlyRate, setHourlyRate] = useState(
    String(station?.hourlyRate ?? 300)
  );

  const [status, setStatus] = useState<Station["status"]>(
    station?.status ?? "Available"
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNameError("");

    // Check for duplicates
    const isDuplicate = existingStations.some((s) => {
      if (s.name.trim().toLowerCase() !== name.trim().toLowerCase()) return false;
      // If we are editing, ignore the station we are currently editing
      if (station) {
        const currentId = station.id || (station as any)._id;
        const sId = s.id || (s as any)._id;
        if (sId === currentId) return false;
      }
      return true;
    });

    if (isDuplicate) {
      setNameError("Station name already exists!");
      return;
    }

    onSubmit({
      name: name.trim(),
      hourlyRate: Number(hourlyRate),
      status,
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Station Name */}
      <div>
        <Input
          id="station-name"
          label="Station Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (nameError) setNameError("");
          }}
          placeholder="Station 07"
          required
        />
        {nameError && (
          <p className="text-red-500 text-xs mt-1 font-medium">{nameError}</p>
        )}
      </div>

      {/* Hourly Rate */}
      <Input
        id="station-rate"
        label="Hourly Rate (Rs/hr)"
        type="number"
        min="0"
        value={hourlyRate}
        onChange={(event) => setHourlyRate(event.target.value)}
        required
      />

      {/* Station Status */}
      <Select
        id="station-status"
        label="Status"
        value={status}
        onChange={(event) =>
          setStatus(event.target.value as Station["status"])
        }
        options={[
          { label: "Available", value: "Available" },
          { label: "Occupied", value: "Occupied" },
          { label: "Maintenance", value: "Maintenance" },
          { label: "Reserved", value: "Reserved" },
        ]}
      />

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button type="submit">
          {station ? "Update Station" : "Create Station"}
        </Button>
      </div>
    </form>
  );
}