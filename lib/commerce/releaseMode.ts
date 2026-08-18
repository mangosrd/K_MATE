/**
 * Temporary closed-test mode.
 *
 * Keep this switch in one place so paid commerce can be restored after the
 * Korean seller information is ready. The 1.0.4 beta exposes no purchases and
 * grants testers access to the complete learning experience.
 */
export const FREE_BETA_MODE = true;
export const PAYMENTS_ENABLED = !FREE_BETA_MODE;
