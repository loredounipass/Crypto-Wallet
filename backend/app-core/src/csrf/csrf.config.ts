import { csrfSync } from 'csrf-sync';

export const {
  generateToken,
  csrfSynchronisedProtection,
} = csrfSync({
  getTokenFromRequest: (req) => {
    return req.headers['x-csrf-token'] || req.body?._csrf;
  },
  skipCsrfProtection: (req) => {
    return req.path === '/csrf-token';
  },
});
