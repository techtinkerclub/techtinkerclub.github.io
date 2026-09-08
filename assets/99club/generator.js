/* Tech Tinker Club - 99 Club worksheet generator core
 * Pure JavaScript, deterministic and browser/Node friendly.
 */
(function (global) {
  'use strict';

  const range = (a, b) => Array.from({ length: Math.max(0, b - a + 1) }, (_, i) => a + i);

  const CLASSIC_PRESETS = {
    '11': {
      id: '11', name: '11 Club', tagline: 'Doubling 1-10', questionCount: 11,
      mode: 'double', numberMin: 1, numberMax: 10,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '22': {
      id: '22', name: '22 Club', tagline: 'Repeated addition', questionCount: 22,
      mode: 'repeated_addition', addendMin: 1, addendMax: 10, repeatsMin: 2, repeatsMax: 7,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '33': {
      id: '33', name: '33 Club', tagline: '2x, 3x, 5x & 10x', questionCount: 33,
      mode: 'multiply', tables: [2, 3, 5, 10], factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '44': {
      id: '44', name: '44 Club', tagline: 'Adds 1x, 4x & 6x', questionCount: 44,
      mode: 'multiply', tables: [1, 2, 3, 4, 5, 6, 10], factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '55': {
      id: '55', name: '55 Club', tagline: 'Adds 7x & 8x', questionCount: 55,
      mode: 'multiply', tables: [1, 2, 3, 4, 5, 6, 7, 8, 10], factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '66': {
      id: '66', name: '66 Club', tagline: 'All tables to 12x', questionCount: 66,
      mode: 'multiply', tables: range(1, 12), factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '77': {
      id: '77', name: '77 Club', tagline: 'Inverse division facts', questionCount: 77,
      mode: 'divide', tables: range(1, 12), factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '88': {
      id: '88', name: '88 Club', tagline: 'Mixed multiplication & division', questionCount: 88,
      mode: 'mixed', tables: range(1, 12), factorMin: 1, factorMax: 12, multiplyPercent: 50,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    '99': {
      id: '99', name: '99 Club', tagline: 'The full mixed challenge', questionCount: 99,
      mode: 'mixed', tables: range(1, 12), factorMin: 1, factorMax: 12, multiplyPercent: 50,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    }
  };

  function clone(obj) { return JSON.parse(JSON.stringify(obj)); }

  function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i += 1) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function rngFromSeed(seed) {
    let a = hashString(String(seed)) || 0x6d2b79f5;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffle(array, rng) {
    const out = array.slice();
    for (let i = out.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function randomCode(length = 5) {
    const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let out = '';
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      for (const b of bytes) out += alphabet[b % alphabet.length];
      return out;
    }
    const seed = String(Date.now()) + ':' + String(Math.random());
    const rng = rngFromSeed(seed);
    for (let i = 0; i < length; i += 1) out += alphabet[Math.floor(rng() * alphabet.length)];
    return out;
  }

  function newSeed(clubId) { return `${clubId}-${randomCode(5)}`; }

  function normalizeRules(input) {
    const r = clone(input || {});
    r.questionCount = clampInt(r.questionCount, 1, 200, 33);
    r.timeMinutes = clampNumber(r.timeMinutes, 0.25, 60, 5);
    r.perfectAttempts = clampInt(r.perfectAttempts, 1, 10, 2);
    r.unaided = r.unaided !== false;
    r.avoidExactDuplicates = r.avoidExactDuplicates !== false;
    r.avoidReversedDuplicates = !!r.avoidReversedDuplicates;
    r.mode = ['double', 'repeated_addition', 'multiply', 'divide', 'mixed'].includes(r.mode) ? r.mode : 'multiply';
    r.numberMin = clampInt(r.numberMin, 0, 100, 1);
    r.numberMax = clampInt(r.numberMax, r.numberMin, 100, Math.max(10, r.numberMin));
    r.addendMin = clampInt(r.addendMin, 0, 100, 1);
    r.addendMax = clampInt(r.addendMax, r.addendMin, 100, Math.max(10, r.addendMin));
    r.repeatsMin = clampInt(r.repeatsMin, 2, 20, 2);
    r.repeatsMax = clampInt(r.repeatsMax, r.repeatsMin, 20, Math.max(7, r.repeatsMin));
    r.factorMin = clampInt(r.factorMin, 0, 100, 1);
    r.factorMax = clampInt(r.factorMax, r.factorMin, 100, Math.max(12, r.factorMin));
    r.multiplyPercent = clampInt(r.multiplyPercent, 0, 100, 50);
    r.tables = Array.isArray(r.tables) ? [...new Set(r.tables.map(Number).filter(n => Number.isInteger(n) && n >= 0 && n <= 100))].sort((a,b)=>a-b) : range(1, 12);
    if (!r.tables.length && ['multiply', 'divide', 'mixed'].includes(r.mode)) r.tables = range(1, 12);
    return r;
  }

  function clampInt(v, min, max, fallback) {
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }
  function clampNumber(v, min, max, fallback) {
    const n = Number(v);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function buildDoublePool(rules) {
    return range(rules.numberMin, rules.numberMax).map(n => ({
      kind: 'double', a: n, b: n, prompt: `${n} + ${n} =`, answer: n + n,
      key: `d:${n}`
    }));
  }

  function buildRepeatedPool(rules) {
    const out = [];
    for (let n = rules.addendMin; n <= rules.addendMax; n += 1) {
      for (let count = rules.repeatsMin; count <= rules.repeatsMax; count += 1) {
        out.push({
          kind: 'repeated_addition', a: n, count,
          prompt: `${Array(count).fill(n).join(' + ')} =`,
          answer: n * count, key: `r:${n}:${count}`, group: n
        });
      }
    }
    return out;
  }

  function buildMultiplyPool(rules) {
    const out = [];
    for (const table of rules.tables) {
      for (let factor = rules.factorMin; factor <= rules.factorMax; factor += 1) {
        out.push({
          kind: 'multiply', a: table, b: factor,
          prompt: `${table} × ${factor} =`, answer: table * factor,
          key: `m:${table}:${factor}`,
          reverseKey: `m:${Math.min(table, factor)}:${Math.max(table, factor)}`,
          group: table
        });
      }
    }
    return out;
  }

  function buildDividePool(rules) {
    const out = [];
    for (const divisor of rules.tables.filter(t => t !== 0)) {
      for (let quotient = Math.max(0, rules.factorMin); quotient <= rules.factorMax; quotient += 1) {
        const dividend = divisor * quotient;
        out.push({
          kind: 'divide', a: dividend, b: divisor,
          prompt: `${dividend} ÷ ${divisor} =`, answer: quotient,
          key: `v:${dividend}:${divisor}`,
          reverseKey: `v:${divisor}:${quotient}`,
          group: divisor
        });
      }
    }
    return out;
  }

  function balancedPick(pool, count, rng, rules) {
    if (!pool.length) return [];
    const chosen = [];
    const exactSeen = new Set();
    const reverseSeen = new Set();
    const groups = new Map();
    for (const q of pool) {
      const g = q.group == null ? '__all' : String(q.group);
      if (!groups.has(g)) groups.set(g, []);
      groups.get(g).push(q);
    }
    const groupKeys = shuffle(Array.from(groups.keys()), rng);
    for (const key of groupKeys) groups.set(key, shuffle(groups.get(key), rng));
    const offsets = Object.fromEntries(groupKeys.map(k => [k, 0]));

    let guard = 0;
    while (chosen.length < count && guard < count * 100 + 1000) {
      guard += 1;
      let madeProgress = false;
      for (const g of shuffle(groupKeys, rng)) {
        const arr = groups.get(g);
        if (!arr.length) continue;
        let tries = 0;
        while (tries < arr.length) {
          const q = arr[offsets[g] % arr.length];
          offsets[g] += 1;
          tries += 1;
          const exactBlocked = rules.avoidExactDuplicates && exactSeen.has(q.key);
          const reverseKey = q.reverseKey || q.key;
          const reverseBlocked = rules.avoidReversedDuplicates && reverseSeen.has(reverseKey);
          if (exactBlocked || reverseBlocked) continue;
          chosen.push({ ...q });
          exactSeen.add(q.key);
          reverseSeen.add(reverseKey);
          madeProgress = true;
          break;
        }
        if (chosen.length >= count) break;
      }
      if (!madeProgress) {
        // The requested sheet is larger than the unique pool. Start another balanced cycle.
        exactSeen.clear();
        reverseSeen.clear();
        for (const g of groupKeys) groups.set(g, shuffle(groups.get(g), rng));
      }
    }
    return chosen.slice(0, count);
  }

  function generateQuestions(inputRules, seed) {
    const rules = normalizeRules(inputRules);
    const rng = rngFromSeed(seed || newSeed(rules.id || 'CUSTOM'));
    let questions = [];

    if (rules.mode === 'double') {
      questions = balancedPick(buildDoublePool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'repeated_addition') {
      questions = balancedPick(buildRepeatedPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'multiply') {
      questions = balancedPick(buildMultiplyPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'divide') {
      questions = balancedPick(buildDividePool(rules), rules.questionCount, rng, rules);
    } else {
      const multCount = Math.round(rules.questionCount * rules.multiplyPercent / 100);
      const divCount = rules.questionCount - multCount;
      const mult = balancedPick(buildMultiplyPool(rules), multCount, rng, rules);
      const div = balancedPick(buildDividePool(rules), divCount, rng, rules);
      questions = shuffle(mult.concat(div), rng);
    }

    return questions.map((q, idx) => ({ ...q, number: idx + 1 }));
  }

  function shuffleQuestions(questions, seed) {
    const rng = rngFromSeed(String(seed) + ':shuffle');
    return shuffle(questions, rng).map((q, idx) => ({ ...q, number: idx + 1 }));
  }

  function replaceQuestion(questions, index, rules, seed) {
    if (index < 0 || index >= questions.length) return questions.slice();
    const existing = new Set(questions.map((q, i) => i === index ? null : q.key).filter(Boolean));
    const candidates = generateQuestions({ ...rules, questionCount: Math.max(20, rules.questionCount) }, `${seed}:replace:${index}:${Date.now()}`)
      .filter(q => !existing.has(q.key));
    if (!candidates.length) return questions.slice();
    const out = questions.slice();
    out[index] = { ...candidates[0], number: index + 1 };
    return out;
  }

  function rulesSummary(inputRules) {
    const r = normalizeRules(inputRules);
    let maths = '';
    if (r.mode === 'double') maths = `doubling ${r.numberMin}-${r.numberMax}`;
    if (r.mode === 'repeated_addition') maths = `repeated addition (${r.addendMin}-${r.addendMax}, repeated ${r.repeatsMin}-${r.repeatsMax} times)`;
    if (r.mode === 'multiply') maths = `multiplication · tables ${compressNumbers(r.tables)} · factors ${r.factorMin}-${r.factorMax}`;
    if (r.mode === 'divide') maths = `exact division · tables ${compressNumbers(r.tables)} · quotients ${r.factorMin}-${r.factorMax}`;
    if (r.mode === 'mixed') maths = `mixed multiplication/division · tables ${compressNumbers(r.tables)} · ${r.multiplyPercent}% multiplication`;
    return `${r.questionCount} questions · ${maths} · ${formatMinutes(r.timeMinutes)} · ${r.perfectAttempts} perfect ${r.perfectAttempts === 1 ? 'attempt' : 'attempts'} to advance`;
  }

  function instructionText(inputRules) {
    const r = normalizeRules(inputRules);
    const time = formatMinutes(r.timeMinutes);
    const solo = r.unaided ? ' Work independently and without help.' : '';
    const advance = r.perfectAttempts === 1
      ? 'A perfect score moves you to the next club.'
      : r.perfectAttempts === 2
        ? 'Get a perfect score twice in a row to move to the next club.'
        : `Get a perfect score ${r.perfectAttempts} times in a row to move to the next club.`;
    return `Try to complete all ${r.questionCount} questions in ${time}.${solo} ${advance}`.replace(/\s+/g, ' ').trim();
  }

  function formatMinutes(v) {
    const n = Number(v);
    if (n < 1) return `${Math.round(n * 60)} seconds`;
    return Number.isInteger(n) ? `${n} ${n === 1 ? 'minute' : 'minutes'}` : `${n} minutes`;
  }

  function numberWord(n) {
    return ({1:'once',2:'twice',3:'three',4:'four',5:'five'})[n] || String(n);
  }

  function compressNumbers(nums) {
    const a = [...nums].sort((x,y)=>x-y);
    if (!a.length) return 'none';
    const chunks = [];
    let start = a[0], prev = a[0];
    for (let i = 1; i <= a.length; i += 1) {
      const cur = a[i];
      if (cur === prev + 1) { prev = cur; continue; }
      chunks.push(start === prev ? String(start) : `${start}-${prev}`);
      start = cur; prev = cur;
    }
    return chunks.join(', ');
  }

  const api = {
    CLASSIC_PRESETS, clone, normalizeRules, generateQuestions, shuffleQuestions,
    replaceQuestion, rulesSummary, instructionText, newSeed, rngFromSeed, compressNumbers
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TT99Generator = api;
}(typeof window !== 'undefined' ? window : globalThis));
