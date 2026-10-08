import { useState, useEffect, useCallback } from "react";
import { User, Clock, CreditCard, Monitor, ChevronRight, X, Pencil, Trash2, Save } from "lucide-react";
import { bookingsApi, usersApi } from "../services/api";
import SearchBar from "../components/common/SearchBar";
import Badge from "../components/ui/Badge";
import type { Booking } from "../types/booking";
import { toast } from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────────
interface CustomerRecord {
  key: string;           // unique identifier
  name: string;
  contact: string;
  contactNumber: string;
  isGuest: boolean;
  userId?: string;
  guestName: string;
  guestContact: string | null;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  bookings: Booking[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-PK", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function statusVariant(status: string) {
  if (status === "Confirmed" || status === "Completed") return "success";
  if (status === "Pending")   return "warning";
  if (status === "Cancelled") return "danger";
  return "info";
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function CustomersPage() {
  const [customers, setCustomers]     = useState<CustomerRecord[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [selected, setSelected]       = useState<CustomerRecord | null>(null);

  // ── Fetch all bookings and group by customer ───────────────────────────────
  const loadCustomers = useCallback(async () => {
    try {
      const res = await bookingsApi.getAll({ limit: 1000 });
      const map = new Map<string, CustomerRecord>();

      (res.data || []).forEach((booking) => {
        if (booking.isCustomerDeleted || booking.user?.isActive === false) return;

        const userId = booking.user?._id || booking.user?.id || booking.userId;
        const isGuest = !userId;
        const guestName = booking.guestName || booking.userName || "Guest";
        const guestContact = booking.contactNumber ?? null;
        const name = isGuest
          ? guestName
          : booking.user?.name || booking.userName || "Member";
        const contactNumber = isGuest
          ? booking.contactNumber || ""
          : booking.user?.phone || booking.contactNumber || "";
        const contact = contactNumber || (!isGuest ? booking.user?.email || "—" : "—");
        const key = userId ?? `guest::${guestName}::${guestContact ?? ""}`;

        if (!map.has(key)) {
          map.set(key, {
            key,
            name,
            contact,
            contactNumber,
            isGuest,
            userId,
            guestName,
            guestContact,
            totalBookings: 0,
            totalSpent: 0,
            lastVisit: booking.startTime,
            bookings: [],
          });
        }

        const customer = map.get(key)!;
        customer.totalBookings += 1;
        customer.totalSpent += Number(booking.amount) || 0;
        if (new Date(booking.startTime) > new Date(customer.lastVisit)) {
          customer.lastVisit = booking.startTime;
        }
        customer.bookings.push(booking);
      });

      const list = Array.from(map.values()).map((customer) => ({
        ...customer,
        bookings: customer.bookings.sort(
          (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        ),
      }));
      list.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
      setCustomers(list);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCustomers();
  }, [loadCustomers]);

  const handleUpdate = async (customer: CustomerRecord, name: string, contact: string) => {
    try {
      if (customer.isGuest) {
        await bookingsApi.updateGuestCustomer({
          currentName: customer.guestName,
          currentContact: customer.guestContact,
          name,
          contact,
        });
      } else if (customer.userId) {
        await usersApi.updateCustomer(customer.userId, { name, phone: contact });
      } else {
        throw new Error("Customer account could not be identified.");
      }

      toast.success("Customer details updated.");
      setSelected(null);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to update customer.");
    }
  };

  const handleDelete = async (customer: CustomerRecord) => {
    if (!window.confirm(`Archive ${customer.name}? Their booking history will be retained.`)) return;

    try {
      if (customer.isGuest) {
        await bookingsApi.deleteGuestCustomer({
          name: customer.guestName,
          contact: customer.guestContact,
        });
      } else if (customer.userId) {
        await usersApi.archiveCustomer(customer.userId);
      } else {
        throw new Error("Customer account could not be identified.");
      }

      toast.success("Customer archived. Booking history has been retained.");
      setSelected(null);
      await loadCustomers();
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to archive customer.");
    }
  };

  // ── Filter ────────────────────────────────────────────────────────────────
  const filtered = customers.filter((c) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.contact.toLowerCase().includes(q)
    );
  });

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Customers</h1>
        <p className="mt-1 text-sm text-slate-500">
          All customers with their booking history
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Customers" value={customers.length} />
        <StatCard
          label="Registered"
          value={customers.filter((c) => !c.isGuest).length}
          color="text-indigo-300"
        />
        <StatCard
          label="Walk-in Guests"
          value={customers.filter((c) => c.isGuest).length}
          color="text-rose-300"
        />
      </div>

      {/* Search */}
      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search by name or contact..."
      />

      {/* List */}
      {loading ? (
        <p className="text-slate-400">Loading customers...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-400">No customers found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <button
              key={c.key}
              onClick={() => setSelected(c)}
              className="flex w-full min-w-0 items-center justify-between gap-2 rounded-2xl border border-[#273449] bg-[#151C2C] px-3 py-4 text-left transition hover:border-[#7C3AED]/60 hover:bg-[#1B2435] sm:gap-4 sm:px-5"
            >
              {/* Left */}
              <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10">
                  <User size={20} className="text-indigo-300" />
                </div>

                <div className="min-w-0 text-left">
                  <p className="truncate font-semibold text-white">{c.name}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{c.contact}</p>
                </div>
              </div>

              {/* Right */}
              <div className="flex shrink-0 items-center gap-2 sm:gap-6">
                {/* Bookings count */}
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-white">{c.totalBookings}</p>
                  <p className="text-xs text-slate-500">Bookings</p>
                </div>

                {/* Total spent */}
                <div className="hidden text-right sm:block">
                  <p className="text-sm font-semibold text-white">Rs. {c.totalSpent.toLocaleString()}</p>
                  <p className="text-xs text-slate-500">Total Spent</p>
                </div>

                {/* Badge */}
                <Badge variant={c.isGuest ? "info" : "success"}>
                  {c.isGuest ? "Guest" : "Member"}
                </Badge>

                <ChevronRight size={16} className="text-slate-600" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* History Modal */}
      {selected && (
        <HistoryModal
          customer={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

// ── History Modal ──────────────────────────────────────────────────────────────
function HistoryModal({
  customer,
  onClose,
  onUpdate,
  onDelete,
}: {
  customer: CustomerRecord;
  onClose: () => void;
  onUpdate: (customer: CustomerRecord, name: string, contact: string) => Promise<void>;
  onDelete: (customer: CustomerRecord) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(customer.name);
  const [contact, setContact] = useState(customer.contactNumber);
  const [saving, setSaving] = useState(false);

  const saveCustomer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim() || !contact.trim()) {
      toast.error("Name and contact number are required.");
      return;
    }

    setSaving(true);
    try {
      await onUpdate(customer, name.trim(), contact.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-label={`${customer.name} booking history`}
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-lg flex-col overflow-y-auto bg-[#1f2335] shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-[#273449] bg-[#1f2335] px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-400/10">
              <User size={18} className="text-indigo-300" />
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{customer.name}</p>
              <p className="truncate text-xs text-slate-500">{customer.contact}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close customer details"
            className="shrink-0 rounded-lg p-2 text-slate-400 hover:bg-[#151C2C] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-3 sm:p-6">
          <MiniCard
            icon={<Clock size={16} className="text-indigo-300" />}
            label="Bookings"
            value={String(customer.totalBookings)}
          />
          <MiniCard
            icon={<CreditCard size={16} className="text-green-400" />}
            label="Total Spent"
            value={`Rs. ${customer.totalSpent.toLocaleString()}`}
          />
          <MiniCard
            icon={<Monitor size={16} className="text-rose-300" />}
            label="Type"
            value={customer.isGuest ? "Guest" : "Member"}
          />
        </div>

        <div className="px-4 pb-6 sm:px-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
              Booking History
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditing((value) => !value)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-indigo-400/30 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-400/10"
              >
                <Pencil size={15} />
                {editing ? "Cancel edit" : "Edit"}
              </button>
              <button
                type="button"
                onClick={() => void onDelete(customer)}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-rose-400/30 px-3 py-2 text-sm font-medium text-rose-300 transition hover:bg-rose-400/10"
              >
                <Trash2 size={15} />
                Archive
              </button>
            </div>
          </div>

          {editing && (
            <form onSubmit={saveCustomer} className="mb-6 space-y-4 rounded-xl border border-[#273449] bg-[#151C2C] p-4">
              <label className="block text-sm font-medium text-slate-300">
                Name
                <input
                  autoComplete="name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-[#273449] bg-[#1f2335] px-3 py-2.5 text-base text-white outline-none focus:border-indigo-400"
                />
              </label>
              <label className="block text-sm font-medium text-slate-300">
                Contact Number
                <input
                  type="tel"
                  autoComplete="tel"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  required
                  className="mt-1.5 w-full rounded-lg border border-[#273449] bg-[#1f2335] px-3 py-2.5 text-base text-white outline-none focus:border-indigo-400"
                />
              </label>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />
                {saving ? "Saving..." : "Save changes"}
              </button>
            </form>
          )}

          {customer.bookings.length === 0 ? (
            <p className="text-slate-500">No bookings found.</p>
          ) : (
            <div className="space-y-3">
              {customer.bookings.map((b, i) => (
                <div
                  key={b._id || b.id || i}
                  className="rounded-xl border border-[#273449] bg-[#151C2C] p-4"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-white">
                        {b.station?.name || b.stationName || "Unknown Station"}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-slate-500">
                        {(typeof b.game === "object" ? b.game?.name : undefined) ||
                          b.gameName ||
                          "No game selected"}
                      </p>
                    </div>
                    <span className="shrink-0">
                      <Badge variant={statusVariant(b.status)}>{b.status}</Badge>
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                    <div>
                      <span className="text-slate-500">Start </span>
                      <span className="text-slate-300">{formatDate(b.startTime)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">End </span>
                      <span className="text-slate-300">{formatDate(b.endTime)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-[#273449] pt-3">
                    <span className="text-xs text-slate-500">Amount</span>
                    <span className="text-sm font-bold text-white">
                      Rs. {Number(b.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

// ── Small reusable components ──────────────────────────────────────────────────
function StatCard({
  label,
  value,
  color = "text-white",
}: {
  label: string;
  value: number;
  color?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#273449] bg-[#151C2C] p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function MiniCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-[#273449] bg-[#151C2C] p-3 text-center">
      <div className="mb-1 flex justify-center">{icon}</div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-xs font-semibold text-white">{value}</p>
    </div>
  );
}
