// Client-side checks for fast feedback. The backend validates everything again.
export function validateEmail(email) {
  if (!email.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address';
  return '';
}

export function validatePassword(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (password.length > 72) return 'Password must be at most 72 characters';
  if (!/[A-Za-z]/.test(password)) return 'Password must contain at least one letter';
  if (!/\d/.test(password)) return 'Password must contain at least one number';
  return '';
}

export function validateName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'Name is required';
  if (trimmed.length < 2) return 'Name must be at least 2 characters';
  if (trimmed.length > 50) return 'Name must be at most 50 characters';
  return '';
}

export function validateTask({ title, description }) {
  const errors = {};
  if (!title.trim()) errors.title = 'Title is required';
  else if (title.trim().length > 120) errors.title = 'Title must be at most 120 characters';
  if (description.trim().length > 2000) errors.description = 'Description must be at most 2000 characters';
  return errors;
}
