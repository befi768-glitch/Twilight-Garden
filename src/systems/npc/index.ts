import { NpcService, NPCS } from '../../services/NpcService';
import { GuildService } from '../../services/GuildService';
import { TimeOfDay, AreaType } from '../../models/types';

/** Get NPCs currently present in a given area based on time of day */
export function getNpcsInArea(area: AreaType, timeOfDay: TimeOfDay) {
  return Object.values(NPCS).filter((npc) => {
    const schedule = npc.schedule.find((s) => s.timeOfDay === timeOfDay);
    if (schedule) return schedule.location === area;
    return npc.location === area;
  });
}
