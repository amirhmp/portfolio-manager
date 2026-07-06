import { prisma } from "@/lib/prisma";
import { createUser, deleteUser } from "@/app/actions";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { shares: true },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Users</h1>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <form
            action={async (formData: FormData) => {
              "use server";
              const name = formData.get("name") as string;
              const capital = parseFloat(formData.get("capital") as string);
              if (name && !isNaN(capital)) {
                await createUser(name, capital);
              }
            }}
            className="flex gap-3 items-end"
          >
            <div className="flex-1">
              <Label htmlFor="name" className="mb-1.5">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="User name"
              />
            </div>
            <div className="w-40">
              <Label htmlFor="capital" className="mb-1.5">
                Initial Capital
              </Label>
              <Input
                id="capital"
                name="capital"
                type="number"
                required
                min={0}
                step="any"
                placeholder="0"
              />
            </div>
            <Button type="submit">Add User</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Initial Capital</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <a
                    href={`/users/${user.id}`}
                    className="hover:underline text-primary"
                  >
                    {user.name}
                  </a>
                </TableCell>
                <TableCell className="text-right">
                  {user.initialCapital.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {user.cash.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {user.shares.length}
                </TableCell>
                <TableCell className="text-right">
                  <form
                    action={async () => {
                      "use server";
                      await deleteUser(user.id);
                    }}
                    className="inline"
                  >
                    <Button variant="ghost" size="sm" type="submit">
                      Delete
                    </Button>
                  </form>
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  No users yet. Create one above.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
