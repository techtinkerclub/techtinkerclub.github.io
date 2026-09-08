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


  // Post-99 challenge presets. These are deliberately separate from the Classic
  // 11-99 sequence so the existing default progression remains unchanged.
  const CHALLENGE_PRESETS = {
    bronze: {
      id: 'bronze', name: 'Bronze Club', tagline: 'All tables & related division', questionCount: 100,
      mode: 'mixed', tables: range(1, 12), factorMin: 1, factorMax: 12, multiplyPercent: 50,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    silver: {
      id: 'silver', name: 'Silver Club', tagline: 'All four operations', questionCount: 100,
      mode: 'family_mix', families: ['addition','subtraction','multiply','divide'],
      familyWeights: { addition:2, subtraction:2, multiply:3, divide:3 },
      arithmeticMin: 0, arithmeticMax: 200, arithmeticOperandMax: 120,
      tables: range(1, 12), factorMin: 1, factorMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    gold: {
      id: 'gold', name: 'Gold Club', tagline: 'Four operations, squares & roots', questionCount: 100,
      mode: 'family_mix', families: ['addition','subtraction','multiply','divide','square','square_root'],
      familyWeights: { addition:2, subtraction:2, multiply:3, divide:3, square:1, square_root:1 },
      arithmeticMin: 0, arithmeticMax: 250, arithmeticOperandMax: 160,
      tables: range(1, 12), factorMin: 1, factorMax: 12, squareMin: 1, squareMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    platinum: {
      id: 'platinum', name: 'Platinum Club', tagline: 'Adds order of operations', questionCount: 100,
      mode: 'family_mix', families: ['addition','subtraction','multiply','divide','square','square_root','bodmas'],
      familyWeights: { addition:2, subtraction:2, multiply:3, divide:3, square:1, square_root:1, bodmas:2 },
      arithmeticMin: 0, arithmeticMax: 300, arithmeticOperandMax: 180,
      tables: range(1, 12), factorMin: 1, factorMax: 12, squareMin: 1, squareMax: 12, bodmasMax: 12,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    },
    diamond: {
      id: 'diamond', name: 'Diamond Club', tagline: 'Broad advanced mental maths', questionCount: 100,
      mode: 'family_mix',
      families: ['addition','subtraction','multiply','divide','square','square_root','bodmas','scaled_multiply','scaled_divide','fraction_of','percentage_of'],
      familyWeights: { addition:2, subtraction:2, multiply:2, divide:2, square:1, square_root:1, bodmas:2, scaled_multiply:2, scaled_divide:1, fraction_of:1, percentage_of:1 },
      arithmeticMin: 0, arithmeticMax: 1000, arithmeticOperandMax: 850,
      tables: range(1, 12), factorMin: 1, factorMax: 12, squareMin: 1, squareMax: 12, bodmasMax: 12,
      fractionDenominators: [2,3,4,5,10], percentageChoices: [10,20,25,50,75],
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    }
  };

  function commonPreset(id, name, tagline, questionCount, extra) {
    return Object.assign({
      id, name, tagline, questionCount,
      timeMinutes: 5, perfectAttempts: 2, unaided: true,
      avoidExactDuplicates: true, avoidReversedDuplicates: false
    }, extra || {});
  }

  // Optional content schemes found in public UK school implementations. Timing
  // and advancement intentionally stay at TTC's standard 5 minutes / 2 perfect
  // attempts; users can edit those independently in the rule editor.
  const SCHEME_PRESETS = {
    classic: {
      id: 'classic', name: 'Classic 99 Club', tagline: 'Doubling → repeated addition → tables → division',
      presets: CLASSIC_PRESETS
    },
    addition_first: {
      id: 'addition_first', name: 'Addition-first', tagline: 'Addition first, then tables and division',
      presets: {
        '11': commonPreset('11','11 Club','Addition to 10',11,{mode:'addition',arithmeticMin:0,arithmeticMax:10,arithmeticOperandMax:10}),
        '22': commonPreset('22','22 Club','Addition to 20',22,{mode:'addition',arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20}),
        '33': commonPreset('33','33 Club','Addition to 20 + 2× & 10×',33,{mode:'family_mix',families:['addition','multiply'],familyWeights:{addition:2,multiply:1},arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20,tables:[2,10],factorMin:1,factorMax:12}),
        '44': commonPreset('44','44 Club','Addition to 20 + 2×, 5× & 10×',44,{mode:'family_mix',families:['addition','multiply'],familyWeights:{addition:2,multiply:2},arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20,tables:[2,5,10],factorMin:1,factorMax:12}),
        '55': commonPreset('55','55 Club','2×, 3×, 4×, 5× & 10×',55,{mode:'multiply',tables:[2,3,4,5,10],factorMin:1,factorMax:12}),
        '66': commonPreset('66','66 Club','Adds 6×',66,{mode:'multiply',tables:[2,3,4,5,6,10],factorMin:1,factorMax:12}),
        '77': commonPreset('77','77 Club','Adds 7×',77,{mode:'multiply',tables:[2,3,4,5,6,7,10],factorMin:1,factorMax:12}),
        '88': commonPreset('88','88 Club','All tables to 12×',88,{mode:'multiply',tables:range(1,12),factorMin:1,factorMax:12}),
        '99': commonPreset('99','99 Club','All tables + related division',99,{mode:'mixed',tables:range(1,12),factorMin:1,factorMax:12,multiplyPercent:50})
      }
    },
    arithmetic_first: {
      id: 'arithmetic_first', name: 'Arithmetic-first', tagline: 'Addition/subtraction before multiplication and division',
      presets: {
        '11': commonPreset('11','11 Club','Add two single-digit numbers',11,{mode:'addition',arithmeticMin:0,arithmeticMax:18,arithmeticOperandMax:9}),
        '22': commonPreset('22','22 Club','Addition & subtraction to 20',22,{mode:'add_subtract',arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20}),
        '33': commonPreset('33','33 Club','Addition & subtraction to 20',33,{mode:'add_subtract',arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20}),
        '44': commonPreset('44','44 Club','Addition to 20 + 2×, 5× & 10×',44,{mode:'family_mix',families:['addition','multiply'],familyWeights:{addition:2,multiply:2},arithmeticMin:0,arithmeticMax:20,arithmeticOperandMax:20,tables:[2,5,10],factorMin:0,factorMax:12}),
        '55': commonPreset('55','55 Club','Adds 3×, 4× & 6×',55,{mode:'multiply',tables:[2,3,4,5,6,10],factorMin:0,factorMax:12}),
        '66': commonPreset('66','66 Club','Adds 7×, 8× & 9×',66,{mode:'multiply',tables:[2,3,4,5,6,7,8,9,10],factorMin:0,factorMax:12}),
        '77': commonPreset('77','77 Club','Mixed multiplication & division',77,{mode:'mixed',tables:range(1,12),factorMin:0,factorMax:12,multiplyPercent:60}),
        '88': commonPreset('88','88 Club','Mixed facts + missing numbers',88,{mode:'family_mix',families:['multiply','divide','missing_number'],familyWeights:{multiply:3,divide:2,missing_number:2},tables:range(1,12),factorMin:0,factorMax:12}),
        '99': commonPreset('99','99 Club','Full mixed facts + missing numbers',99,{mode:'family_mix',families:['multiply','divide','missing_number'],familyWeights:{multiply:3,divide:2,missing_number:3},tables:range(1,12),factorMin:0,factorMax:12})
      }
    },
    missing_number: {
      id: 'missing_number', name: 'Missing-number progression', tagline: 'Tables build-up finishing with missing-number facts',
      presets: {
        '11': commonPreset('11','11 Club','Doubling 1-10',11,{mode:'double',numberMin:1,numberMax:10}),
        '22': commonPreset('22','22 Club','2×, 5× & 10×',22,{mode:'multiply',tables:[2,5,10],factorMin:1,factorMax:12}),
        '33': commonPreset('33','33 Club','Adds 3× & 4×',33,{mode:'multiply',tables:[2,3,4,5,10],factorMin:1,factorMax:12}),
        '44': commonPreset('44','44 Club','Adds 1× & 6×',44,{mode:'multiply',tables:[1,2,3,4,5,6,10],factorMin:1,factorMax:12}),
        '55': commonPreset('55','55 Club','Adds 7×, 8× & 9×',55,{mode:'multiply',tables:range(1,10),factorMin:1,factorMax:12}),
        '66': commonPreset('66','66 Club','Adds 11× & 12×',66,{mode:'multiply',tables:range(1,12),factorMin:1,factorMax:12}),
        '77': commonPreset('77','77 Club','Inverse division facts',77,{mode:'divide',tables:range(1,12),factorMin:1,factorMax:12}),
        '88': commonPreset('88','88 Club','Mixed multiplication & division',88,{mode:'mixed',tables:range(1,12),factorMin:1,factorMax:12,multiplyPercent:50}),
        '99': commonPreset('99','99 Club','Missing-number multiplication & division',99,{mode:'missing_number',tables:range(1,12),factorMin:1,factorMax:12})
      }
    },
    tables_first: {
      id: 'tables_first', name: 'Tables-first', tagline: 'Multiplication first, then related division',
      presets: {
        '11': commonPreset('11','11 Club','Multiply by 2 & 10',11,{mode:'multiply',tables:[2,10],factorMin:1,factorMax:12}),
        '22': commonPreset('22','22 Club','Multiply by 2, 5 & 10',22,{mode:'multiply',tables:[2,5,10],factorMin:1,factorMax:12}),
        '33': commonPreset('33','33 Club','× and ÷ by 2, 5 & 10',33,{mode:'mixed',tables:[2,5,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '44': commonPreset('44','44 Club','Adds 3× & 4× families',44,{mode:'mixed',tables:[2,3,4,5,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '55': commonPreset('55','55 Club','Adds 8× family',55,{mode:'mixed',tables:[2,3,4,5,8,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '66': commonPreset('66','66 Club','Adds 9× family',66,{mode:'mixed',tables:[2,3,4,5,8,9,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '77': commonPreset('77','77 Club','Adds 6× family',77,{mode:'mixed',tables:[2,3,4,5,6,8,9,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '88': commonPreset('88','88 Club','Adds 7× family',88,{mode:'mixed',tables:[2,3,4,5,6,7,8,9,10],factorMin:1,factorMax:12,multiplyPercent:50}),
        '99': commonPreset('99','99 Club','All × and ÷ facts to 12×12',99,{mode:'mixed',tables:[2,3,4,5,6,7,8,9,10,11,12],factorMin:1,factorMax:12,multiplyPercent:50})
      }
    }
  };

  const FAMILY_LABELS = {
    addition:'addition', subtraction:'subtraction', multiply:'multiplication', divide:'division',
    missing_number:'missing numbers', square:'squares', square_root:'square roots', cube:'cubes',
    bodmas:'order of operations', scaled_multiply:'scaled multiplication', scaled_divide:'scaled division',
    fraction_of:'fractions of quantities', percentage_of:'percentages of quantities',
    negative_numbers:'negative numbers', roman_numerals:'Roman numerals', angle_facts:'angle facts', simple_algebra:'simple algebra'
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
    r.mode = ['double', 'repeated_addition', 'multiply', 'divide', 'mixed', 'addition', 'add_subtract', 'missing_number', 'family_mix'].includes(r.mode) ? r.mode : 'multiply';
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
    if (!r.tables.length && ['multiply', 'divide', 'mixed', 'missing_number', 'family_mix'].includes(r.mode)) r.tables = range(1, 12);
    r.arithmeticMin = clampInt(r.arithmeticMin, -1000, 1000, 0);
    r.arithmeticMax = clampInt(r.arithmeticMax, Math.max(1, r.arithmeticMin), 5000, 100);
    r.arithmeticOperandMax = clampInt(r.arithmeticOperandMax, 1, 5000, Math.min(100, r.arithmeticMax));
    r.arithmeticOperandMin = clampInt(r.arithmeticOperandMin, 0, r.arithmeticOperandMax, 0);
    r.allowNegativeAnswers = !!r.allowNegativeAnswers;
    r.squareMin = clampInt(r.squareMin, 0, 50, 1);
    r.squareMax = clampInt(r.squareMax, r.squareMin, 50, Math.max(12, r.squareMin));
    r.cubeMin = clampInt(r.cubeMin, 0, 20, 1);
    r.cubeMax = clampInt(r.cubeMax, r.cubeMin, 20, Math.max(10, r.cubeMin));
    r.bodmasMax = clampInt(r.bodmasMax, 2, 30, 12);
    r.bodmasOperations = normalizeStringList(r.bodmasOperations, ['add','subtract','multiply','divide'], ['add','subtract','multiply','divide']);
    if (r.bodmasOperations.length < 2) r.bodmasOperations = ['add','multiply'];
    r.bodmasUseBrackets = r.bodmasUseBrackets !== false;
    r.missingNumberOperations = normalizeStringList(r.missingNumberOperations, ['multiply','divide'], ['multiply','divide']);
    r.missingNumberPositions = normalizeStringList(r.missingNumberPositions, ['multiply_second','multiply_first','divide_divisor','divide_dividend'], ['multiply_first','multiply_second','multiply_result','divide_dividend','divide_divisor','divide_result']);
    const compatibleMissing = r.missingNumberPositions.filter(pos => (pos.startsWith('multiply_') && r.missingNumberOperations.includes('multiply')) || (pos.startsWith('divide_') && r.missingNumberOperations.includes('divide')));
    if (compatibleMissing.length) r.missingNumberPositions = compatibleMissing;
    else r.missingNumberPositions = r.missingNumberOperations.includes('multiply') ? ['multiply_second','multiply_first'] : ['divide_divisor','divide_dividend'];
    r.fractionDenominators = normalizeNumberList(r.fractionDenominators, [2,3,4,5,10], 2, 100);
    r.fractionQuantityMin = clampInt(r.fractionQuantityMin, 1, 5000, 1);
    r.fractionQuantityMax = clampInt(r.fractionQuantityMax, r.fractionQuantityMin, 5000, Math.max(500, r.fractionQuantityMin));
    r.percentageChoices = normalizeNumberList(r.percentageChoices, [10,20,25,50,75], 1, 100);
    r.percentageQuantityMin = clampInt(r.percentageQuantityMin, 10, 5000, 20);
    r.percentageQuantityMax = clampInt(r.percentageQuantityMax, r.percentageQuantityMin, 5000, Math.max(500, r.percentageQuantityMin));
    r.scaledMultipliers = normalizeNumberList(r.scaledMultipliers, [10,100], 10, 1000);
    r.angleTotals = normalizeNumberList(r.angleTotals, [90,180,360], 1, 360);
    const validFamilies = Object.keys(FAMILY_LABELS);
    r.families = Array.isArray(r.families) ? [...new Set(r.families.filter(f => validFamilies.includes(f)))] : ['addition','subtraction','multiply','divide'];
    if (!r.families.length && r.mode === 'family_mix') r.families = ['addition','subtraction','multiply','divide'];
    const weights = r.familyWeights && typeof r.familyWeights === 'object' ? r.familyWeights : {};
    r.familyWeights = Object.fromEntries(r.families.map(f => [f, clampInt(weights[f], 1, 20, 1)]));
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

  function normalizeNumberList(value, fallback, min, max) {
    const source = Array.isArray(value) ? value : fallback;
    const out = [...new Set(source.map(Number).filter(n => Number.isInteger(n) && n >= min && n <= max))].sort((a,b)=>a-b);
    return out.length ? out : fallback.slice();
  }

  function normalizeStringList(value, fallback, allowed) {
    const source = Array.isArray(value) ? value : fallback;
    const valid = new Set(allowed);
    const out = [...new Set(source.map(String).filter(v => valid.has(v)))];
    return out.length ? out : fallback.slice();
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


  function buildAdditionPool(rules) {
    const out = [];
    const maxOperand = Math.min(rules.arithmeticOperandMax, rules.arithmeticMax);
    const minOperand = Math.max(0, rules.arithmeticOperandMin || 0);
    for (let a = Math.max(0, rules.arithmeticMin, minOperand); a <= maxOperand; a += 1) {
      const bMax = Math.min(maxOperand, rules.arithmeticMax - a);
      for (let b = minOperand; b <= bMax; b += 1) {
        if (a === 0 && b === 0) continue;
        out.push({ kind:'addition', a, b, prompt:`${a} + ${b} =`, answer:a+b, key:`a:${a}:${b}` });
      }
    }
    return out;
  }

  function buildSubtractionPool(rules) {
    const out = [];
    const maxOperand = Math.min(rules.arithmeticOperandMax, rules.arithmeticMax);
    const minOperand = Math.max(0, rules.arithmeticOperandMin || 0);
    for (let a = Math.max(1, minOperand); a <= maxOperand; a += 1) {
      const bStart = minOperand;
      const bMax = rules.allowNegativeAnswers ? maxOperand : a;
      for (let b = bStart; b <= bMax; b += 1) {
        const answer = a - b;
        if (!rules.allowNegativeAnswers && answer < 0) continue;
        out.push({ kind:'subtraction', a, b, prompt:`${a} - ${b} =`, answer, key:`s:${a}:${b}` });
      }
    }
    return out;
  }

  function buildMissingNumberPool(rules) {
    const out = [];
    const operations = new Set(rules.missingNumberOperations || ['multiply','divide']);
    const positions = new Set(rules.missingNumberPositions || ['multiply_second','multiply_first','divide_divisor','divide_dividend']);
    for (const table of rules.tables.filter(t => t !== 0)) {
      for (let factor = Math.max(0, rules.factorMin); factor <= rules.factorMax; factor += 1) {
        const product = table * factor;
        // Keep the historical order of the four default patterns so v1.2
        // fixed-seed worksheets remain unchanged when the new controls are untouched.
        if (operations.has('multiply') && positions.has('multiply_second'))
          out.push({ kind:'missing_number', prompt:`${table} × ___ = ${product}`, answer:factor, key:`mn:m:r:${table}:${factor}`, group:table });
        if (operations.has('multiply') && positions.has('multiply_first'))
          out.push({ kind:'missing_number', prompt:`___ × ${factor} = ${product}`, answer:table, key:`mn:m:l:${table}:${factor}`, group:table });
        if (operations.has('divide') && positions.has('divide_divisor') && factor !== 0)
          out.push({ kind:'missing_number', prompt:`${product} ÷ ___ = ${factor}`, answer:table, key:`mn:d:d:${table}:${factor}`, group:table });
        if (operations.has('divide') && positions.has('divide_dividend'))
          out.push({ kind:'missing_number', prompt:`___ ÷ ${table} = ${factor}`, answer:product, key:`mn:d:n:${table}:${factor}`, group:table });
        if (operations.has('multiply') && positions.has('multiply_result'))
          out.push({ kind:'missing_number', prompt:`${table} × ${factor} = ___`, answer:product, key:`mn:m:a:${table}:${factor}`, group:table });
        if (operations.has('divide') && positions.has('divide_result'))
          out.push({ kind:'missing_number', prompt:`${product} ÷ ${table} = ___`, answer:factor, key:`mn:d:a:${table}:${factor}`, group:table });
      }
    }
    return out;
  }

  function buildSquarePool(rules) {
    return range(rules.squareMin, rules.squareMax).map(n => ({ kind:'square', prompt:`${n}² =`, answer:n*n, key:`sq:${n}` }));
  }

  function buildSquareRootPool(rules) {
    return range(rules.squareMin, rules.squareMax).map(n => ({ kind:'square_root', prompt:`√${n*n} =`, answer:n, key:`sr:${n}` }));
  }

  function buildCubePool(rules) {
    return range(rules.cubeMin, rules.cubeMax).map(n => ({ kind:'cube', prompt:`${n}³ =`, answer:n*n*n, key:`cu:${n}` }));
  }

  function buildBodmasPool(rules) {
    const out = [], m = rules.bodmasMax;
    const ops = new Set(rules.bodmasOperations || ['add','subtract','multiply','divide']);
    const brackets = rules.bodmasUseBrackets !== false;
    const legacyDefault = brackets && ['add','subtract','multiply','divide'].every(x=>ops.has(x)) && ops.size===4;
    for (let a = 2; a <= m; a += 1) {
      for (let b = 2; b <= m; b += 1) {
        const c = ((a + b) % Math.max(2, m - 1)) + 2;
        if (legacyDefault) {
          // Historical v1.2 order retained byte-for-byte for default presets.
          out.push({ kind:'bodmas', prompt:`${a} + ${b} × ${c} =`, answer:a+b*c, key:`bo:1:${a}:${b}:${c}` });
          out.push({ kind:'bodmas', prompt:`${a} × (${b} + ${c}) =`, answer:a*(b+c), key:`bo:2:${a}:${b}:${c}` });
          out.push({ kind:'bodmas', prompt:`(${a} + ${b}) × ${c} =`, answer:(a+b)*c, key:`bo:3:${a}:${b}:${c}` });
          out.push({ kind:'bodmas', prompt:`${a*b} ÷ ${b} + ${c} =`, answer:a+c, key:`bo:4:${a}:${b}:${c}` });
          if (a*b > c) out.push({ kind:'bodmas', prompt:`${a*b} - (${b} + ${c}) =`, answer:a*b-b-c, key:`bo:5:${a}:${b}:${c}` });
          continue;
        }
        if (ops.has('add') && ops.has('multiply')) {
          out.push({ kind:'bodmas', prompt:`${a} + ${b} × ${c} =`, answer:a+b*c, key:`box:am:${a}:${b}:${c}` });
          if (brackets) out.push({ kind:'bodmas', prompt:`${a} × (${b} + ${c}) =`, answer:a*(b+c), key:`box:amb:${a}:${b}:${c}` });
        }
        if (ops.has('subtract') && ops.has('multiply') && a*b >= c) {
          out.push({ kind:'bodmas', prompt:`${a} × ${b} - ${c} =`, answer:a*b-c, key:`box:sm:${a}:${b}:${c}` });
          if (brackets && b < c) out.push({ kind:'bodmas', prompt:`${a} × (${c} - ${b}) =`, answer:a*(c-b), key:`box:smb:${a}:${b}:${c}` });
        }
        if (ops.has('add') && ops.has('divide'))
          out.push({ kind:'bodmas', prompt:`${a*b} ÷ ${b} + ${c} =`, answer:a+c, key:`box:ad:${a}:${b}:${c}` });
        if (ops.has('subtract') && ops.has('divide') && a >= c)
          out.push({ kind:'bodmas', prompt:`${a*b} ÷ ${b} - ${c} =`, answer:a-c, key:`box:sd:${a}:${b}:${c}` });
        if (ops.has('multiply') && ops.has('divide'))
          out.push({ kind:'bodmas', prompt:`${a*c} × ${b} ÷ ${c} =`, answer:a*b, key:`box:md:${a}:${b}:${c}` });
        if (ops.has('add') && ops.has('subtract')) {
          out.push({ kind:'bodmas', prompt:`${a} + ${b} - ${c} =`, answer:a+b-c, key:`box:as:${a}:${b}:${c}` });
          if (brackets) out.push({ kind:'bodmas', prompt:`(${a} + ${b}) - ${c} =`, answer:a+b-c, key:`box:asb:${a}:${b}:${c}` });
        }
      }
    }
    return out;
  }

  function buildScaledMultiplyPool(rules) {
    const out = [];
    const bases = range(Math.max(2, rules.factorMin), rules.factorMax);
    const scales = rules.scaledMultipliers || [10,100];
    const legacyDefault = scales.length === 2 && scales[0] === 10 && scales[1] === 100;
    for (const a of bases) for (const b of bases) for (const sa of scales) {
      out.push({ kind:'scaled_multiply', prompt:`${a*sa} × ${b} =`, answer:a*sa*b, key:`sm:1:${a}:${sa}:${b}` });
      // Preserve the historical default pool exactly for v1.2. When a teacher
      // deliberately changes the scale choices, make this second pattern honour
      // the selected scale too.
      const bothScale = legacyDefault ? 10 : sa;
      out.push({ kind:'scaled_multiply', prompt:`${a*bothScale} × ${b*bothScale} =`, answer:a*b*bothScale*bothScale, key:legacyDefault?`sm:2:${a}:${b}`:`sm:2:${a}:${b}:${bothScale}` });
    }
    return out;
  }

  function buildScaledDividePool(rules) {
    const out = [];
    const bases = range(Math.max(2, rules.factorMin), rules.factorMax);
    for (const divisor of bases) for (const quotient of bases) {
      for (const scale of (rules.scaledMultipliers || [10,100])) {
        const dividend = divisor * quotient * scale;
        out.push({ kind:'scaled_divide', prompt:`${dividend} ÷ ${divisor} =`, answer:quotient*scale, key:`sd:1:${divisor}:${quotient}:${scale}` });
        out.push({ kind:'scaled_divide', prompt:`${dividend} ÷ ${divisor*scale} =`, answer:quotient, key:`sd:2:${divisor}:${quotient}:${scale}` });
      }
    }
    return out;
  }

  function buildFractionOfPool(rules) {
    const out = [];
    // Keep the v1.2 default pool/order exactly unchanged. When a teacher edits
    // the quantity range, deliberately switch to a range-driven pool so both
    // the minimum and maximum controls genuinely affect the available facts.
    const legacyRange = rules.fractionQuantityMin === 1 && rules.fractionQuantityMax === 500;
    for (const d of rules.fractionDenominators) {
      const unitMin = legacyRange ? 2 : Math.max(1, Math.ceil(rules.fractionQuantityMin / d));
      const unitMax = legacyRange ? 20 : Math.floor(rules.fractionQuantityMax / d);
      for (let n = 1; n < d; n += 1) {
        for (let unit = unitMin; unit <= unitMax; unit += 1) {
          const quantity = d * unit;
          if (quantity < rules.fractionQuantityMin || quantity > rules.fractionQuantityMax) continue;
          out.push({ kind:'fraction_of', prompt:`${n}/${d} of ${quantity} =`, answer:n*unit, key:`fr:${n}:${d}:${quantity}` });
        }
      }
    }
    return out;
  }

  function buildPercentageOfPool(rules) {
    const out = [];
    for (const pct of rules.percentageChoices) {
      const start = Math.max(10, Math.ceil(rules.percentageQuantityMin / 10) * 10);
      for (let quantity = start; quantity <= rules.percentageQuantityMax; quantity += 10) {
        const answer = quantity * pct / 100;
        if (!Number.isInteger(answer)) continue;
        out.push({ kind:'percentage_of', prompt:`${pct}% of ${quantity} =`, answer, key:`pc:${pct}:${quantity}` });
      }
    }
    return out;
  }

  function buildNegativeNumberPool(rules) {
    const out = [];
    const m = Math.max(5, Math.min(50, rules.arithmeticOperandMax, rules.arithmeticMax));
    for (let a = 1; a <= m; a += 1) {
      for (let b = 1; b <= m; b += 1) {
        if (a + b > Math.max(m, rules.arithmeticMax)) continue;
        out.push({ kind:'negative_numbers', prompt:`-${a} + ${b} =`, answer:b-a, key:`neg:1:${a}:${b}` });
        out.push({ kind:'negative_numbers', prompt:`${a} - ${a+b} =`, answer:-b, key:`neg:2:${a}:${b}` });
        out.push({ kind:'negative_numbers', prompt:`-${a} - ${b} =`, answer:-(a+b), key:`neg:3:${a}:${b}` });
      }
    }
    return out;
  }

  function toRoman(value) {
    let n = Math.max(1, Math.min(3999, Number(value) || 1));
    const map=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let out='';
    for(const [v,symbol] of map){ while(n>=v){out+=symbol;n-=v;} }
    return out;
  }

  function buildRomanNumeralPool(rules) {
    const out = [];
    const max = Math.max(10, Math.min(100, rules.arithmeticMax));
    for (let n = 1; n <= max; n += 1) {
      const roman=toRoman(n);
      out.push({ kind:'roman_numerals', prompt:`${roman} =`, answer:n, key:`rom:n:${n}` });
      out.push({ kind:'roman_numerals', prompt:`Roman ${n} =`, answer:roman, key:`rom:r:${n}` });
    }
    return out;
  }

  function buildAngleFactsPool(rules) {
    const out = [];
    for (const total of (rules.angleTotals || [90,180,360])) {
      const step=total===90?5:10;
      for(let known=step;known<total;known+=step){
        out.push({ kind:'angle_facts', prompt:`${total}° - ${known}° =`, answer:total-known, key:`ang:${total}:${known}` });
      }
    }
    return out;
  }

  function buildSimpleAlgebraPool(rules) {
    const out = [];
    const xMax=Math.max(5,Math.min(20,rules.arithmeticOperandMax));
    const cMax=Math.max(5,Math.min(12,rules.factorMax));
    for(let x=1;x<=xMax;x+=1){
      for(let c=1;c<=cMax;c+=1){
        out.push({ kind:'simple_algebra', prompt:`x + ${c} = ${x+c}, x =`, answer:x, key:`alg:1:${x}:${c}` });
        if(x>c)out.push({ kind:'simple_algebra', prompt:`x - ${c} = ${x-c}, x =`, answer:x, key:`alg:2:${x}:${c}` });
      }
      for(let m=2;m<=Math.min(12,rules.factorMax);m+=1){
        out.push({ kind:'simple_algebra', prompt:`${m}x = ${m*x}, x =`, answer:x, key:`alg:3:${x}:${m}` });
        const c=((x+m)%9)+1;
        out.push({ kind:'simple_algebra', prompt:`${m}x + ${c} = ${m*x+c}, x =`, answer:x, key:`alg:4:${x}:${m}:${c}` });
      }
    }
    return out;
  }

  function poolForFamily(family, rules) {
    if (family === 'addition') return buildAdditionPool(rules);
    if (family === 'subtraction') return buildSubtractionPool(rules);
    if (family === 'multiply') return buildMultiplyPool(rules);
    if (family === 'divide') return buildDividePool(rules);
    if (family === 'missing_number') return buildMissingNumberPool(rules);
    if (family === 'square') return buildSquarePool(rules);
    if (family === 'square_root') return buildSquareRootPool(rules);
    if (family === 'cube') return buildCubePool(rules);
    if (family === 'bodmas') return buildBodmasPool(rules);
    if (family === 'scaled_multiply') return buildScaledMultiplyPool(rules);
    if (family === 'scaled_divide') return buildScaledDividePool(rules);
    if (family === 'fraction_of') return buildFractionOfPool(rules);
    if (family === 'percentage_of') return buildPercentageOfPool(rules);
    if (family === 'negative_numbers') return buildNegativeNumberPool(rules);
    if (family === 'roman_numerals') return buildRomanNumeralPool(rules);
    if (family === 'angle_facts') return buildAngleFactsPool(rules);
    if (family === 'simple_algebra') return buildSimpleAlgebraPool(rules);
    return [];
  }

  function weightedFamilyCounts(rules, rng) {
    const bag = [];
    for (const family of rules.families) {
      const weight = Math.max(1, Number(rules.familyWeights[family]) || 1);
      for (let i = 0; i < weight; i += 1) bag.push(family);
    }
    const cycle = shuffle(bag, rng);
    const counts = Object.fromEntries(rules.families.map(f => [f,0]));
    for (let i = 0; i < rules.questionCount; i += 1) counts[cycle[i % cycle.length]] += 1;
    return counts;
  }

  function generateFamilyMix(rules, rng) {
    const counts = weightedFamilyCounts(rules, rng);
    let out = [];
    for (const family of rules.families) {
      const count = counts[family] || 0;
      if (!count) continue;
      const pool = poolForFamily(family, rules);
      out = out.concat(balancedPick(pool, count, rng, rules));
    }
    return shuffle(out, rng);
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
    } else if (rules.mode === 'mixed') {
      // Keep this path byte-for-byte equivalent to v1.1 for Classic 88/99 regression safety.
      const multCount = Math.round(rules.questionCount * rules.multiplyPercent / 100);
      const divCount = rules.questionCount - multCount;
      const mult = balancedPick(buildMultiplyPool(rules), multCount, rng, rules);
      const div = balancedPick(buildDividePool(rules), divCount, rng, rules);
      questions = shuffle(mult.concat(div), rng);
    } else if (rules.mode === 'addition') {
      questions = balancedPick(buildAdditionPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'add_subtract') {
      const addCount = Math.ceil(rules.questionCount / 2);
      const subCount = rules.questionCount - addCount;
      questions = shuffle(
        balancedPick(buildAdditionPool(rules), addCount, rng, rules)
          .concat(balancedPick(buildSubtractionPool(rules), subCount, rng, rules)), rng);
    } else if (rules.mode === 'missing_number') {
      questions = balancedPick(buildMissingNumberPool(rules), rules.questionCount, rng, rules);
    } else if (rules.mode === 'family_mix') {
      questions = generateFamilyMix(rules, rng);
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
    if (r.mode === 'addition') maths = `addition · answers to ${r.arithmeticMax}`;
    if (r.mode === 'add_subtract') maths = `addition/subtraction · range to ${r.arithmeticMax}`;
    if (r.mode === 'missing_number') maths = `missing-number ${r.missingNumberOperations.join('/')} · tables ${compressNumbers(r.tables)}`;
    if (r.mode === 'family_mix') maths = `mixed mental maths · ${r.families.map(f => FAMILY_LABELS[f] || f).join(', ')}`;
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
    CLASSIC_PRESETS, CHALLENGE_PRESETS, SCHEME_PRESETS, FAMILY_LABELS,
    clone, normalizeRules, generateQuestions, shuffleQuestions,
    replaceQuestion, rulesSummary, instructionText, newSeed, rngFromSeed, compressNumbers
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  global.TT99Generator = api;
}(typeof window !== 'undefined' ? window : globalThis));
