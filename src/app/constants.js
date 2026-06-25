/* ── CONSTANTS — static data shared across modules ── */

export const ICONS = {
  layers:    {l:'Design',    d:'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5'},
  code:      {l:'Engineer',  d:'M16 18l6-6-6-6M8 6l-6 6 6 6'},
  bar:       {l:'Analytics', d:'M18 20V10M12 20V4M6 20v-6'},
  trending:  {l:'Growth',    d:'M23 6l-9.5 9.5-5-5L1 18'},
  search:    {l:'Research',  d:'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'},
  package:   {l:'Product',   d:'M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z'},
  speaker:   {l:'Marketing', d:'M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3'},
  cpu:       {l:'Tech',      d:'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18M9 21H5a2 2 0 01-2-2v-4m6 6h10a2 2 0 002-2v-4M15 3v18'},
  users:     {l:'People',    d:'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm13 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75'},
  dollar:    {l:'Finance',   d:'M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6'},
  zap:       {l:'Ops',       d:'M13 2L3 14h9l-1 8 10-12h-9l1-8z'},
  globe:     {l:'Global',    d:'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0c-2.76 0-5 4.48-5 10s2.24 10 5 10 5-4.48 5-10S14.76 2 12 2zm-9 10h18'},
  award:     {l:'Lead',      d:'M12 15a7 7 0 100-14 7 7 0 000 14zm0 0v6m-3.5 0h7'},
  target:    {l:'Goals',     d:'M22 12h-4M6 12H2m16 0a6 6 0 11-12 0 6 6 0 0112 0z'},
  briefcase: {l:'Sales',     d:'M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zm-8-4h4a2 2 0 012 2v2H8V5a2 2 0 012-2h2z'},
  map:       {l:'Strategy',  d:'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3V6z'},
  heart:     {l:'UX',        d:'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z'},
  star:      {l:'Quality',   d:'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z'},
  edit:      {l:'Content',   d:'M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z'},
  settings:  {l:'Infra',     d:'M12 15a3 3 0 100-6 3 3 0 000 6zM12 3v2m0 14v2m-9-9H1m22 0h-2m-3.5-7.5l-1.5 1.5M6.5 17.5L5 19m0-14l1.5 1.5M17.5 17.5L19 19'},
};

export const PHASE_COLORS = [
  '#7c3aed','#1d4ed8','#047857','#b45309','#be185d',
  '#0e7490','#7f1d1d','#1e3a5f','#4a1942','#14532d',
];

export const TEAM_COLORS = [
  '#D0A052','#7c3aed','#1d4ed8','#047857','#be185d',
  '#0e7490','#b45309','#10b981','#ef4444','#8b5cf6',
];

export const PROJ_ACCENTS = [
  '#D0A052','#7c3aed','#1d4ed8','#047857','#be185d','#0e7490','#b45309','#e05757',
];

export const TAG_PALETTES = [
  ['rgba(124,58,237,.25)','#a78bfa'],['rgba(219,97,162,.25)','#f472b6'],
  ['rgba(63,185,80,.25)','#7ee787'],['rgba(210,153,34,.25)','#e3b341'],
  ['rgba(251,143,68,.25)','#ffa657'],['rgba(56,189,248,.25)','#38bdf8'],
  ['rgba(234,179,8,.25)','#facc15'],['rgba(168,85,247,.25)','#c084fc'],
  ['rgba(244,114,182,.25)','#f472b6'],['rgba(52,211,153,.25)','#34d399'],
];

export const WKP_MONTHS = [
  'Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12',
];
export const WKP_DAYS = ['T2','T3','T4','T5','T6','T7','CN'];

export const SHARE_PREFIX = '#v1=';
export const THEME_KEY    = 'roadmap-theme';

export const LS_KEY            = 'roadmap-state-v1';
export const INDEX_KEY         = 'roadmap-index';
export const PROJ_PFX          = 'roadmap-proj-';
export const ROW_STATE_KEY     = 'roadmap-row-state';
export const SIDEBAR_STATE_KEY = 'roadmap-sidebar-state';

export const HISTORY_MAX = 50;
export const TLW         = 204;
export const WW_FILL_COLS = 9;
export const LANE_PAD    = 10;
export const LANE_GAP    = 5;

export const SHEETS_TEMPLATE_URL = 'https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms/copy';
