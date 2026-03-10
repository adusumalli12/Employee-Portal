/**
 * Role Authorization Middleware Exports
 * Re-exports auth middleware functions for backward compatibility
 */
export {
  authenticateToken,
  authorize,
  checkRole,
  adminOnly,
  superadminOnly,
} from './auth';

export default {};
