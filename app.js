
const ALPHABET = "АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯ";
const POLY = [
  "А", "Б", "В", "Г", "Ґ", "Д",
  "Е", "Є", "Ж", "З", "И", "І",
  "Ї", "Й", "К", "Л", "М", "Н",
  "О", "П", "Р", "С", "Т", "У",
  "Ф", "Х", "Ц", "Ч", "Ш", "Щ",
  "Ь", "Ю", "Я", " ", ".", ","
];

const $ = id => document.getElementById(id);
const mod = (n, m) => ((n % m) + m) % m;
const clean = s => s.toLocaleUpperCase("uk-UA");

function caesar(text, key, mode) {
  const k = Number(key) * (mode === "dec" ? -1 : 1);
  return [...clean(text)]
    .map(ch => {
      let i = ALPHABET.indexOf(ch);
      return i < 0 ? ch : ALPHABET[mod(i + k, 33)];
    })
    .join("");
}

function vigenere(text, key, mode) {
  key = clean(key).replace(/\s/g, "");
  if (!key)
    throw Error("Вкажіть непорожній ключ з українських літер.");
  if ([...key].some(c => !ALPHABET.includes(c)))
    throw Error("Ключ має містити лише літери українського алфавіту.");

  let j = 0, steps = [];
  let out = [...clean(text)]
    .map(ch => {
      let p = ALPHABET.indexOf(ch);
      if (p < 0) return ch;
      let k = ALPHABET.indexOf(key[j % key.length]);
      let c = mod(p + (mode === "dec" ? -2 : 2) * k, 33);
      steps.push(
        `${ch}(${p}) ${mode === "dec" ? "−" : "+"} 2·${key[j % key.length]}(${k}) → ${ALPHABET[c]}(${c})`
      );
      j++;
      return ALPHABET[c];
    })
    .join("");

  return { out, steps };
}

function polybius(text, mode) {
  if (mode === "enc") {
    let out = [], steps = [];
    for (const ch of clean(text)) {
      let i = POLY.indexOf(ch);
      if (i < 0)
        throw Error(`Символ «${ch}» відсутній у квадраті Полібія.`);
      let code = `${Math.floor(i / 6) + 1}${i % 6 + 1}`;
      out.push(code);
      steps.push(`${ch === " " ? "␣" : ch} → ${code}`);
    }
    return { out: out.join(" "), steps };
  }

  let digits = clean(text).replace(/[\s,;]+/g, "");
  if (!/^\d*$/.test(digits) || digits.length % 2)
    throw Error("Для розшифрування введіть парну послідовність координат (наприклад: 41 34 21).");

  let out = "", steps = [];
  for (let i = 0; i < digits.length; i += 2) {
    let r = Number(digits[i]), c = Number(digits[i + 1]);
    if (r < 1 || r > 6 || c < 1 || c > 6)
      throw Error(`Некоректна координата ${digits.slice(i, i + 2)}.`);
    let ch = POLY[(r - 1) * 6 + c - 1];
    out += ch;
    steps.push(`${digits.slice(i, i + 2)} → ${ch === " " ? "пробіл" : ch}`);
  }
  return { out, steps };
}

function renderPoly() {
  let html = '<table class="poly-table"><tr><th>№</th>' +
    [1, 2, 3, 4, 5, 6].map(x => `<th>${x}</th>`).join("") +
    '</tr>';

  for (let r = 0; r < 6; r++) {
    html += `<tr><th>${r + 1}</th>` +
      POLY.slice(r * 6, r * 6 + 6)
        .map(ch => `<td>${ch === " " ? "␣" : ch}</td>`)
        .join("") +
      '</tr>';
  }
  return html + '</table>';
}

function renderVig() {
  let h = '<table><tr><th>i</th>' +
    [...ALPHABET].map(c => `<th>${c}</th>`).join("") +
    '</tr>';

  for (let r = 0; r < 33; r++) {
    h += `<tr><th>${r}</th>` +
      [...ALPHABET].map((_, c) => `<td>${ALPHABET[(c + 2 * r) % 33]}</td>`).join("") +
      '</tr>';
  }
  return h + '</table>';
}

