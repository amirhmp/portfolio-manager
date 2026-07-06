import { prisma } from "@/lib/prisma";
import { createUser, updateUser, deleteUser } from "@/app/actions";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { shares: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      {/* Create form */}
      <form
        action={async (formData: FormData) => {
          "use server";
          const name = formData.get("name") as string;
          const capital = parseFloat(formData.get("capital") as string);
          if (name && !isNaN(capital)) {
            await createUser(name, capital);
          }
        }}
        className="mb-6 flex gap-3 items-end rounded-lg border bg-white p-4 dark:bg-zinc-900 dark:border-zinc-800"
      >
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            name="name"
            required
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            placeholder="User name"
          />
        </div>
        <div className="w-40">
          <label className="block text-sm font-medium mb-1">
            Initial Capital
          </label>
          <input
            name="capital"
            type="number"
            required
            min="0"
            step="any"
            className="w-full rounded-md border px-3 py-2 text-sm bg-transparent"
            placeholder="0"
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add User
        </button>
      </form>

      {/* Users table */}
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
              <th className="text-right px-4 py-3 font-medium text-zinc-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3">
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
                  {user.shares.length}
                </td>
                <td className="text-right px-4 py-3">
                  <form action={async () => {
                    "use server";
                    await deleteUser(user.id);
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
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-zinc-400">
                  No users yet. Create one above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
