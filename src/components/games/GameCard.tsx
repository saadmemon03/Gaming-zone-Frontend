import {
  Gamepad2,
  Pencil,
  Trash2,
} from "lucide-react";

import Button from "../ui/Button";
import type { Game } from "../../types/game";

interface GameCardProps {
  game: Game;
  onEdit: (game: Game) => void;
  onDelete: (game: Game) => void;
}

export default function GameCard({
  game,
  onEdit,
  onDelete,
}: GameCardProps) {
  return (
    <div className="rounded-xl border border-[#273449] bg-[#151C2C] p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#7C3AED]/10 text-[#7C3AED]">
            <Gamepad2 size={21} />
          </div>

          <div>
            <h3 className="font-semibold text-white">
              {game.name}
            </h3>

            <p className="text-xs text-slate-500">
              {game.platform}
            </p>
          </div>
        </div>

        <span
          className={
            game.isActive
              ? "text-xs text-emerald-400"
              : "text-xs text-red-400"
          }
        >
          {game.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      <p className="mt-4 text-sm text-slate-400">
        {game.description}
      </p>

      <div className="mt-5 flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onEdit(game)}
        >
          <Pencil size={14} />
          Edit
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => onDelete(game)}
        >
          <Trash2 size={14} />
          Delete
        </Button>
      </div>
    </div>
  );
}