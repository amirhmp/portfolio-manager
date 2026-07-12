import PageHeader from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      <PageHeader eyebrow="Overview" title="Dashboard" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              {users.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Total Initial Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-primary">
              {totalCapital.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Total Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              {totalCash.toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead className="text-right">Initial Capital</TableHead>
              <TableHead className="text-right">Cash</TableHead>
              <TableHead className="text-right">Shares</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <a
                    href={`/users/${user.id}`}
                    className="text-foreground hover:text-primary transition-colors"
                  >
                    {user.name}
                  </a>
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {user.initialCapital.toLocaleString()}
                </TableCell>
                <TableCell className="text-right font-mono tabular-nums">
                  {user.cash.toLocaleString()}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {user.shares.length}
                  {user.shares.length === 1 ? "stock" : "stocks"}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground"
                >
                  No users yet.
                  <Link
                    href="/users"
                    className="text-primary underline underline-offset-4"
                  >
                    Create one
                  </Link>
                  .
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
