import PageHeader from "@/components/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import CreateUserForm from "./create-user-form";
import DeleteUserForm from "./delete-user-form";

export default async function UsersPage() {
  const [users, stocks] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { shares: true },
    }),
    prisma.stock.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader eyebrow="Participants" title="Users" />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <CreateUserForm stocks={stocks} />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Shares</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <Link
                    href={`/users/${user.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {user.name}
                  </Link>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {user.cash.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {user.shares.length}
                </TableCell>
                <TableCell className="text-right">
                  <DeleteUserForm userId={user.id} />
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
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
