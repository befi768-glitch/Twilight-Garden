/**
 * Simple in-memory command cooldown tracker.
 * Prevents players from spamming expensive commands.
 *
 * Usage:
 *   import { checkCooldown, setCooldown } from '../../utils/cooldown';
 *   const remaining = checkCooldown(userId, 'khampha', 30_000);
 *   if (remaining > 0) { reply error; return; }
 *   setCooldown(userId, 'khampha', 30_000);
 */

const cooldowns = new Map<string, number>();

/**
 * Check if a user is on cooldown for a command.
 * @returns remaining milliseconds (0 = not on cooldown / free to use)
 */
export function checkCooldown(userId: string, command: string, durationMs: number): number {
  const key = `${userId}:${command}`;
  const last = cooldowns.get(key) ?? 0;
  const elapsed = Date.now() - last;
  return elapsed >= durationMs ? 0 : durationMs - elapsed;
}

/**
 * Record that a user just used a command.
 */
export function setCooldown(userId: string, command: string): void {
  cooldowns.set(`${userId}:${command}`, Date.now());
}

/** Format remaining cooldown into a human-readable string */
export function formatCooldown(ms: number): string {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s} giây`;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return sec > 0 ? `${m} phút ${sec} giây` : `${m} phút`;
}
