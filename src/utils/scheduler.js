/**
 * @param {Array<{ start: string, end: string }>} user1Slots
 * @param {Array<{ start: string, end: string }>} user2Slots
 * @returns {{ start: string, end: string } | null}
 */
export function findFirstCommonSlot(user1Slots, user2Slots) {
  if (!user1Slots?.length || !user2Slots?.length) return null;

  for (const slot1 of user1Slots) {
    const start1 = new Date(slot1.start).getTime();
    const end1 = new Date(slot1.end).getTime();

    for (const slot2 of user2Slots) {
      const start2 = new Date(slot2.start).getTime();
      const end2 = new Date(slot2.end).getTime();

      const overlapStart = Math.max(start1, start2);
      const overlapEnd = Math.min(end1, end2);

      if (overlapStart < overlapEnd) {
        return {
          start: new Date(overlapStart).toISOString(),
          end: new Date(overlapEnd).toISOString(),
        };
      }
    }
  }

  return null;
}
