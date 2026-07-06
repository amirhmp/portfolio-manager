import { prisma } from "@/lib/prisma";

export default async function Dashboard() {
  const users = await prisma.user.findMany({
    include: {
      shares: { include: { stock: true } },
    },
  });

  const totalCash = users.reduce((sum, u) => sum + u.cash, 0);
  const totalCapital = users.reduce((sum, u) => sum + u.initialCapital, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">Total Users</div>
          <div className="text-2xl font-semibold mt-1">{users.length}</div>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">Total Initial Capital</div>
          <div className="text-2xl font-semibold mt-1">
            {totalCapital.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">Total Cash</div>
          <div className="text-2xl font-semibold mt-1">
            {totalCash.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-zinc-800">
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                Name
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Initial Capital
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Cash
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Shares
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3 font-medium">
                  <a
                    href={`/users/${user.id}`}
                    className="hover:underline text-blue-600 dark:text-blue-400"
                  >
                    {user.name}
                  </a>
                </td>
                <td className="text-right px-4 py-3">
                  {user.initialCapital.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3">
                  {user.cash.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3">
                  {user.shares.length}{" "}
                  {user.shares.length === 1 ? "stock" : "stocks"}
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-400">
                  No users yet.{" "}
                  <a href="/users" className="underline">
                    Create one
                  </a>
                  .
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
