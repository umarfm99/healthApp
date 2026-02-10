// Auth UI elements
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const registerBtn = document.getElementById('registerBtn');
const loginBtn = document.getElementById('loginBtn');
const messageText = document.getElementById('message');
const themeToggle = document.getElementById('themeToggle');

// Check if user is already logged in
if (localStorage.getItem('authToken')) {
  window.location.href = 'index.html';
}

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

/* AUTH API */
async function registerUser(email, password) {
  messageText.textContent = "Registering...";
  messageText.style.color = 'var(--muted)';
  try {
    const res = await fetch('/.netlify/functions/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    localStorage.setItem('authToken', json.token);
    localStorage.setItem('authEmail', email);
    messageText.textContent = "✓ Registration successful! Redirecting...";
    messageText.style.color = '#10b981';
    setTimeout(() => window.location.href = 'index.html', 1000);
  } catch (err) {
    messageText.textContent = `✗ ${err.message || 'Error registering'}`;
    messageText.style.color = 'var(--danger)';
  }
}

async function loginUser(email, password) {
  messageText.textContent = "Logging in...";
  messageText.style.color = 'var(--muted)';
  try {
    const res = await fetch('/.netlify/functions/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    localStorage.setItem('authToken', json.token);
    localStorage.setItem('authEmail', email);
    messageText.textContent = "✓ Login successful! Redirecting...";
    messageText.style.color = '#10b981';
    setTimeout(() => window.location.href = 'index.html', 1000);
  } catch (err) {
    messageText.textContent = `✗ ${err.message || 'Error logging in'}`;
    messageText.style.color = 'var(--danger)';
  }
}

registerBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    messageText.textContent = "Please enter email and password";
    messageText.style.color = 'var(--danger)';
    return;
  }
  
  registerBtn.disabled = true;
  loginBtn.disabled = true;
  await registerUser(email, password);
  registerBtn.disabled = false;
  loginBtn.disabled = false;
});

loginBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  
  if (!email || !password) {
    messageText.textContent = "Please enter email and password";
    messageText.style.color = 'var(--danger)';
    return;
  }
  
  registerBtn.disabled = true;
  loginBtn.disabled = true;
  await loginUser(email, password);
  registerBtn.disabled = false;
  loginBtn.disabled = false;
});

// Allow Enter key to login
passwordInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') loginBtn.click();
});
