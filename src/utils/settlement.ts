import type { SettlementTransfer } from '@/types/shared.ts';

export function calculateSettlements(
  expenses: { paidBy: string; amount: number }[],
  memberIds: string[],
  memberNames: Map<string, string>,
): SettlementTransfer[] {
  const totalPaid = new Map<string, number>();
  let grandTotal = 0;

  for (const id of memberIds) {
    totalPaid.set(id, 0);
  }

  for (const exp of expenses) {
    totalPaid.set(exp.paidBy, (totalPaid.get(exp.paidBy) || 0) + exp.amount);
    grandTotal += exp.amount;
  }

  if (grandTotal === 0 || memberIds.length === 0) return [];

  const fairShare = grandTotal / memberIds.length;

  const creditors: { userId: string; amount: number }[] = [];
  const debtors: { userId: string; amount: number }[] = [];

  for (const [userId, paid] of totalPaid) {
    const net = paid - fairShare;
    if (net > 0.01) {
      creditors.push({ userId, amount: net });
    } else if (net < -0.01) {
      debtors.push({ userId, amount: -net });
    }
  }

  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  const transfers: SettlementTransfer[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const transfer = Math.min(creditors[ci].amount, debtors[di].amount);
    transfers.push({
      fromUserId: debtors[di].userId,
      toUserId: creditors[ci].userId,
      fromUserName: memberNames.get(debtors[di].userId) || '',
      toUserName: memberNames.get(creditors[ci].userId) || '',
      amount: Math.round(transfer * 100) / 100,
    });

    creditors[ci].amount -= transfer;
    debtors[di].amount -= transfer;

    if (creditors[ci].amount < 0.01) ci++;
    if (debtors[di].amount < 0.01) di++;
  }

  return transfers;
}
