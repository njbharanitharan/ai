const speciesInput = document.getElementById("speciesInput");
const speciesList = document.getElementById("speciesList");
const protocolOutput = document.getElementById("protocolOutput");
const previewCard = document.getElementById("previewCard");
const generateBtn = document.getElementById("generateBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");
const downloadBtn = document.getElementById("downloadBtn");
const readBtn = document.getElementById("readBtn");
const paramSearch = document.getElementById("paramSearch");
const wikiQuery = document.getElementById("wikiQuery");
const wikiSearchBtn = document.getElementById("wikiSearchBtn");
const wikiClearBtn = document.getElementById("wikiClearBtn");
const wikiReadBtn = document.getElementById("wikiReadBtn");
const wikiResults = document.getElementById("wikiResults");
const wikiSummary = document.getElementById("wikiSummary");
const wikiImage = document.getElementById("wikiImage");

const preferredVoiceName = "Alex";
let preferredVoice = null;

const inputs = {
  variant: document.getElementById("variant"),
  explant: document.getElementById("explant"),
  medium: document.getElementById("medium"),
  pgr: document.getElementById("pgr"),
  sterilization: document.getElementById("sterilization"),
  contamination: document.getElementById("contamination"),
  scale: document.getElementById("scale"),
  conditions: document.getElementById("conditions"),
  subculture: document.getElementById("subculture"),
  budget: document.getElementById("budget"),
  livePreview: document.getElementById("livePreview"),
  sucrose: document.getElementById("sucrose"),
  agar: document.getElementById("agar"),
  ph: document.getElementById("ph"),
  additiveAa: document.getElementById("additive_aa"),
  additiveCw: document.getElementById("additive_cw"),
  additiveAc: document.getElementById("additive_ac"),
  additiveVit: document.getElementById("additive_vit"),
  qcIdentity: document.getElementById("qc_identity"),
  qcContam: document.getElementById("qc_contam"),
  qcMedia: document.getElementById("qc_media"),
  qcPh: document.getElementById("qc_ph"),
  qcGrowth: document.getElementById("qc_growth"),
  notes: document.getElementById("notes")
};

const explantMap = {
  shoot_tip: "shoot tips",
  nodal: "nodal segments",
  leaf: "leaf discs",
  hypocotyl: "hypocotyl segments",
  embryo: "immature embryos",
  meristem: "meristematic tissue"
};

const mediumMap = {
  ms: "MS (Murashige & Skoog)",
  b5: "Gamborg B5",
  wpm: "Woody Plant Medium",
  nn: "Nitsch & Nitsch",
  custom: "custom basal medium"
};

const pgrMap = {
  balanced: "a low-cost balanced auxin/cytokinin strategy",
  shoot: "a cytokinin-forward shoot induction strategy",
  root: "an auxin-forward rooting strategy",
  none: "no exogenous growth regulators"
};

const sterilizationMap = {
  laminar: "standard laminar flow sterilization with ethanol and sodium hypochlorite",
  budget: "budget sterilization using a clean bench substitute and extended rinses",
  minimal: "minimal sterilants with extended pre-wash and rinse cycles"
};

const scaleMap = {
  pilot: "pilot scale (20-50 explants)",
  batch: "batch scale (100-250 explants)",
  production: "production scale (500+ explants)"
};

const conditionMap = {
  standard: "25±2°C with a 16/8 h light/dark photoperiod",
  cool: "22±2°C with a 16/8 h light/dark photoperiod",
  warm: "27±2°C with a 16/8 h light/dark photoperiod",
  dark: "25±2°C with 7 days in darkness before transfer to light"
};

const budgetMap = {
  strict: "strict cost minimization",
  balanced: "balanced cost control and performance",
  flexible: "flexible spending to optimize outcomes"
};

const variantMap = {
  auto: "species-based auto",
  microprop: "micropropagation",
  callus: "callus induction",
  embryogenesis: "somatic embryogenesis"
};

const contaminationMap = {
  low: "low contamination pressure",
  medium: "moderate contamination pressure",
  high: "high contamination pressure"
};

let speciesData = [];
let speciesCount = 0;
let referencesData = {};
let referencesLoaded = false;

function setOptions(list) {
  speciesList.innerHTML = "";
  list.forEach((item) => {
    const option = document.createElement("option");
    option.value = item;
    speciesList.appendChild(option);
  });
}