function showSteps(id, steps) {
  $(id).innerHTML =
    steps.map((s, i) => `${i + 1}. ${s}`).join("<br>") ||
    "Немає символів для перетворення.";
}

function runCaesar() {
  try {
    $("caesarOut").textContent = caesar(
      $("caesarText").value,
      $("caesarKey").value,
      $("caesarMode").value
    );
    $("caesarSteps").textContent =
      `Формула: ${$("caesarMode").value === "enc"
        ? "Cᵢ = (Pᵢ + k) mod 33"
        : "Pᵢ = (Cᵢ − k) mod 33"}. Ключ k = ${$("caesarKey").value}.`;
  } catch (e) {
    alert(e.message);
  }
}

function runVig() {
  try {
    let r = vigenere(
      $("vigText").value,
      $("vigKey").value,
      $("vigMode").value
    );
    $("vigOut").textContent = r.out;
    showSteps("vigSteps", r.steps);
  } catch (e) {
    alert(e.message);
  }
}

function runPoly() {
  try {
    let r = polybius($("polyText").value, $("polyMode").value);
    $("polyOut").textContent = r.out;
    showSteps("polySquare", []);
    $("polySquare").innerHTML = renderPoly();
    $("polySteps")?.remove();

    let details = $("polySquare").parentElement;
    let div = document.createElement("div");
    div.className = "steps";
    div.id = "polySteps";
    div.innerHTML = r.steps.map((s, i) => `${i + 1}. ${s}`).join("<br>");
    details.appendChild(div);
  } catch (e) {
    alert(e.message);
  }
}

function egcd(a, b) {
  if (b === 0n) return [a, 1n, 0n];
  let [g, x, y] = egcd(b, a % b);
  return [g, y, x - (a / b) * y];
}

function inv(a, m) {
  let [g, x] = egcd(a, m);
  if (g !== 1n)
    throw Error("d не має оберненого елемента за модулем φ(N).");
  return ((x % m) + m) % m;
}

function powMod(base, exp, modulus) {
  if (modulus <= 0n) throw Error("Модуль має бути додатним.");
  let result = 1n;
  base %= modulus;
  while (exp > 0n) {
    if (exp & 1n) result = result * base % modulus;
    base = base * base % modulus;
    exp >>= 1n;
  }
  return result;
}

function gcd(a, b) {
  while (b) { [a, b] = [b, a % b]; }
  return a;
}

function prime(n) {
  if (n < 2n) return false;
  if (n % 2n === 0n) return n === 2n;
  for (let i = 3n; i * i <= n; i += 2n) {
    if (n % i === 0n) return false;
  }
  return true;
}

let rsaState = null;

function calcRSA() {
  try {
    let p = BigInt($("rsaP").value),
        q = BigInt($("rsaQ").value),
        d = BigInt($("rsaD").value);

    if (!prime(p) || !prime(q) || p === q)
      throw Error("p і q мають бути різними простими числами.");

    let N = p * q,
        phi = (p - 1n) * (q - 1n);

    if (d <= 1n || d >= phi || gcd(d, phi) !== 1n)
      throw Error("d має бути в межах 1 < d < φ(N) та взаємно простим із φ(N).");

    let e = inv(d, phi);
    rsaState = { p, q, d, N, phi, e };

    $("rsaMetrics").innerHTML = [
      ["Модуль N", N],
      ["Функція Ейлера φ(N)", phi],
      ["Відкрита експонента e", e]
    ].map(([l, v]) =>
      `<div><span>${l}</span><strong>${v.toLocaleString("en-US")}</strong></div>`
    ).join("");

    $("rsaSteps").innerHTML =
      `N = p·q = ${N}<br>` +
      `φ(N) = (p−1)(q−1) = ${phi}<br>` +
      `e = d⁻¹ mod φ(N) = ${e}<br>` +
      `d·e mod φ(N) = ${(d * e) % phi} <span class="ok">✓</span><br>` +
      `Відкритий ключ: (e, N) = (${e}, ${N})<br>` +
      `Закритий ключ: (d, N) = (${d}, ${N})`;
  } catch (e) {
    alert(e.message);
  }
}

