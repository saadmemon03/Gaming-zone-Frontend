import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PageHeader from "../components/common/PageHeader";
import SearchBar from "../components/common/SearchBar";
import Table, { type TableColumn } from "../components/ui/Table";
import Badge from "../components/ui/Badge";
import type { User } from "../types/user";
import { usersApi } from "../services/api";
import { Trash2, Edit } from "lucide-react";

import { toast } from "react-hot-toast";

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: usersData, isLoading: loading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        const res = await usersApi.getAll();
        return res.data || [];
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch users");
        throw err;
      }
    }
  });

  const users = usersData || [];

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await usersApi.delete(id);
        toast.success("User deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } catch (err) {
        console.error(err);
        toast.error("Failed to delete user");
      }
    }
  };

  const handleEdit = async (user: User) => {
    const newRole = window.prompt("Enter new role (admin, manager, staff, user):", user.role);
    if (newRole && ["admin", "manager", "staff", "user"].includes(newRole)) {
      try {
        await usersApi.update((user.id || user._id) as string, { role: newRole });
        toast.success("User role updated successfully");
        queryClient.invalidateQueries({ queryKey: ["users"] });
      } catch (err) {
        console.error(err);
        toast.error("Failed to update role");
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q) ||
      (u.role || "").toLowerCase().includes(q)
    );
  });

  const columns: TableColumn<User>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => user.name,
    },
    {
      key: "email",
      header: "Email",
      render: (user) => user.email,
    },
    {
      key: "role",
      header: "Role",
      render: (user) => (
        <Badge variant="info">
          {user.role}
        </Badge>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (user) => (
        <Badge variant={user.isActive ? "success" : "danger"}>
          {user.isActive ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className="flex gap-2">
          <button onClick={() => handleEdit(user)} className="text-rose-300 hover:text-rose-200 p-1">
            <Edit size={16} />
          </button>
          <button onClick={() => handleDelete((user.id || user._id) as string)} className="text-red-400 hover:text-red-300 p-1">
            <Trash2 size={16} />
          </button>
        </div>
      ),
    }
  ];

  return (
    <div>
      <PageHeader
        title="Users"
        description="Manage registered users"
      />

      <div className="mb-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email, role..."
        />
      </div>

      {loading ? (
        <p className="text-white mt-4">Loading users...</p>
      ) : (
        <Table
          columns={columns}
          data={filteredUsers}
          rowKey={(user) => (user.id || user._id) as string}
          emptyMessage="No users found."
        />
      )}
    </div>
  );
}
