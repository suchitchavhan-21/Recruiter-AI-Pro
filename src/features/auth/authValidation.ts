export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateEmail(email: string): string | null {
  if (!email || !email.trim()) {
    return "Email address is required.";
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return "Please enter a valid email address.";
  }
  return null;
}

export function validatePassword(password: string): string[] {
  const errors: string[] = [];
  if (!password || password.length < 8) {
    errors.push("Must be at least 8 characters long.");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Must include at least one uppercase letter (A-Z).");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Must include at least one lowercase letter (a-z).");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Must include at least one digit (0-9).");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Must include at least one special character (@, $, !, %, etc.).");
  }
  return errors;
}

export function validateFullName(name: string): string | null {
  if (!name || name.trim().length < 2) {
    return "Full name must be at least 2 characters.";
  }
  return null;
}

export function validatePhoneNumber(phone: string): string | null {
  if (!phone || phone.trim().length < 6) {
    return "Please enter a valid phone number.";
  }
  return null;
}
