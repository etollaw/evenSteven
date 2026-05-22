import { Avatar } from "@/components/ui/Avatar";
import { categoryFor, formatMoney, relativeDate } from "@/lib/utils";

type Props = {
  description: string;
  category: string;
  currency: string;
  amount: number;
  payerName: string;
  payerId: string;
  payerAvatar?: string | null;
  occurredAt: string;
  participantCount: number;
  yourShare: number;
  isYouPayer: boolean;
};

export function ExpenseRow({
  description,
  category,
  currency,
  amount,
  payerName,
  payerId,
  payerAvatar,
  occurredAt,
  participantCount,
  yourShare,
  isYouPayer,
}: Props) {
  const cat = categoryFor(category);
  const youOwedDelta = isYouPayer ? amount - yourShare : -yourShare;

  return (
    <div className="flex w-full items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--muted)] text-lg">
          {cat.emoji}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{description}</p>
          <p className="flex items-center gap-1 truncate text-xs text-[color:var(--muted-foreground)]">
            <Avatar id={payerId} name={payerName} src={payerAvatar ?? undefined} size={14} />
            <span className="truncate">{isYouPayer ? "You paid" : `${payerName} paid`}</span>
            <span aria-hidden>·</span>
            <span>{participantCount} {participantCount === 1 ? "person" : "people"}</span>
            <span aria-hidden>·</span>
            <span>{relativeDate(occurredAt)}</span>
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-semibold tabular-nums">{formatMoney(amount, currency)}</p>
        <p
          className={`text-xs font-medium tabular-nums ${
            Math.abs(youOwedDelta) < 0.005
              ? "text-[color:var(--muted-foreground)]"
              : youOwedDelta > 0
                ? "text-[color:var(--success)]"
                : "text-[color:var(--destructive)]"
          }`}
        >
          {Math.abs(youOwedDelta) < 0.005
            ? "no impact"
            : youOwedDelta > 0
              ? `you lent ${formatMoney(youOwedDelta, currency)}`
              : `you owe ${formatMoney(Math.abs(youOwedDelta), currency)}`}
        </p>
      </div>
    </div>
  );
}
