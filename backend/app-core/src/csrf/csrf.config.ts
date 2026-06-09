import { csrfSync } from 'csrf-sync';

const AUTH_PATHS = [
  '/secure/api/user/login',
  '/secure/api/user/register',
  '/secure/api/user/forgot-password',
  '/secure/api/user/reset-password',
  '/secure/api/user/resend-token',
  '/secure/api/user/verify-token',
];

export const {
  generateToken,
  csrfSynchronisedProtection,
} = csrfSync({
  skipCsrfProtection: (req) => {
    return AUTH_PATHS.includes(req.path) || req.path === '/csrf-token';
  },
});
