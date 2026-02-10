// Redirect to login if not authenticated
if (!localStorage.getItem('authToken')) {
  window.location.href = 'auth.html';
}

const saveBtn = document.getElementById("saveBtn");
const log = document.getElementById("log");
const riskScoreText = document.getElementById("riskScore");
const warningText = document.getElementById("warning");
const trendText = document.getElementById("trendWarning");
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const themeToggle = document.getElementById("themeToggle");
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');

const sleep = document.getElementById("sleep");
const water = document.getElementById("water");
const stress = document.getElementById("stress");

// Symptom checkboxes
const symptomCheckboxes = [
  'symptom_fatigue', 'symptom_headache', 'symptom_fever',
  'symptom_cough', 'symptom_throat', 'symptom_aches',
  'symptom_dizziness', 'symptom_nausea', 'symptom_chills'
].map(id => document.getElementById(id));

let entries = JSON.parse(localStorage.getItem("healthEntries")) || [];

/* DARK MODE */
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark");
  themeToggle.textContent = "☀️ Light Mode";
}

themeToggle.onclick = () => {
  document.body.classList.toggle("dark");
  const isDark = document.body.classList.contains("dark");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  themeToggle.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
};

/* SERVER API */
async function fetchEntriesFromServer() {
  try {
    const headers = {};
    const token = localStorage.getItem('authToken');
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/.netlify/functions/get-entries', { headers });
    if (!res.ok) throw new Error('Network error');
    const data = await res.json();
    if (Array.isArray(data) && data.length) {
      entries = data;
      localStorage.setItem("healthEntries", JSON.stringify(entries));
    }
  } catch (err) {
    // silent fallback to localStorage
  }
}

async function saveEntryToServer(entry) {
  try {
    const token = localStorage.getItem('authToken');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/.netlify/functions/save-entry', {
      method: 'POST',
      headers,
      body: JSON.stringify(entry)
    });
    if (!res.ok) throw new Error('Save failed');
    const updated = await res.json();
    if (Array.isArray(updated)) {
      entries = updated;
      localStorage.setItem("healthEntries", JSON.stringify(entries));
    }
  } catch (err) {
    // fallback: keep local copy only
    entries.push(entry);
    entries = entries.slice(-30);
    localStorage.setItem("healthEntries", JSON.stringify(entries));
    // Still saved locally
  }
}

/* AUTH CLIENT */
function logout() {
  localStorage.removeItem('authToken');
  localStorage.removeItem('authEmail');
  window.location.href = 'auth.html';
}

/* SAVE ENTRY */
saveBtn.onclick = async () => {
  if (!sleep.value || !water.value || !stress.value) return;

  // Get selected symptoms
  const selectedSymptoms = symptomCheckboxes
    .filter(checkbox => checkbox.checked)
    .map(checkbox => checkbox.value)
    .join(', ');

  saveBtn.disabled = true;
  const originalText = saveBtn.textContent;
  saveBtn.textContent = 'Saving...';

  const entry = {
    date: new Date().toISOString().split("T")[0],
    sleep: Number(sleep.value),
    water: Number(water.value),
    stress: Number(stress.value),
    symptoms: selectedSymptoms || 'none'
  };

  try {
    await saveEntryToServer(entry);
    saveBtn.textContent = '✓ Saved!';
    sleep.value = '';
    water.value = '';
    stress.value = '';
    symptomCheckboxes.forEach(checkbox => checkbox.checked = false);
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 2000);
    updateUI();
  } catch (err) {
    saveBtn.textContent = '❌ Save failed';
    setTimeout(() => {
      saveBtn.textContent = originalText;
      saveBtn.disabled = false;
    }, 2000);
  }
};

function calculateRisk(e) {
  let r = 0;
  if (e.sleep < 6) r += 2;
  if (e.water < 2) r += 1;
  if (e.stress >= 4) r += 2;
  
  // Check for symptoms (handle both old 'symptom' and new 'symptoms' fields)
  const symptoms = e.symptoms || e.symptom || 'none';
  if (symptoms && symptoms !== 'none') r += 2;
  
  return r;
}

function analyzeTrends(last7) {
  if (last7.length < 4) return "Not enough data yet.";
  const avgSleep = last7.reduce((a,e)=>a+e.sleep,0)/last7.length;
  const avgStress = last7.reduce((a,e)=>a+e.stress,0)/last7.length;
  const symptomDays = last7.filter(e=>{
    const symptoms = e.symptoms || e.symptom || 'none';
    return symptoms && symptoms !== 'none';
  }).length;

  if (avgSleep < 6) return "⚠️ Low sleep trend detected.";
  if (avgStress > 3.5) return "⚠️ High stress trend detected.";
  if (symptomDays >= 3) return "⚠️ Symptoms persisting.";

  return "✅ No concerning trends.";
}

function drawChart(last7) {
  ctx.clearRect(0,0,canvas.width,canvas.height);

  const baseY = 180;
  const height = 160;
  const startX = 20;
  const gap = 55;

  // Draw legend
  ctx.fillStyle = "#2563eb";
  ctx.fillRect(10, 10, 12, 12);
  ctx.fillStyle = "var(--text)";
  ctx.font = "12px system-ui";
  ctx.fillText("Sleep", 28, 18);

  ctx.fillStyle = "#dc2626";
  ctx.fillRect(110, 10, 12, 12);
  ctx.fillStyle = "var(--text)";
  ctx.fillText("Stress", 128, 18);

  // Draw sleep line
  ctx.beginPath();
  ctx.strokeStyle = "#2563eb";
  last7.forEach((e,i)=>{
    const x = startX + i*gap;
    const y = baseY - (e.sleep/10)*height;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();

  // Draw stress line
  ctx.beginPath();
  ctx.strokeStyle = "#dc2626";
  last7.forEach((e,i)=>{
    const x = startX + i*gap;
    const y = baseY - (e.stress/5)*height;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();
}

function updateUI() {
  if (!entries.length) {
    riskScoreText.textContent = "No data yet.";
    warningText.textContent = "Add your first entry.";
    trendText.textContent = "Not enough data yet.";
    log.innerHTML = "<li style='color:var(--muted);text-align:center;padding:20px;'>No entries yet. Add your first health entry above!</li>";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const latest = entries.at(-1);
  const last7 = entries.slice(-7);
  const risk = calculateRisk(latest);
  const labels = ["Very low","Low","Moderate","Moderate","Elevated","High","Very high"];

  riskScoreText.textContent = `Daily Risk: ${risk}/7 (${labels[risk]})`;
  warningText.textContent = risk >= 5 ? "⚠️ High health risk detected." : "✅ Health looks stable.";
  trendText.textContent = analyzeTrends(last7);

  log.innerHTML = "";
  entries.slice(-5).reverse().forEach(e=>{
    const li = document.createElement("li");
    const symptoms = e.symptoms || e.symptom || 'none';
    li.textContent = `${e.date} | Sleep ${e.sleep}h | Water ${e.water}L | Stress ${e.stress} | ${symptoms}`;
    log.appendChild(li);
  });

  drawChart(last7);
}

async function init() {
  const email = localStorage.getItem('authEmail');
  userInfo.textContent = `Signed in as ${email}`;
  logoutBtn.addEventListener('click', () => logout());
  
  const token = localStorage.getItem('authToken');
  if (token) {
    await fetchEntriesFromServer();
  } else {
    entries = JSON.parse(localStorage.getItem('healthEntries')) || [];
  }
  updateUI();
}

init();
