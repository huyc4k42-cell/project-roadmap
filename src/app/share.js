/* ── SHARE — URL compression/decompression via lz-string ── */
import { S }           from './state.js';
import { SHARE_PREFIX } from './constants.js';

/* lz-string is loaded via CDN script tag at runtime.
   Access via window.LZString — tree-shaking not applicable here. */
function lz() { return window.LZString; }

export function buildShareURL() {
  if (!lz()) return location.href;
  const data = {
    cfg: S.cfg, phases: S.phases, teams: S.teams,
    tasks: S.tasks, tags: S.tags, _nextId: S._nextId,
  };
  const compressed = lz().compressToEncodedURIComponent(JSON.stringify(data));
  return location.origin + location.pathname + SHARE_PREFIX + compressed;
}

export function loadFromHash() {
  const hash = location.hash;
  if (!hash.startsWith(SHARE_PREFIX)) return false;
  if (!lz()) return false;
  try {
    const json = lz().decompressFromEncodedURIComponent(hash.slice(SHARE_PREFIX.length));
    if (!json) return false;
    const d = JSON.parse(json);
    if (d.cfg)     S.cfg     = { ...S.cfg, ...d.cfg };
    if (d.phases)  S.phases  = d.phases;
    if (d.teams)   S.teams   = d.teams;
    if (d.tasks)   S.tasks   = d.tasks;
    if (d.tags)    S.tags    = d.tags;
    if (d._nextId) S._nextId = d._nextId;
    S.ui.readonly = true;
    return true;
  } catch(e) { return false; }
}
