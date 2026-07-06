import { prisma } from "@/lib/prisma";
import { createStock, deleteStock } from "@/app/actions";

export default async function StocksPage() {
  const stocks = await prisma.stock.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { transactions: true, shares: true } } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Stocks</h1>

      {/* Create form */}
      <form
        action={async (formData: FormData) => {
          "use server";
          const name = formData.get("name") as string;
          if (name) {
            await createStock(name);
          }
        }}
        className="mb-6 flex gap-3 items-end rounded-lg border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">
            Stock Name / Symbol
          </label>
          <input
            name="name"
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            placeholder="e.g. AAPL, Gold, BTC"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add Stock
        </button>
      </form>

      {/* Stocks table */}
      <div className="rounded-lg border bg-white dark:bg-zinc-900 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b dark:border-zinc-800">
              <th className="text-left px-4 py-3 font-medium text-zinc-500">
                Name
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Holders
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Transactions
              </th>
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {stocks.map((stock) => (
              <tr
                key={stock.id}
                className="border-b last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3 font-medium">{stock.name}</td>
                <td className="text-right px-4 py-3">{stock._count.shares}</td>
                <td className="text-right px-4 py-3">
                  {stock._count.transactions}
                </td>
                <td className="text-right px-4 py-3">
                  <form action={async () => {
                    "use server";
                    await deleteStock(stock.id);
                  }} className="inline">
                    <button
                      type="submit"
                      className="text-red-600 hover:underline text-sm"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {stocks.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center py-8 text-zinc-400">
                  No stocks yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
