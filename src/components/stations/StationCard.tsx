import { Edit, Monitor, Trash2 } from "lucide-react";

import type { Station } from "../../types/Station";
import Badge from "../ui/Badge";
import Button from "../ui/Button";

interface StationCardProps {
  station: Station;
  onEdit: (station: Station) => void;
  onDelete: (station: Station) => void;
}

export default function StationCard({
  station,
  onEdit,
  onDelete,
}: StationCardProps) {
  return (
    <div className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-400/10 text-indigo-300">
            <Monitor size={20} />
          </div>

          <div>
            <h3 className="font-semibold text-white">{station.name}</h3>
            <p className="text-xs text-slate-500">{station.type}</p>
          </div>
        </div>

        <Badge
          variant={
            station.status === "Available"
              ? "success"
              : station.status === "Occupied"
                ? "info"
                : station.status === "Maintenance"
                  ? "warning"
                  : "danger"
          }
        >
          {station.status}
        </Badge>
      </div>

      <div className="mt-5 space-y-2 text-sm text-slate-300">
        <p>
          <span className="text-slate-500">Rate:</span> Rs. {station.hourlyRate}/hr
        </p>
      </div>

      <div className="mt-5 flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => onEdit(station)}>
          <Edit size={14} />
          Edit
        </Button>

        <Button variant="danger" size="sm" onClick={() => onDelete(station)}>
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  );
}