async function loadSpecies() {
  try {
    const response = await fetch("species_catalog.json");
    speciesData = await response.json();
    speciesCount = speciesData.length;
    setOptions(speciesData);
  } catch (error) {
    speciesData = ["Arabidopsis thaliana"];
    speciesCount = speciesData.length;
    setOptions(speciesData);
  }
}

async function loadReferences() {
  try {
    const response = await fetch("references_catalog.json");
    referencesData = await response.json();
    referencesLoaded = true;
  } catch (error) {
    referencesData = {};
    referencesLoaded = false;
  }
}

function seededInt(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function pickBySeed(list, seed, offset = 0) {
  const idx = (seed + offset) % list.length;
  return list[idx];
}

function normalizeSpeciesName(name) {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function getReferencesForSpecies(species) {
  if (!referencesData || typeof referencesData !== "object") return [];
  if (referencesData[species]) return referencesData[species];
  const genus = species.split(" ")[0] || species;
  if (referencesData[genus]) return referencesData[genus];
  return [];
}

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s)]+)/g;
  return text.replace(urlRegex, (url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`);
}


function buildProtocol(data) {
  const year = new Date().getFullYear();
  const header = `Academic Tissue Culture Protocol (${year})`;

  const normalizedSpecies = normalizeSpeciesName(data.species);
  const isPreset = speciesData.includes(data.species);
  const speciesSeed = seededInt(normalizedSpecies);
  const variantOverride = pickBySeed(["microprop", "callus", "embryogenesis"], speciesSeed);
  const mediumOverride = pickBySeed(["ms", "b5", "wpm", "nn"], speciesSeed, 3);
  const explantOverride = pickBySeed(["shoot_tip", "nodal", "leaf", "hypocotyl", "embryo", "meristem"], speciesSeed, 7);
  const pgrOverride = pickBySeed(["balanced", "shoot", "root", "none"], speciesSeed, 11);

  const variantFinal = data.variant === "auto" ? variantOverride : data.variant;
  const mediumFinal = data.medium === "auto" ? mediumOverride : data.medium;
  const explantFinal = data.explant === "auto" ? explantOverride : data.explant;
  const pgrFinal = data.pgr === "auto" ? pgrOverride : data.pgr;

  const sterilantTime = 5 + (speciesSeed % 8);
  const rinseCount = 3 + (speciesSeed % 4);
  const sucroseBase = 2.0 + (speciesSeed % 5) * 0.5;
  const agarBase = 0.6 + (speciesSeed % 5) * 0.1;
  const phBase = 5.4 + (speciesSeed % 6) * 0.1;
  const photoperiod = pickBySeed(["16/8 h", "14/10 h", "12/12 h", "10/14 h"], speciesSeed, 19);
  const lightIntensity = pickBySeed(
    ["25-45 µmol m⁻² s⁻¹", "40-60 µmol m⁻² s⁻¹", "60-80 µmol m⁻² s⁻¹", "80-100 µmol m⁻² s⁻¹"],
    speciesSeed,
    29
  );
  const subcultureDelta = (speciesSeed % 3) - 1; // -1, 0, +1
  const subcultureAdjusted = Math.max(3, Number(data.subculture) + subcultureDelta);
  const rootingWindow = 6 + (speciesSeed % 9);
  const antioxidant = pickBySeed(["ascorbic acid", "citric acid", "PVP", "activated charcoal", "reduced light preconditioning"], speciesSeed, 31);
  const lineage = pickBySeed(
    ["herbaceous", "woody", "succulent", "orchid-type", "grass-type", "aquatic-adapted"],
    speciesSeed,
    37
  );
  const initiationWindow = 8 + (speciesSeed % 10);
  const multiplicationCycles = 2 + (speciesSeed % 4);

  const summary = `This protocol targets ${data.species} using ${explantMap[explantFinal]} on ${mediumMap[mediumFinal]}. It is optimized for ${scaleMap[data.scale]} under ${budgetMap[data.budget]} constraints and configured for ${variantMap[variantFinal]}.${isPreset ? "" : " This species is not in the preset catalog; the protocol is a generalized academic template and should be calibrated with species-specific literature."}`;

  const mediaNotes = [];
  if (data.sucrose) mediaNotes.push(`Sucrose: ${data.sucrose}%`);
  if (data.agar) mediaNotes.push(`Agar: ${data.agar}%`);
  if (data.ph) mediaNotes.push(`pH: ${data.ph}`);
  if (data.additives.length) mediaNotes.push(`Additives: ${data.additives.join(", ")}`);

  const mediaWarnings = [];
  const phValue = Number(data.ph);
  if (data.ph && (phValue < 5.4 || phValue > 6.2)) {
    mediaWarnings.push("pH is outside the common 5.4–6.2 range; verify buffer and gelling stability.");
  }
  const agarValue = Number(data.agar);
  if (data.agar && (agarValue < 0.6 || agarValue > 1.2)) {
    mediaWarnings.push("Agar concentration is outside the typical 0.6–1.2% range; gel strength may vary.");
  }

  const donorPhrases = [
    "Select donor plants with documented health status and minimal pest pressure.",
    "Choose donor stock with traceable provenance and recent phytosanitary inspection.",
    "Prioritize donor plants with uniform growth and no visible physiological disorders."
  ];
  const excisionPhrases = [
    `Excise ${explantMap[explantFinal]} using sterile tools.`,
    `Isolate ${explantMap[explantFinal]} under aseptic conditions.`,
    `Harvest ${explantMap[explantFinal]} with minimal mechanical stress.`
  ];
  const prewashPhrases = [
    "Pre-wash explants in running water for 15-20 minutes with a mild detergent.",
    "Pre-rinse explants for 10-15 minutes, then soak briefly in diluted detergent.",
    "Rinse explants with flowing water, followed by a gentle surfactant wash."
  ];
  const incubationPhrases = [
    `Incubate cultures at ${conditionMap[data.conditions]} with ${photoperiod} photoperiod and ${lightIntensity} light intensity.`,
    `Maintain cultures at ${conditionMap[data.conditions]} and ${lightIntensity} light intensity under ${photoperiod} photoperiod.`,
    `Hold cultures at ${conditionMap[data.conditions]} using ${photoperiod} photoperiod; target ${lightIntensity} light intensity.`
  ];
  const baseSteps = [
    `${pickBySeed(donorPhrases, speciesSeed)} Schedule collection to avoid stress conditions and record source metadata.`,
    `${pickBySeed(excisionPhrases, speciesSeed, 2)} ${pickBySeed(prewashPhrases, speciesSeed, 4)}`,
    `Surface sterilize using ${sterilizationMap[data.sterilization]} under ${contaminationMap[data.contamination]} for ${sterilantTime} minutes. Follow with an ${antioxidant} rinse, then rinse ${rinseCount} times with sterile distilled water to reduce phytotoxicity.`,
    `Prepare ${mediumMap[mediumFinal]} supplemented with ${pgrMap[pgrFinal]}, ${sucroseBase.toFixed(1)}% sucrose, and ${agarBase.toFixed(1)}% agar. Adjust pH to ${phBase.toFixed(1)} before autoclaving.`,
    `Inoculate explants onto initiation medium, orienting tissues to maximize meristem exposure. Target an initiation window of ${initiationWindow} days before first transfer.`,
    `${pickBySeed(incubationPhrases, speciesSeed, 6)} Monitor for contamination daily for the first 7 days.`,
    `Subculture every ${subcultureAdjusted} weeks for ${multiplicationCycles} cycles. Discard contaminated cultures and maintain lineage records to prevent mix-ups.`,
    `Transition to multiplication medium and monitor shoot proliferation. Adjust PGR ratios incrementally to minimize physiological disorders.`,
    `Induce rooting with reduced salts and ${pgrFinal === "none" ? "endogenous auxin" : "auxin-forward conditions"} over ${rootingWindow}-${rootingWindow + 4} days. Harden plantlets for 7-10 days in high humidity.`,
    `Acclimatize in sterile substrate under gradual humidity reduction. Document survival rate, contamination frequency, and multiplication index.`
  ];

  const variantSteps = {
    microprop: [
      "Emphasize axillary bud break and shoot multiplication with sequential subculture cycles.",
      "Record multiplication index per passage and remove hyperhydric shoots early."
    ],
    callus: [
      "Switch to high-auxin callus induction medium and score callus texture and color weekly.",
      "Initiate organogenesis from friable callus with stepwise cytokinin increase."
    ],
    embryogenesis: [
      "Induce embryogenic callus under low-light or dark conditions for 2-3 weeks.",
      "Mature somatic embryos on reduced auxin medium and transfer to germination medium."
    ]
  };

  const budgetNotes = [
    `Use reusable glassware where feasible, prioritize bulk media preparation, and implement batch sterilization schedules to reduce per-unit costs.`,
    `Scale to ${scaleMap[data.scale]} by staging initiation and multiplication in waves to limit peak incubator occupancy.`
  ];

  const sterilizationDecision = buildSterilizationDecision(data.sterilization, data.contamination);
  const qc = buildQcSummary(data.qc);
  const speciesIntel = inferSpeciesProfile(data.species);
  const speciesAdjustments = buildSpeciesAdjustments(speciesSeed, lineage);
  const references = getReferencesForSpecies(data.species);

  const customNotes = data.notes.trim()
    ? [`Custom notes: ${data.notes.trim()}`]
    : [];

  return {
    header,
    summary,
    steps: [...baseSteps, ...variantSteps[variantFinal]],
    budgetNotes,
    customNotes,
    mediaNotes,
    mediaWarnings,
    sterilizationDecision,
    qc,
    speciesIntel,
    speciesAdjustments,
    references,
    variantFinal,
    fingerprint: {
      key: `PT-${speciesSeed % 10000}`,
      lineage,
      explant: explantMap[explantFinal],
      medium: mediumMap[mediumFinal],
      pgr: pgrMap[pgrFinal],
      variant: variantMap[variantFinal]
    }
  };
}

function renderProtocol(protocol) {
  protocolOutput.innerHTML = `
    <h3>${protocol.header}</h3>
    <p>${protocol.summary}</p>
    <div class="section-title">Protocol fingerprint</div>
    <ul>
      <li>Species key: ${protocol.fingerprint.key}</li>
      <li>Lineage profile: ${protocol.fingerprint.lineage}</li>
      <li>Auto explant: ${protocol.fingerprint.explant}</li>
      <li>Auto medium: ${protocol.fingerprint.medium}</li>
      <li>Auto PGR: ${protocol.fingerprint.pgr}</li>
      <li>Auto variant: ${protocol.fingerprint.variant}</li>
    </ul>
    <div class="section-title">Research references (3–4 key sources)</div>
    ${!referencesLoaded ? `<p class="placeholder">References not loaded yet. Please run the app via http://localhost:8000.</p>` : ""}
    ${protocol.references.length ? `<ul>${protocol.references.map((ref) => `<li>${linkify(ref)}</li>`).join("")}</ul>` : `<p class="placeholder">No references loaded for this species yet.</p>`}
    <div class="section-title">Species intelligence</div>
    <ul>
      ${protocol.speciesIntel.map((note) => `<li>${note}</li>`).join("")}
    </ul>
    <div class="section-title">Species-tuned adjustments</div>
    <ul>
      ${protocol.speciesAdjustments.map((note) => `<li>${note}</li>`).join("")}
    </ul>
    ${protocol.mediaWarnings.length ? `<div class="alert">${protocol.mediaWarnings.join(" ")}</div>` : ""}
    <div class="section-title">Step-by-step workflow</div>
    <ul>
      ${protocol.steps.map((step) => `<li>${step}</li>`).join("")}
    </ul>
    ${protocol.mediaNotes.length ? `<div class="section-title">Custom media builder</div>` : ""}
    ${protocol.mediaNotes.length ? `<ul>${protocol.mediaNotes.map((note) => `<li>${note}</li>`).join("")}</ul>` : ""}
    <div class="section-title">Sterilization decision</div>
    <ul>
      ${protocol.sterilizationDecision.map((note) => `<li>${note}</li>`).join("")}
    </ul>
    <div class="section-title">Budget and scale considerations</div>
    <ul>
      ${protocol.budgetNotes.map((note) => `<li>${note}</li>`).join("")}
    </ul>
    <div class="section-title">Quality control checklist</div>
    <p>${protocol.qc.summary}</p>
    <ul>
      ${protocol.qc.items.map((note) => `<li>${note}</li>`).join("")}
    </ul>
    ${protocol.customNotes.length ? `<div class="section-title">Custom notes</div>` : ""}
    ${protocol.customNotes.length ? `<ul>${protocol.customNotes.map((note) => `<li>${note}</li>`).join("")}</ul>` : ""}
  `;

  previewCard.innerHTML = `
    <h3>${protocol.header}</h3>
    <p>${protocol.summary}</p>
  `;
}


function inferSpeciesProfile(species) {
  const genus = species.split(" ")[0] || species;
  const woodyGenera = new Set(["Quercus", "Eucalyptus", "Pinus", "Picea", "Malus", "Prunus", "Citrus", "Vitis", "Ficus"]);
  const monocotGenera = new Set(["Oryza", "Zea", "Triticum", "Hordeum", "Allium", "Musa", "Lilium", "Dendrobium", "Phalaenopsis"]);
  const notes = [];
  notes.push(`Genus detected: ${genus}.`);
  if (woodyGenera.has(genus)) {
    notes.push("Woody lineage likely; consider WPM or reduced ammonium for callus and shoot quality.");
  }
  if (monocotGenera.has(genus)) {
    notes.push("Monocot lineage likely; monitor for phenolic exudation and adjust antioxidants if browning occurs.");
  }
  if (!woodyGenera.has(genus) && !monocotGenera.has(genus)) {
    notes.push("General angiosperm assumptions applied; refine with species-specific literature.");
  }
  return notes;
}

function buildSpeciesAdjustments(seed, lineage) {
  const antioxidant = pickBySeed(
    ["ascorbic acid rinse", "citric acid rinse", "PVP addition", "activated charcoal pre-filter"],
    seed,
    13
  );
  const light = pickBySeed(
    ["40-60 µmol m⁻² s⁻¹", "60-80 µmol m⁻² s⁻¹", "20-40 µmol m⁻² s⁻¹"],
    seed,
    17
  );
  const initiationDays = 10 + (seed % 7);
  const subcultureNote = pickBySeed(
    ["reduce subculture interval by 1 week after passage 2", "extend subculture interval by 1 week if vitrification appears", "maintain constant interval across passages"],
    seed,
    23
  );
  return [
    `Lineage heuristic: ${lineage}.`,
    `Suggested antioxidant strategy: ${antioxidant}.`,
    `Initiation window target: ${initiationDays}-day observation before first transfer.`,
    `Light intensity cue: ${light}.`,
    `Passage guidance: ${subcultureNote}.`,
    `Species calibration key: PT-${seed % 10000}.`
  ];
}

function buildSterilizationDecision(setup, risk) {
  const decisions = [
    `Setup: ${sterilizationMap[setup]}.`,
    `Risk level: ${contaminationMap[risk]}.`
  ];
  if (risk === "high") {
    decisions.push("Add a pre-soak step with antioxidant rinse and extend sterilant exposure by 2-3 minutes.");
  } else if (risk === "medium") {
    decisions.push("Include a brief surfactant wash and increase rinse count to 5.");
  } else {
    decisions.push("Standard exposure times are acceptable with strict aseptic handling.");
  }
  return decisions;
}

function buildQcSummary(qc) {
  const items = [
    { label: "Identity verified", value: qc.identity },
    { label: "Contamination log maintained", value: qc.contam },
    { label: "Media batch recorded", value: qc.media },
    { label: "pH calibration recorded", value: qc.ph },
    { label: "Growth metrics captured", value: qc.growth }
  ];
  const completed = items.filter((item) => item.value).length;
  const summary = `QC coverage: ${completed}/${items.length} checkpoints completed.`;
  const list = items.map((item) => `${item.value ? "Complete" : "Pending"} — ${item.label}`);
  return { summary, items: list };
}

function gatherInputs() {
  const speciesValue = speciesInput.value.trim();
  return {
    species: speciesValue || "Arabidopsis thaliana",
    variant: inputs.variant.value,
    explant: inputs.explant.value,
    medium: inputs.medium.value,
    pgr: inputs.pgr.value,
    sterilization: inputs.sterilization.value,
    contamination: inputs.contamination.value,
    scale: inputs.scale.value,
    conditions: inputs.conditions.value,
    subculture: inputs.subculture.value,
    budget: inputs.budget.value,
    livePreview: inputs.livePreview.value,
    sucrose: inputs.sucrose.value,
    agar: inputs.agar.value,
    ph: inputs.ph.value,
    additives: [
      inputs.additiveAa.checked ? "amino acids" : null,
      inputs.additiveCw.checked ? "coconut water" : null,
      inputs.additiveAc.checked ? "activated charcoal" : null,
      inputs.additiveVit.checked ? "vitamins" : null
    ].filter(Boolean),
    qc: {
      identity: inputs.qcIdentity.checked,
      contam: inputs.qcContam.checked,
      media: inputs.qcMedia.checked,
      ph: inputs.qcPh.checked,
      growth: inputs.qcGrowth.checked
    },
    notes: inputs.notes.value
  };
}

function generateProtocol() {
  const data = gatherInputs();
  const protocol = buildProtocol(data);
  renderProtocol(protocol);
}

function resetForm() {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
  speciesInput.value = "";
  Object.values(inputs).forEach((input) => {
    if (input.tagName === "TEXTAREA") {
      input.value = "";
    } else if (input.type === "checkbox") {
      input.checked = false;
    } else if (input.tagName === "INPUT") {
      input.value = "";
    } else {
      input.selectedIndex = 0;
    }
  });
  inputs.variant.value = "auto";
  inputs.explant.value = "auto";
  inputs.medium.value = "auto";
  inputs.pgr.value = "auto";
  protocolOutput.innerHTML = "<p class=\"placeholder\">Your protocol will appear here after generation.</p>";
  previewCard.innerHTML = `
    <h3>Ready when you are</h3>
    <p>Select a species, choose constraints, and generate a protocol tailored to your lab.</p>
    <ul class="quick-list">
      <li>Academic tone</li>
      <li>1,000 species suggestions</li>
      <li>Step-by-step workflow</li>
    </ul>
  `;
}

function copyProtocol() {
  const text = protocolOutput.innerText.trim();
  if (!text) return;
  navigator.clipboard.writeText(text);
}

function downloadProtocol() {
  const text = protocolOutput.innerText.trim();
  if (!text) return;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "tissue_culture_protocol.txt";
  link.click();
  URL.revokeObjectURL(url);
}

function resolveVoice() {
  if (!window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  preferredVoice = voices.find((voice) => voice.name === preferredVoiceName) || null;
}

function readProtocol() {
  if (!window.speechSynthesis) {
    alert("Speech synthesis is not supported in this browser.");
    return;
  }
  const text = protocolOutput.innerText.trim();
  if (!text) return;

  const isSpeaking = window.speechSynthesis.speaking;
  if (isSpeaking) {
    window.speechSynthesis.cancel();
    readBtn.textContent = "Read Aloud";
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  if (!preferredVoice) {
    resolveVoice();
  }
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  utterance.rate = 0.95;
  utterance.onend = () => {
    readBtn.textContent = "Read Aloud";
  };
  utterance.onerror = () => {
    readBtn.textContent = "Read Aloud";
  };
  readBtn.textContent = "Stop";
  window.speechSynthesis.speak(utterance);
}

function handleLivePreview() {
  if (inputs.livePreview.value === "on") {
    generateProtocol();
  }
}

function filterParameters() {
  const query = paramSearch.value.trim().toLowerCase();
  document.querySelectorAll(".field[data-field]").forEach((field) => {
    const label = field.querySelector("span")?.textContent.toLowerCase() || "";
    const key = field.dataset.field || "";
    if (!query || label.includes(query) || key.includes(query)) {
      field.classList.remove("hidden");
    } else {
      field.classList.add("hidden");
    }
  });
}

async function searchWikipedia() {
  if (!wikiQuery || !wikiResults) return;
  const query = wikiQuery.value.trim();
  if (!query) {
    wikiResults.innerHTML = "<p class=\"placeholder\">Enter a search term.</p>";
    if (wikiSummary) {
      wikiSummary.querySelector(".wiki-summary-text").innerHTML = "<p class=\"placeholder\">Top result summary will appear here.</p>";
    }
    if (wikiImage) {
      wikiImage.style.display = "none";
      wikiImage.src = "";
    }
    return;
  }
  wikiResults.innerHTML = "<p class=\"placeholder\">Searching Wikipedia...</p>";
  if (wikiSummary) {
    wikiSummary.querySelector(".wiki-summary-text").innerHTML = "<p class=\"placeholder\">Loading top result...</p>";
  }
  if (wikiImage) {
    wikiImage.style.display = "none";
    wikiImage.src = "";
  }
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    const results = data?.query?.search || [];
    if (!results.length) {
      wikiResults.innerHTML = "<p class=\"placeholder\">No results found.</p>";
      if (wikiSummary) {
        wikiSummary.querySelector(".wiki-summary-text").innerHTML = "<p class=\"placeholder\">No summary available.</p>";
      }
      return;
    }
    const topTitle = results[0].title;
    await loadWikipediaSummary(topTitle);
    wikiResults.innerHTML = results.slice(0, 5).map((item) => {
      const snippet = item.snippet.replace(/<[^>]+>/g, "");
      return `
        <div class="wiki-item">
          <div class="wiki-title">${item.title}</div>
          <p>${snippet}...</p>
        </div>
      `;
    }).join("");
  } catch (error) {
    wikiResults.innerHTML = "<p class=\"placeholder\">Wikipedia search failed. Please try again.</p>";
    if (wikiSummary) {
      wikiSummary.querySelector(".wiki-summary-text").innerHTML = "<p class=\"placeholder\">Summary fetch failed.</p>";
    }
  }
}

async function loadWikipediaSummary(title) {
  if (!wikiSummary) return;
  const summaryBox = wikiSummary.querySelector(".wiki-summary-text");
  try {
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const response = await fetch(summaryUrl);
    const data = await response.json();
    const extract = data?.extract || "No summary available.";
    summaryBox.innerHTML = "";
    const p = document.createElement("p");
    p.textContent = extract;
    summaryBox.appendChild(p);
    const thumb = data?.thumbnail?.source;
    if (wikiImage && thumb) {
      wikiImage.src = thumb;
      wikiImage.style.display = "block";
    } else if (wikiImage) {
      wikiImage.style.display = "none";
      wikiImage.src = "";
    }
  } catch (error) {
    summaryBox.innerHTML = "<p class=\"placeholder\">Summary fetch failed.</p>";
  }
}

function clearWikipedia() {
  if (!wikiQuery || !wikiResults) return;
  wikiQuery.value = "";
  wikiResults.innerHTML = "<p class=\"placeholder\">Results will appear here.</p>";
  if (wikiSummary) {
    wikiSummary.querySelector(".wiki-summary-text").innerHTML = "<p class=\"placeholder\">Top result summary will appear here.</p>";
  }
  if (wikiImage) {
    wikiImage.style.display = "none";
    wikiImage.src = "";
  }
}

function readWikiAloud() {
  if (!window.speechSynthesis) {
    alert("Speech synthesis is not supported in this browser.");
    return;
  }
  const summaryText = wikiSummary ? wikiSummary.textContent.trim() : "";
  const resultsText = wikiResults ? wikiResults.textContent.trim() : "";
  const text = [summaryText, resultsText].filter(Boolean).join(". ");
  if (!text) return;

  if (window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    if (wikiReadBtn) wikiReadBtn.textContent = "Read Aloud";
    return;
  }

  const utterance = new SpeechSynthesisUtterance(text);
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  utterance.rate = 0.95;
  utterance.onend = () => {
    if (wikiReadBtn) wikiReadBtn.textContent = "Read Aloud";
  };
  utterance.onerror = () => {
    if (wikiReadBtn) wikiReadBtn.textContent = "Read Aloud";
  };
  if (wikiReadBtn) wikiReadBtn.textContent = "Stop";
  window.speechSynthesis.speak(utterance);
}

generateBtn.addEventListener("click", generateProtocol);
resetBtn.addEventListener("click", resetForm);
copyBtn.addEventListener("click", copyProtocol);
downloadBtn.addEventListener("click", downloadProtocol);
readBtn.addEventListener("click", readProtocol);
paramSearch.addEventListener("input", filterParameters);
if (wikiSearchBtn) wikiSearchBtn.addEventListener("click", searchWikipedia);
if (wikiClearBtn) wikiClearBtn.addEventListener("click", clearWikipedia);
if (wikiReadBtn) wikiReadBtn.addEventListener("click", readWikiAloud);
if (wikiQuery) {
  wikiQuery.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      searchWikipedia();
    }
  });
}
if (wikiResults) {
  wikiResults.addEventListener("click", (event) => {
    if (event.target && event.target.tagName === "A") {
      event.preventDefault();
    }
  });
}
if (wikiSummary) {
  wikiSummary.addEventListener("click", (event) => {
    if (event.target && event.target.tagName === "A") {
      event.preventDefault();
    }
  });
}
Object.values(inputs).forEach((input) => {
  if (input) {
    input.addEventListener("input", handleLivePreview);
    input.addEventListener("change", handleLivePreview);
  }
});

loadSpecies();
loadReferences();

if (window.speechSynthesis) {
  resolveVoice();
  window.speechSynthesis.onvoiceschanged = resolveVoice;
}
