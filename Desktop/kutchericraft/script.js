const setlist = [];

document.getElementById("songForm").addEventListener("submit", function (e) {
  e.preventDefault();

  const song = {
    title: document.getElementById("title").value.trim(),
    raga: document.getElementById("raga").value.trim(),
    tala: document.getElementById("tala").value.trim(),
    composer: document.getElementById("composer").value.trim().toLowerCase(),
    tempo: document.getElementById("tempo").value.trim(),
    type: document.getElementById("type").value.trim(),
  };

  setlist.push(song);
  renderSetlist();
  const { score, feedback, fatal } = evaluateSetlist();
  renderFeedback(feedback, score, fatal);
  document.getElementById("songForm").reset();
});

function renderSetlist() {
  const list = document.getElementById("setlist");
  list.innerHTML = "";
  setlist.forEach((song, index) => {
    const item = document.createElement("li");
    item.textContent = `${index + 1}. ${song.title} – ${song.raga} – ${song.type}`;
    list.appendChild(item);
  });
}

function renderFeedback(feedback, score, fatal) {
  document.getElementById("feedback").innerHTML = feedback
    .map((f) => `<p>${f}</p>`)
    .join("");
  document.getElementById("score").textContent = fatal ? "0" : score;
}

function evaluateSetlist() {
  const usedRagas = new Set();
  const composerCount = {};
  const talaCount = {};
  let slowStreak = 0;
  let score = 100;
  const feedback = [];

  let hasVarnam = false;

  for (let i = 0; i < setlist.length; i++) {
    const song = setlist[i];

    // Check for raga reuse
    if (usedRagas.has(song.raga)) {
      return { score: 0, fatal: true, feedback: ["❌ Raga reused: " + song.raga] };
    }
    usedRagas.add(song.raga);

    // Varnam must be first (if it exists)
    if (song.type === "Varnam") {
      hasVarnam = true;
      if (i !== 0) {
        return {
          score: 0,
          fatal: true,
          feedback: ["❌ Varnam must be the first item if included."],
        };
      }
    }

    // Thillana must be in the last 3 songs
    if (song.type === "Thillana" && i < setlist.length - 3) {
      return {
        score: 0,
        fatal: true,
        feedback: ["❌ Thillana should be in the last 3 pieces."],
      };
    }

    // Track composer, tala
    composerCount[song.composer] = (composerCount[song.composer] || 0) + 1;
    talaCount[song.tala] = (talaCount[song.tala] || 0) + 1;

    // Tempo streak penalty
    if (song.tempo === "Slow") {
      slowStreak++;
      if (slowStreak > 2) {
        score -= 5;
        feedback.push("⚠️ Too many slow songs in a row.");
      }
    } else {
      slowStreak = 0;
    }
  }

  // Composer repetition penalty
  Object.entries(composerCount).forEach(([composer, count]) => {
    if (count > 2) {
      score -= 5;
      feedback.push(`⚠️ Composer '${composer}' used ${count} times.`);
    }
  });

  // Tala repetition penalty
  Object.entries(talaCount).forEach(([tala, count]) => {
    if (count > 3) {
      score -= 5;
      feedback.push(`⚠️ Tala '${tala}' appears ${count} times.`);
    }
  });

  if (score === 100) {
    feedback.push("✅ Excellent structure!");
  }

  return { score, feedback, fatal: false };
}
