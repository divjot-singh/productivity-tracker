const ONBOARDING_SKIPPED_KEY = "pt_onboarding_skipped";

export function getOnboardingSkipped(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(ONBOARDING_SKIPPED_KEY) === "1";
}

export function setOnboardingSkipped(skipped: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (skipped) {
    window.localStorage.setItem(ONBOARDING_SKIPPED_KEY, "1");
    return;
  }

  window.localStorage.removeItem(ONBOARDING_SKIPPED_KEY);
}
