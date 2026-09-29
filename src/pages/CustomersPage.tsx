import { useState, useEffect } from "react";
import { User, Clock, CreditCard, Monitor, ChevronRight, X } from "lucide-react";
import { bookingsApi } from "../services/api";
import SearchBar from "../components/common/SearchBar";
import Badge from "../components/ui/Badge";
import { toast } from "react-hot-toast";

// ── Types ──────────────────────────────────────────────────────────────────────
interface CustomerRecord {
  key: string;           // unique identifier
  name: string;
  contact: string;
  isGuest: boolean;
  userId?: string;
  totalBookings: number;
  totalSpent: number;
  lastVisit: string;
  bookings: any[];
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
  useEffect(() => {
    const load = async () => {
      try {
        const res = await bookingsApi.getAll({ limit: 1000 } as any);
        const bookings: any[] = res.data || [];

        const map = new Map<string, CustomerRecord>();

        bookings.forEach((b) => {
          // Determine customer key + name
          const userId   = b.user?._id || b.user?.id || b.userId || null;
          const name     = b.guestName || b.user?.name || b.userName || "Guest";
          const contact  = b.contactNumber || b.user?.phone || b.user?.email || "—";
          const isGuest  = !userId;
          const key      = userId ?? `guest::${name}::${contact}`;

          if (!map.has(key)) {
            map.set(key, {
              key, name, contact, isGuest, userId,
              totalBookings: 0,
              totalSpent: 0,
              lastVisit: b.startTime,
              bookings: [],
            });
          }

          const c = map.get(key)!;
          c.totalBookings += 1;
          c.totalSpent    += Number(b.amount) || 0;
          if (new Date(b.startTime) > new Date(c.lastVisit)) {
            c.lastVisit = b.startTime;
          }
          c.bookings.push(b);
        });

        // Sort each customer's bookings newest first
        const list = Array.from(map.values()).map((c) => ({
          ...c,
          bookings: c.bookings.sort(
            (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          ),
        }));

        // Sort customers by last visit newest first
        list.sort((a, b) => new Date(b.lastVisit).getTime() - new Date(a.lastVisit).getTime());
        setCustomers(list);
      } catch (err) {
        toast.error("Failed to load customers");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

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
          color="text-purple-400"
        />
        <StatCard
          label="Walk-in Guests"
          value={customers.filter((c) => c.isGuest).length}
          color="text-blue-400"
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
              className="flex w-full items-center justify-between rounded-2xl border border-[#273449] bg-[#151C2C] px-5 py-4 text-left transition hover:border-[#7C3AED]/60 hover:bg-[#1B2435]"
            >
              {/* Left */}
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-500/10">
                  <User size={20} className="text-purple-400" />
                </div>

                <div className="text-left">
                  <p className="font-semibold text-white">{c.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{c.contact}</p>
                </div>
              </div>

              {/* Right */}
              <div className="flex items-center gap-6">
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
        <HistoryModal customer={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// ── History Modal ──────────────────────────────────────────────────────────────
function HistoryModal({
  customer,
  onClose,
}: {
  customer: CustomerRecord;
  onClose: () => void;
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-[#0B0F19] shadow-2xl">
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#273449] bg-[#0B0F19] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10">
              <User size={18} className="text-purple-400" />
            </div>
            <div>
              <p className="font-semibold text-white">{customer.name}</p>
              <p className="text-xs text-slate-500">{customer.contact}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-[#151C2C] hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-3 p-6">
          <MiniCard
            icon={<Clock size={16} className="text-purple-400" />}
            label="Bookings"
            value={String(customer.totalBookings)}
          />
          <MiniCard
            icon={<CreditCard size={16} className="text-green-400" />}
            label="Total Spent"
            value={`Rs. ${customer.totalSpent.toLocaleString()}`}
          />
          <MiniCard
            icon={<Monitor size={16} className="text-blue-400" />}
            label="Type"
            value={customer.isGuest ? "Guest" : "Member"}
          />
        </div>

        {/* Booking history */}
        <div className="px-6 pb-8">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Booking History
          </h3>

          {customer.bookings.length === 0 ? (
            <p className="text-slate-500">No bookings found.</p>
          ) : (
            <div className="space-y-3">
              {customer.bookings.map((b: any, i: number) => (
                <div
                  key={b._id || b.id || i}
                  className="rounded-xl border border-[#273449] bg-[#151C2C] p-4"
                >
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {b.station?.name || b.stationName || "Unknown Station"}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {b.game?.name || b.gameName || "No game selected"}
                      </p>
                    </div>
                    <Badge variant={statusVariant(b.status)}>
                      {b.status}
                    </Badge>
                  </div>

                  {/* Details */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-500">Start </span>
                      <span className="text-slate-300">{formatDate(b.startTime)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">End </span>
                      <span className="text-slate-300">{formatDate(b.endTime)}</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="mt-3 flex items-center justify-between border-t border-[#273449] pt-3">
                    <span className="text-xs text-slate-500">Amount</span>
                    <span className="text-sm font-bold text-white">
                      Rs. {Number(b.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
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
