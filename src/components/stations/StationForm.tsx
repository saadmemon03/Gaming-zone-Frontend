import { useState } from "react";

import type { Station } from "../../types/Station";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

interface StationFormProps {
  station?: Station;
  onSubmit: (data: Omit<Station, "id">) => void;
  onCancel: () => void;
}

export default function StationForm({
  station,
  onSubmit,
  onCancel,
}: StationFormProps) {
  const [name, setName] = useState(station?.name ?? "");

  const [hourlyRate, setHourlyRate] = useState(
    String(station?.hourlyRate ?? 300)
  );

  const [status, setStatus] = useState<Station["status"]>(
    station?.status ?? "Available"
  );

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    onSubmit({
      name,
      hourlyRate: Number(hourlyRate),
      status,
    } as any);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Station Name */}
      <Input
        id="station-name"
        label="Station Name"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Station 07"
        required
      />

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