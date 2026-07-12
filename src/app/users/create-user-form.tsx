"use client";

import { PriceInput } from "@/components/price/PriceInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useSubmitForm from "@/hooks/useSubmitForm";
import { createUser as createUserAction } from "../actions";

const CreateUserForm = () => {
  const { isPending, request: createUser } = useSubmitForm(createUserAction);

  const handleCreate = (formData: FormData) => {
    const name = formData.get("name") as string;
    const capital = parseFloat((formData.get("capital") as string) || "0");
    if (name && !isNaN(capital)) {
      createUser(name, capital);
    }
  };

  return (
    <form action={handleCreate} className="flex gap-3 items-end">
      <div className="flex-1">
        <Label htmlFor="name" className="mb-1.5">
          Name
        </Label>
        <Input id="name" name="name" required placeholder="User name" />
      </div>
      <div className="w-40">
        <Label htmlFor="capital" className="mb-1.5">
          Initial Capital
        </Label>
        <PriceInput
          id="capital"
          name="capital"
          min={0}
          step="any"
          placeholder="0"
        />
      </div>
      <Button type="submit" loading={isPending}>
        Add User
      </Button>
    </form>
  );
};

export default CreateUserForm;
