export interface UserBalance {
  userId: string
  name: string
  avatarUrl: string | null
  netBalance: number
}

export interface Transaction {
  from: UserBalance
  to: UserBalance
  amount: number
}

/**
 * Optimizes debt settlement using the greedy algorithm:
 * 1. Calculate net balances for all users
 * 2. Separate into debtors (negative) and creditors (positive)
 * 3. Greedily match largest debtor to largest creditor
 */
export function optimizeSettlements(balances: UserBalance[]): Transaction[] {
  const transactions: Transaction[] = []

  const debtors = balances
    .filter((b) => b.netBalance < -0.01)
    .map((b) => ({ ...b, netBalance: b.netBalance }))
    .sort((a, b) => a.netBalance - b.netBalance) // most negative first

  const creditors = balances
    .filter((b) => b.netBalance > 0.01)
    .map((b) => ({ ...b, netBalance: b.netBalance }))
    .sort((a, b) => b.netBalance - a.netBalance) // most positive first

  let di = 0
  let ci = 0

  while (di < debtors.length && ci < creditors.length) {
    const debtor = debtors[di]
    const creditor = creditors[ci]

    const amount = Math.min(Math.abs(debtor.netBalance), creditor.netBalance)
    const roundedAmount = Math.round(amount * 100) / 100

    if (roundedAmount > 0.01) {
      transactions.push({
        from: { ...debtor },
        to: { ...creditor },
        amount: roundedAmount,
      })
    }

    debtor.netBalance += amount
    creditor.netBalance -= amount

    if (Math.abs(debtor.netBalance) < 0.01) di++
    if (Math.abs(creditor.netBalance) < 0.01) ci++
  }

  return transactions
}

export function calculateNetBalances(
  members: Array<{ userId: string; name: string; avatarUrl: string | null }>,
  expenses: Array<{
    payer_id: string
    amount: number
    splits: Array<{ user_id: string; amount_owed: number }>
  }>,
  settlements: Array<{ from_user_id: string; to_user_id: string; amount: number }>
): UserBalance[] {
  const balanceMap = new Map<string, number>()

  members.forEach((m) => balanceMap.set(m.userId, 0))

  expenses.forEach((expense) => {
    const current = balanceMap.get(expense.payer_id) || 0
    balanceMap.set(expense.payer_id, current + expense.amount)

    expense.splits.forEach((split) => {
      const userBalance = balanceMap.get(split.user_id) || 0
      balanceMap.set(split.user_id, userBalance - split.amount_owed)
    })
  })

  // Apply settlements
  settlements.forEach((settlement) => {
    const fromBalance = balanceMap.get(settlement.from_user_id) || 0
    const toBalance = balanceMap.get(settlement.to_user_id) || 0
    balanceMap.set(settlement.from_user_id, fromBalance - settlement.amount)
    balanceMap.set(settlement.to_user_id, toBalance + settlement.amount)
  })

  return members.map((m) => ({
    userId: m.userId,
    name: m.name,
    avatarUrl: m.avatarUrl,
    netBalance: Math.round((balanceMap.get(m.userId) || 0) * 100) / 100,
  }))
}
