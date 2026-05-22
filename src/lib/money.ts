export function toCents(value: number | string | null | undefined) {
  const numeric = typeof value === "string" ? Number.parseFloat(value) : value ?? 0;
  return Math.round(numeric * 100);
}

export function fromCents(cents: number) {
  return Math.round(cents) / 100;
}

export function formatMoney(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(amount);
}

export function splitEvenly(total: number, participantIds: string[]) {
  const totalCents = toCents(total);
  const base = Math.floor(totalCents / participantIds.length);
  let remainder = totalCents - base * participantIds.length;

  return participantIds.map((userId) => {
    const extraCent = remainder > 0 ? 1 : 0;
    remainder -= extraCent;

    return {
      user_id: userId,
      amount_owed: fromCents(base + extraCent)
    };
  });
}
