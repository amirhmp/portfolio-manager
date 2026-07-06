import { prisma } from "@/lib/prisma";
import { createTransaction } from "@/app/actions";
import { redirect } from "next/navigation";

export default async function NewTransactionPage() {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const stocks = await prisma.stock.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">New Transaction</h1>

      <form
        action={async (formData: FormData) => {
          "use server";
          const userIds = formData
            .getAll("users")
            .map((v) => parseInt(v as string));
          const stockId = parseInt(formData.get("stock") as string);
          const type = formData.get("type") as "buy" | "sell";
          const count = parseFloat(formData.get("count") as string);
          const unitPrice = parseFloat(formData.get("unitPrice") as string);
          const commission = parseFloat(
            (formData.get("commission") as string) || "0",
          );

          if (userIds.length > 0 && stockId && count > 0 && unitPrice > 0) {
            await createTransaction(
              userIds,
              stockId,
              count,
              type,
              unitPrice,
              commission,
            );
            redirect("/transactions");
          }
        }}
        className="max-w-xl space-y-5 rounded-lg border bg-white p-6 dark:bg-zinc-900 dark:border-zinc-800"
      >
        {/* Users multi-select */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Participating Users
          </label>
          <div className="space-y-2 rounded-md border p-3 max-h-48 overflow-y-auto">
            {users.map((user) => (
              <label key={user.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="users"
                  value={user.id}
                  className="rounded"
                />
                {user.name} (Capital: {user.initialCapital.toLocaleString()})
              </label>
            ))}
            {users.length === 0 && (
              <p className="text-zinc-400 text-sm">
                No users.{" "}
                <a href="/users" className="underline">
                  Create one first
                </a>
                .
              </p>
            )}
          </div>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm font-medium mb-1">Stock</label>
          <select
            name="stock"
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
          >
            <option value="">Select a stock</option>
            {stocks.map((stock) => (
              <option key={stock.id} value={stock.id}>
                {stock.name}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Type</label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="type" value="buy" defaultChecked />
              <span className="text-green-700 dark:text-green-400 font-medium">
                Buy
              </span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="type" value="sell" />
              <span className="text-red-700 dark:text-red-400 font-medium">
                Sell
              </span>
            </label>
          </div>
        </div>

        {/* Count + Price + Commission */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">
              Total Count
            </label>
            <input
              name="count"
              type="number"
              required
              min="0"
              step="any"
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Unit Price
            </label>
            <input
              name="unitPrice"
              type="number"
              required
              min="0"
              step="any"
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Commission %
            </label>
            <input
              name="commission"
              type="number"
              min="0"
              step="any"
              className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
              placeholder="0"
              defaultValue="0"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Submit Transaction
        </button>
      </form>
    </div>
  );
}