function needRSA() {
  if (!rsaState) calcRSA();
  if (!rsaState) throw Error("Не вдалося обчислити параметри RSA.");
}

function rsaEncrypt() {
  try {
    needRSA();
    let { N, e } = rsaState;
    let raw = $("rsaM").value.trim();
    if (!/^\d+$/.test(raw))
      throw Error("M має бути невід'ємним цілим числом.");

    let M = BigInt(raw), out = [], steps = [];

    if ($("rsaBlockMode").value === "mod") {
      let m = M % N, c = powMod(m, e, N);
      out = [c.toString()];
      steps.push(
        `M' = M mod N = ${m}`,
        `C = (M')^e mod N = ${c}`
      );
    } else {
      let s = raw, blocks = [];
      for (let i = 0; i < s.length; i += 5) blocks.push(s.slice(i, i + 5));

      for (let i = 0; i < blocks.length; i++) {
        let b = BigInt(blocks[i]);
        if (b >= N)
          throw Error("Блок перевищує N; збільшіть розмір блока або оберіть режим M mod N.");
        let c = powMod(b, e, N);
        out.push(c.toString());
        steps.push(`Блок ${i + 1}: ${b}^${e} mod ${N} = ${c}`);
      }
    }

    $("rsaEncOut").textContent = out.join("  ");
    $("rsaSteps").innerHTML = steps.join("<br>");
  } catch (e) {
    alert(e.message);
  }
}

function rsaDecrypt() {
  try {
    needRSA();
    let { N, d, e } = rsaState,
        raw = $("rsaC").value.trim();
    if (!/^\d+$/.test(raw))
      throw Error("C має бути невід'ємним цілим числом.");

    let c = BigInt(raw);
    if (c >= N) throw Error("Для одного RSA-блока потрібно C < N.");

    let m = powMod(c, d, N),
        check = powMod(m, e, N);

    $("rsaDecOut").textContent = m.toString();
    $("rsaSteps").innerHTML =
      `M' = C^d mod N = ${m}<br>` +
      `Перевірка: (M')^e mod N = ${check}<br>` +
      `${check === c
        ? "Шифртекст відновлено правильно ✓"
        : "Перевірка не пройдена"}`;
  } catch (e) {
    alert(e.message);
  }
}

document.querySelectorAll(".tab").forEach(b =>
  b.addEventListener("click", () => {
    document.querySelectorAll(".tab,.panel").forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    $(b.dataset.tab).classList.add("active");
  })
);

$("caesarRun").onclick = runCaesar;
$("caesarSwap").onclick = () => {
  $("caesarText").value = $("caesarOut").textContent;
  $("caesarMode").value = $("caesarMode").value === "enc" ? "dec" : "enc";
};

$("vigRun").onclick = runVig;
$("vigSwap").onclick = () => {
  $("vigText").value = $("vigOut").textContent;
  $("vigMode").value = $("vigMode").value === "enc" ? "dec" : "enc";
};

$("showVigSquare").onclick = () => {
  $("vigSquareWrap").classList.toggle("hidden");
  if (!$("vigSquareWrap").classList.contains("hidden"))
    $("vigSquare").innerHTML = renderVig();
};

$("polyRun").onclick = runPoly;
$("polySwap").onclick = () => {
  $("polyText").value = $("polyOut").textContent;
  $("polyMode").value = $("polyMode").value === "enc" ? "dec" : "enc";
};

$("rsaCalc").onclick = calcRSA;
$("rsaEncrypt").onclick = rsaEncrypt;
$("rsaDecrypt").onclick = rsaDecrypt;

document.querySelectorAll(".copy").forEach(b =>
  b.onclick = () => {
    let t = $(b.dataset.copy).textContent;
    navigator.clipboard?.writeText(t)
      .then(() => {
        b.textContent = "Скопійовано";
        setTimeout(() => b.textContent = "Копіювати", 1200);
      })
      .catch(() => alert("Не вдалося скопіювати автоматично."));
  }
);

$("polySquare").innerHTML = renderPoly();
runCaesar();
runVig();
runPoly();
calcRSA();
rsaEncrypt();
rsaDecrypt();
