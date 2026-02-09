const saveBtn = document.getElementById("saveBtn");
const log = document.getElementById("log");
const riskScoreText = document.getElementById("riskScore");
const warningText = document.getElementById("warning");
const trendText = document.getElementById("trendWarning");
const canvas = document.getElementById("chart");
const ctx = canvas.getContext("2d");
const themeToggle = document.getElementById("themeToggle");

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

/* SAVE ENTRY */
saveBtn.onclick = () => {
  if (!sleep.value || !water.value || !stress.value) return;

  const entry = {
    date: new Date().toISOString().split("T")[0],
    sleep: Number(sleep.value),
    water: Number(water.value),
    stress: Number(stress.value),
    symptom: symptom.value
  };

  entries.push(entry);
  entries = entries.slice(-30);
  localStorage.setItem("healthEntries", JSON.stringify(entries));
  updateUI();
};

function calculateRisk(e) {
  let r = 0;
  if (e.sleep < 6) r += 2;
  if (e.water < 2) r += 1;
  if (e.stress >= 4) r += 2;
  if (e.symptom !== "none") r += 2;
  return r;
}

function analyzeTrends(last7) {
  if (last7.length < 4) return "Not enough data yet.";
  const avgSleep = last7.reduce((a,e)=>a+e.sleep,0)/last7.length;
  const avgStress = last7.reduce((a,e)=>a+e.stress,0)/last7.length;
  const symptomDays = last7.filter(e=>e.symptom!=="none").length;

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

  ctx.beginPath();
  ctx.strokeStyle = "#2563eb";
  last7.forEach((e,i)=>{
    const x = startX + i*gap;
    const y = baseY - (e.sleep/10)*height;
    i===0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  ctx.stroke();

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
  if (!entries.length) return;

  const latest = entries.at(-1);
  const last7 = entries.slice(-7);
  const risk = calculateRisk(latest);
  const labels = ["Very low","Low","Moderate","Moderate","Elevated","High","Very high"];

  riskScoreText.textContent = `Daily Risk: ${risk}/7 (${labels[risk]})`;
  warningText.textContent = risk >= 5 ? "High health risk detected." : "Health looks stable.";
  trendText.textContent = analyzeTrends(last7);

  log.innerHTML = "";
  entries.slice(-5).reverse().forEach(e=>{
    const li = document.createElement("li");
    li.textContent = `${e.date} | Sleep ${e.sleep}h | Water ${e.water}L | Stress ${e.stress} | ${e.symptom}`;
    log.appendChild(li);
  });

  drawChart(last7);
}

updateUI();
