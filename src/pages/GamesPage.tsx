import { useEffect, useState, useCallback } from "react";
import { Plus } from "lucide-react";

import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/common/SearchBar";
import GameCard from "../components/games/GameCard";
import GameForm from "../components/games/GameForm";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { gamesApi } from "../services/api";
import { toast } from "react-hot-toast";

import type { Game } from "../types/game";

export default function GamesPage() {
  const [games, setGames]           = useState<Game[]>([]);
  const [search, setSearch]         = useState("");
  const [loading, setLoading]       = useState(false);
  const [modalOpen, setModalOpen]   = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | undefined>();

  // ── Server-side search with 400ms debounce ──────────────────────────────
  const fetchGames = useCallback(async (q: string) => {
    setLoading(true);
    try {
      const params: any = { limit: 100 };
      if (q.trim()) params.search = q.trim();
      const response = await gamesApi.getAll(params);
      setGames(response.data || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchGames("");
  }, [fetchGames]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => fetchGames(search), 400);
    return () => clearTimeout(timer);
  }, [search, fetchGames]);

  const filteredGames = games; // server already filters

  const handleCreate = async (data: Omit<Game, "id">) => {
    try {
      await gamesApi.create(data);
      await fetchGames(search);
      setModalOpen(false);
      toast.success("Game added successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to add game");
    }
  };

  const handleEdit = (game: Game) => {
    setSelectedGame(game);
    setModalOpen(true);
  };

  const handleUpdate = async (data: Omit<Game, "id">) => {
    if (!selectedGame) return;
    try {
      await gamesApi.update(selectedGame.id || selectedGame._id || "", data);
      await fetchGames(search);
      setSelectedGame(undefined);
      setModalOpen(false);
      toast.success("Game updated successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update game");
    }
  };

  const handleDelete = async () => {
    if (!selectedGame) return;
    try {
      await gamesApi.delete(selectedGame.id || selectedGame._id || "");
      await fetchGames(search);
      setSelectedGame(undefined);
      setDeleteOpen(false);
      toast.success("Game deleted successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to delete game");
    }
  };

  return (
    <div>
      <PageHeader
        title="Games"
        description="Manage available games"
        action={
          <Button
            onClick={() => {
              setSelectedGame(undefined);
              setModalOpen(true);
            }}
          >
            <Plus size={17} />
            Add Game
          </Button>
        }
      />

      <div className="mb-6">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search games..."
        />
      </div>

      {loading ? (
        <p className="text-slate-400 py-4">Searching games...</p>
      ) : filteredGames.length === 0 ? (
        <p className="text-slate-400 py-4">No games found for "{search}"</p>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard
              key={game.id || game._id}
              game={game}
              onEdit={handleEdit}
              onDelete={(game) => {
                setSelectedGame(game);
                setDeleteOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedGame(undefined);
        }}
        title={
          selectedGame
            ? "Edit Game"
            : "Add Game"
        }
      >
        <GameForm
          game={selectedGame}
          onSubmit={
            selectedGame
              ? handleUpdate
              : handleCreate
          }
          onCancel={() => {
            setModalOpen(false);
            setSelectedGame(undefined);
          }}
        />
      </Modal>

      <ConfirmDialog
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Game"
        message="Are you sure you want to delete this game?"
        confirmText="Delete"
      />
    </div>
  );
}