import { NewGroupForm } from "./NewGroupForm";

export const metadata = { title: "New group" };

export default function NewGroupPage() {
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Create a group</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
          Group expenses together — a trip, your apartment, or your dinner crew.
        </p>
      </div>
      <NewGroupForm />
    </div>
  );
}
