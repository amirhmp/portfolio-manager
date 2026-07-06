import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Initial Capital
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {user.initialCapital.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Cash
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {user.cash.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">
              Shares
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">
              {user.shares.length}{" "}
              {user.shares.length === 1 ? "stock" : "stocks"}
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-lg font-semibold mb-3">Portfolio</h2>
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
                  <TableCell className="text-right">
                    {share.count.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            {user.shares.filter((s) => s.count > 0).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={2}
                  className="text-center py-6 text-muted-foreground"
                >
                  No shares held.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <h2 className="text-lg font-semibold mb-3">Transaction History</h2>
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Count</TableHead>
              <TableHead className="text-right">Unit Price</TableHead>
              <TableHead className="text-right">Real Price</TableHead>
              <TableHead className="text-right">Total Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {user.transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  {new Date(tx.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>{tx.stock.name}</TableCell>
                <TableCell>
                  <Badge variant={tx.type === "buy" ? "default" : "destructive"}>
                    {tx.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  {tx.count.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {tx.unitPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {tx.realPrice.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {tx.totalCost.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
            {user.transactions.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-6 text-muted-foreground"
                >
                  No transactions yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
