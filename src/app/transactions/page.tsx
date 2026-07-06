import { prisma } from "@/lib/prisma";

export default async function TransactionsPage() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, stock: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Transaction History</h1>

      <div className="rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-zinc-800">
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                Date
              </th>
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                User
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
                Commission
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
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="border-b last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3">
                  {new Date(tx.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <a
                    href={`/users/${tx.userId}`}
                    className="hover:underline text-blue-600 dark:text-blue-400"
                  >
                    {tx.user.name}
                  </a>
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
                <td className="text-right px-4 py-3">{tx.commission}%</td>
                <td className="text-right px-4 py-3">
                  {tx.realPrice.toLocaleString()}
                </td>
                <td className="text-right px-4 py-3">
                  {tx.totalCost.toLocaleString()}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-8 text-zinc-400">
                  No transactions yet.{" "}
                  <a href="/transactions/new" className="underline">
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
