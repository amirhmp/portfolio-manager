import { PriceLabel } from "@/components/price/PriceLabel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import UserTransactionsTable from "@/components/user-transactions-table";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import ExitUserCashForm from "./exit-user-cash-form";
import IncreaseCapitalForm from "./increase-capital-form";

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
        include: { transactionGroup: { include: { stock: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return notFound();

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1.5 font-mono text-[0.7rem] font-medium uppercase tracking-[0.16em] text-primary/80">
          Participant
        </p>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
          {user.name}
        </h1>
        <div className="mt-3 ledger-rule" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-primary">
              <PriceLabel value={user.cash} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="font-mono text-[0.7rem] font-medium uppercase tracking-wide text-muted-foreground">
              Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-medium tabular-nums text-foreground">
              {user.shares.length}{" "}
              <span className="text-lg text-muted-foreground">
                {user.shares.length === 1 ? "stock" : "stocks"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Increase Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncreaseCapitalForm userId={user.id} />
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              Logged as a capital-increased transaction.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Save Profit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ExitUserCashForm userId={user.id} maxAmount={user.cash} />
            <p className="mt-2 text-[0.65rem] text-muted-foreground">
              Logged as a cash-exited transaction. Decreases cash on hand.
            </p>
          </CardContent>
        </Card>
      </div>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        Portfolio
      </h2>
      <Card className="mb-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Stock</TableHead>
              <TableHead className="text-right">Count</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.shares
              .filter((s) => s.count > 0)
              .map((share) => (
                <TableRow key={share.id}>
                  <TableCell className="font-medium">
                    {share.stock.name}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">
                    {share.count.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            {user.shares.filter((s) => s.count > 0).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-8 text-muted-foreground"
                >
                  No shares held.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <h2 className="mb-3 font-serif text-lg font-medium text-foreground">
        Transaction History
      </h2>
      <Card>
        <div className="px-4">
          <UserTransactionsTable transactions={user.transactions} />
        </div>
      </Card>
    </div>
  );
}
