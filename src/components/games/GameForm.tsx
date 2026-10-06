import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";

import type { Game, GamePlatform } from "../../types/game";

interface GameFormProps {
  game?: Game;
  existingGames?: Game[];
  onSubmit: (data: Omit<Game, "id">) => void;
  onCancel: () => void;
}

export default function GameForm({
  game,
  existingGames = [],
  onSubmit,
  onCancel,
}: GameFormProps) {
  const [name, setName] = useState(
    game?.name ?? ""
  );
  const [nameError, setNameError] = useState("");

  const platform: GamePlatform = game?.platform ?? "PC";

  const [description, setDescription] = useState(
    game?.description ?? ""
  );

  const [isActive, setIsActive] = useState(
    game?.isActive ?? true
  );

  const handleSubmit = (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setNameError("");

    const isDuplicate = existingGames.some((g) => {
      if (g.name.trim().toLowerCase() !== name.trim().toLowerCase()) return false;
      if (game) {
        const currentId = game.id || (game as any)._id;
        const gId = g.id || (g as any)._id;
        if (gId === currentId) return false;
      }
      return true;
    });

    if (isDuplicate) {
      setNameError("Game name already exists!");
      return;
    }

    onSubmit({
      name: name.trim(),
      platform,
      description,
      isActive,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      {/* Game Name */}
      <div>
        <Input
          id="game-name"
          label="Game Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError("");
          }}
          placeholder="Counter Strike 2"
          required
        />
        {nameError && (
          <p className="text-red-500 text-xs mt-1 font-medium">{nameError}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="game-description"
          className="mb-2 block text-sm font-medium text-slate-300"
        >
          Description
        </label>

        <textarea
          id="game-description"
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          rows={4}
          className="
            w-full rounded-lg
            border border-[#273449]
            bg-[#1f2335]
            px-3 py-2
            text-sm text-white
            outline-none
            placeholder:text-slate-600
            focus:border-[#7C3AED]
          "
          placeholder="Game description..."
        />
      </div>

      {/* Active Game */}
      <label className="flex items-center gap-3 text-sm text-slate-300">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) =>
            setIsActive(e.target.checked)
          }
          className="h-4 w-4 accent-[#7C3AED]"
        />

        Active Game
      </label>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>

        <Button type="submit">
          {game ? "Update Game" : "Create Game"}
        </Button>
      </div>
    </form>
  );
}