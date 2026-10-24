/** Guatemala está en UTC-6 todo el año (no usa horario de verano). */
const OFFSET_HOURS = 6;

/** Inicio del día de hoy en Guatemala, como instante UTC. */
export function startOfTodayGT(now = new Date()): Date {
  const local = new Date(now.getTime() - OFFSET_HOURS * 3_600_000);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() + OFFSET_HOURS * 3_600_000);
}

/** Inicio del día de una fecha escrita como AAAA-MM-DD en Guatemala. */
export function startOfDayGT(isoDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getTime() + OFFSET_HOURS * 3_600_000);
}

/** Último instante del día (AAAA-MM-DD) en Guatemala. */
export function endOfDayGT(isoDate: string): Date | null {
  const start = startOfDayGT(isoDate);
  return start ? new Date(start.getTime() + 24 * 3_600_000 - 1) : null;
}
