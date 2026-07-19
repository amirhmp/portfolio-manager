"use client";

import { Button } from "@/components/ui/button";
import useSubmitForm from "@/hooks/useSubmitForm";
import { useTranslations } from "next-intl";
import { deleteUser as deleteUserAction } from "@/app/actions";

function DeleteUserForm({ userId }: { userId: number }) {
  const t = useTranslations("DeleteButton");
  const { isPending, request: deleteUser } = useSubmitForm(deleteUserAction);

  const handleDelete = () => {
    deleteUser(userId);
  };

  return (
    <form action={handleDelete} className="inline">
      <Button variant="ghost" size="sm" type="submit" loading={isPending}>
        {t("delete")}
      </Button>
    </form>
  );
}

export default DeleteUserForm;
