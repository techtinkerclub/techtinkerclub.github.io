// Both the inspector and the pitch must consume the same resolved pose map.
const CONTACT_TYPES = new Set(['tackle', 'ruck', 'maul', 'scrum']);
const DONUT_TACKLERS = new Set(['attacker', 'defender', 'neutral', 'shield', 'bagplayer']);
export function inspectedPose(objects, playerId, visiblePoses) {
  const player = objects.find(item => item.id === playerId);
  if (!player) return {pose: 'standing', source: 'none', formation: null, donut: null};
  const formation = objects.find(item => CONTACT_TYPES.has(item.type) && item.members?.some(member => member.id === playerId)) || null;
  const donut = objects.find(item => item.type === 'donut' && ['impact', 'down'].includes(item.donutState) && item.donutTacklerId === playerId) || null;
  const source = formation ? 'formation' : donut && DONUT_TACKLERS.has(player.type) && player.posePinned !== true ? 'donut' : player.posePinned === true ? 'manual' : 'player';
  return {pose: visiblePoses.get(playerId) || 'standing', source, formation, donut};
}
