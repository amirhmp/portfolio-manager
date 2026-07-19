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
import { Link } from "@/i18n/navigation";
import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";
import CreateUserForm from "./create-user-form";
import DeleteUserForm from "./delete-user-form";

export default async function UsersPage() {
  const t = await getTranslations("Users");
  const [users, stocks] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: { shares: true },
    }),
    prisma.stock.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader eyebrow={t("eyebrow")} title={t("title")} />
      <Card className="mb-6">
        <CardContent className="pt-6">
          <CreateUserForm stocks={stocks} />
        </CardContent>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("name")}</TableHead>
              <TableHead className="text-right">{t("cash")}</TableHead>
              <TableHead className="text-right">{t("shares")}</TableHead>
              <TableHead className="text-right">{t("actions")}</TableHead>
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
                  {t("noUsersYet")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
