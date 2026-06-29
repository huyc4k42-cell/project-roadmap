/* ── TRACKING — Flow: Project Detail / Onboarding ── */
import { track } from '../analytics.js';

export function trackViewOnboarding(onboardingTotalSteps) {
  track('view_onboarding', { onboardingTotalSteps });
}

export function trackSkipOnboarding(onboardingStep, onboardingTotalSteps, cancelMethod) {
  track('skip_onboarding', { onboardingStep, onboardingTotalSteps, cancelMethod });
}

export function trackCompleteOnboarding(onboardingTotalSteps) {
  track('complete_onboarding', { onboardingTotalSteps });
}
