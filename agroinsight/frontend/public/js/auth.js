const TOKEN_KEY = 'agroinsight_token';
const API_BASE = '/api';

const elements = {
  form: document.getElementById('auth-form'),
  heading: document.getElementById('auth-heading'),
  toggleText: document.getElementById('toggle-text'),
  toggleButton: document.getElementById('toggle-button'),
  nameGroup: document.getElementById('group-name'),
  submitButton: document.getElementById('submit-button'),
  message: document.getElementById('auth-message'),
};

const authState = {
  mode: 'login',
};

const showMessage = (text, type = 'info') => {
  elements.message.textContent = text;
  elements.message.className = `auth-message ${type}`;
};

const setMode = (mode) => {
  authState.mode = mode;
  elements.heading.textContent = mode === 'login' ? 'Welcome back' : 'Create an account';
  elements.toggleText.textContent = mode === 'login' ? 'New to AgroInsight?' : 'Already have an account?';
  elements.toggleButton.textContent = mode === 'login' ? 'Register' : 'Login';
  elements.nameGroup.style.display = mode === 'login' ? 'none' : 'block';
  elements.submitButton.textContent = mode === 'login' ? 'Sign in' : 'Register';
  showMessage('');
};

const getFormData = () => ({
  name: document.getElementById('name').value.trim(),
  email: document.getElementById('email').value.trim(),
  password: document.getElementById('password').value.trim(),
});

const authRequest = async (path, payload) => {
  const res = await fetch(`${API_BASE}/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return res.json();
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const { name, email, password } = getFormData();
  if (!email || !password || (authState.mode === 'register' && !name)) {
    return showMessage('Please complete all required fields', 'error');
  }

  elements.submitButton.disabled = true;
  elements.submitButton.textContent = authState.mode === 'login' ? 'Signing in…' : 'Creating account…';

  const endpoint = authState.mode === 'login' ? 'auth/login' : 'auth/register';
  const payload = authState.mode === 'login' ? { email, password } : { name, email, password };
  const result = await authRequest(endpoint, payload);

  elements.submitButton.disabled = false;
  elements.submitButton.textContent = authState.mode === 'login' ? 'Sign in' : 'Register';

  if (result?.success && result.data?.token) {
    localStorage.setItem(TOKEN_KEY, result.data.token);
    window.location.href = '/';
    return;
  }

  showMessage(result?.error || 'Unable to authenticate. Try again.', 'error');
};

const checkSession = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    window.location.href = '/';
  }
};

window.addEventListener('DOMContentLoaded', () => {
  if (!elements.form) return;
  checkSession();
  setMode('login');
  elements.form.addEventListener('submit', handleSubmit);
  elements.toggleButton.addEventListener('click', () => setMode(authState.mode === 'login' ? 'register' : 'login'));
});
