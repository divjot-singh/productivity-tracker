import Link from "next/link";

const items = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Today's Entry",
    href: "/today",
  },
  {
    title: "Daily Logs",
    href: "/logs",
  },
  {
    title: "Settings",
    href: "/settings",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950">
      <div className="border-b border-zinc-800 p-6">
        <h2 className="font-semibold">Productivity Tracker</h2>
      </div>

      <nav className="space-y-2 p-4">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="hover:bg-card text-muted-foreground block rounded-lg px-3 py-2 text-sm transition hover:text-white"
          >
            {item.title}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
