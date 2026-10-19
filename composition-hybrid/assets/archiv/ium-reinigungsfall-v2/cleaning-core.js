'use strict';
// Independent UX teaching model. No production goal or dossier contract is changed.
(function (root) {
  const basic = new Set(['vor', 'links', 'rechts']);
  const rooms = {
    small: { width: 2, height: 2, start: [1, 2, 1] },
    main: { width: 3, height: 3, start: [1, 3, 1] },
    own: { width: 4, height: 3, start: [1, 3, 1] }
  };
  function parse(text) {
    if (typeof text !== 'string' || !text.trim()) throw new Error('Dein Code ist noch leer. Beginne mit einem Befehl.');
    if (text.length > 10000) throw new Error('Der Code ist für diesen kleinen Modellfall zu lang.');
    return text.split(/\r?\n/).flatMap((raw, index) => {
      const line = raw.trim().toLowerCase();
      if (!line) return [];
      if (basic.has(line)) return [{ body: [line], count: 1, line: index + 1, repeat: false }];
      const match = /^wiederhole\s+([0-9]+)\s*\[([^\[\]]+)\]$/.exec(line);
      if (!match) throw new Error(`Zeile ${index + 1}: Nutze vor, links, rechts oder wiederhole 4 [vor; links]. Ein Befehl pro Zeile.`);
      const body = match[2].split(';').map(v => v.trim());
      const count = Number(match[1]);
      if (count < 2 || count > 9) throw new Error(`Zeile ${index + 1}: Die Anzahl muss zwischen 2 und 9 liegen.`);
      if (body.length < 1 || body.length > 5 || body.some(v => !basic.has(v)))
        throw new Error(`Zeile ${index + 1}: In die Klammer gehören 1 bis 5 Grundbefehle, getrennt durch Semikolon. Keine verschachtelte Wiederholung.`);
      return [{ body, count, line: index + 1, repeat: true }];
    });
  }
  function run(room, program) {
    let pos = [...room.start];
    const cleaned = new Set([`${pos[0]},${pos[1]}`]);
    const trace = [{ pos: [...pos], cleaned: [...cleaned], action: 'Start', line: null, iteration: null, error: null }];
    let status = 'complete';
    outer: for (const block of program) {
      for (let iteration = 1; iteration <= block.count; iteration++) {
        for (const action of block.body) {
          if (trace.length > 100) { status = 'limit'; break outer; }
          const after = [...pos];
          if (action === 'vor') {
            const delta = [[0,-1],[1,0],[0,1],[-1,0]][pos[2]];
            after[0] += delta[0]; after[1] += delta[1];
          } else after[2] = (after[2] + (action === 'links' ? 3 : 1)) % 4;
          const wall = after[0] < 1 || after[0] > room.width || after[1] < 1 || after[1] > room.height;
          if (!wall) { pos = after; cleaned.add(`${pos[0]},${pos[1]}`); }
          trace.push({ pos: [...pos], cleaned: [...cleaned], action, line: block.line,
            iteration: block.repeat ? iteration : null, error: wall ? 'wall' : null });
          if (wall) { status = 'wall'; break outer; }
        }
      }
    }
    const missing = [];
    for (let y = 1; y <= room.height; y++) for (let x = 1; x <= room.width; x++) {
      if (!cleaned.has(`${x},${y}`)) missing.push(`${x},${y}`);
    }
    return { end: [...pos], trace, cleaned: [...cleaned], missing, status,
      success: status === 'complete' && missing.length === 0 };
  }
  const api = { parse, run, rooms };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.CleaningModel = api;
})(globalThis);
