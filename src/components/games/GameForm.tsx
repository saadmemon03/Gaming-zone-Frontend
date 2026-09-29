import { useState } from "react";

import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";

import type { Game, GamePlatform } from "../../types/game";

interface GameFormProps {
  game?: Game;
  onSubmit: (data: Omit<Game, "id">) => void;
  onCancel: () => void;
}

export default function GameForm({
  game,
  onSubmit,
  onCancel,
}: GameFormProps) {
  const [name, setName] = useState(
    game?.name ?? ""
  );

  const [platform, setPlatform] = useState<GamePlatform>(
    game?.platform ?? "PC"
  );

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

    onSubmit({
      name,
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
      <Input
        id="game-name"
        label="Game Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Counter Strike 2"
        required
      />

      {/* Platform */}
      <Select
        id="game-platform"
        label="Platform"
        value={platform}
        onChange={(e) =>
          setPlatform(e.target.value as GamePlatform)
        }
        options={[
          {
            label: "PC",
            value: "PC",
          },
          {
            label: "PlayStation 5",
            value: "PlayStation 5",
          },
          {
            label: "Xbox",
            value: "Xbox",
          },
        ]}
      />

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
            bg-[#0B0F19]
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