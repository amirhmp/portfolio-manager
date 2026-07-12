"use client";

import { Button } from "@/components/ui/button";
import useSubmitForm from "@/hooks/useSubmitForm";
import { deleteUser as deleteUserAction } from "../actions";

function DeleteUserForm({ userId }: { userId: number }) {
  const { isPending, request: deleteUser } = useSubmitForm(deleteUserAction);

  const handleDelete = () => {
    deleteUser(userId);
  };
  
  return (
    <form action={handleDelete} className="inline">
      <Button variant="ghost" size="sm" type="submit" loading={isPending}>
        Delete
      </Button>
    </form>
  );
}

export default DeleteUserForm;
