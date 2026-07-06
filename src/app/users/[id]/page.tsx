import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = parseInt(id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      shares: { include: { stock: true } },
      transactions: {
        include: { stock: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return notFound();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{user.name}</h1>

      {/* User info */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">Initial Capital</div>
          <div className="text-2xl font-semibold mt-1">
            {user.initialCapital.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">Cash</div>
          <div className="text-2xl font-semibold mt-1">
            {user.cash.toLocaleString()}
          </div>
        </div>
        <div className="rounded-lg border bg-white p-5 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="text-sm text-zinc-500">Shares</div>
          <div className="text-2xl font-semibold mt-1">
            {user.shares.length}{" "}
            {user.shares.length === 1 ? "stock" : "stocks"}
          </div>
        </div>
      </div>

      {/* Portfolio */}
      <h2 className="text-lg font-semibold mb-3">Portfolio</h2>
      <div className="rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800 mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-zinc-800">
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                Stock
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {user.shares
              .filter((s) => s.count > 0)
              .map((share) => (
                <tr
                  key={share.id}
                  className="border-b last:border-0 dark:border-zinc-800"
                >
                  <td className="px-4 py-3 font-medium">
                    {share.stock.name}
                  </td>
                  <td className="text-right px-4 py-3">
                    {share.count.toLocaleString()}
                  </td>
                </tr>
              ))}
            {user.shares.filter((s) => s.count > 0).length === 0 && (
              <tr>
                <td colSpan={2} className="text-center py-6 text-zinc-400">
                  No shares held.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Transaction history */}
      <h2 className="text-lg font-semibold mb-3">Transaction History</h2>
      <div className="rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-zinc-800">
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                Date
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                Stock
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                Type
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Count
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Unit Price
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Real Price
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Total Cost
              </th>
            </tr>
          </thead>
          <tbody>
            {user.transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">{tx.stock.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                      tx.type === "buy"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                    }`}
                  >
                    {tx.type.toUpperCase()}
                  </span>
                </td>
                <td className="text-right px-4 py-3">
                  {tx.count.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3">
                  {tx.unitPrice.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3">
                  {tx.realPrice.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3">
                  {tx.totalCost.toLocaleString()}
                </td>
              </tr>
            ))}
            {user.transactions.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-6 text-zinc-400">
                  No transactions yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
