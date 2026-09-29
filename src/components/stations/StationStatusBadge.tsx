import Badge from "../ui/Badge";
import type { StationStatus } from "../../types/Station";

interface Props {
  status: StationStatus;
}

export default function StationStatusBadge({
  status,
}: Props) {
  const variantMap = {
    Available: "success",
    Occupied: "warning",
    Reserved: "info",
    Maintenance: "danger",
  } as const;

  return (
    <Badge variant={variantMap[status]}>
      {status}
    </Badge>
  );
}