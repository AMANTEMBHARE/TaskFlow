const { z } = require('zod');

const email = z
  .string({ required_error: 'Email is required' })
  .trim()
  .toLowerCase()
  .email('Enter a valid email address')
  .max(254, 'Email is too long');

// bcrypt only uses the first 72 bytes, so cap the length to avoid silent truncation.
const newPassword = z
  .string({ required_error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(72, 'Password must be at most 72 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter')
  .regex(/\d/, 'Password must contain at least one number');

// .strict() rejects unknown keys (no mass-assignment, no smuggled operators).
const register = {
  body: z
    .object({
      name: z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(50, 'Name must be at most 50 characters'),
      email,
      password: newPassword,
    })
    .strict(),
};

const login = {
  body: z
    .object({
      email,
      password: z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password is required')
        .max(72, 'Password must be at most 72 characters'),
    })
    .strict(),
};

module.exports = { register, login };
