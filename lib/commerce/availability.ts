import { Capacitor } from "@capacitor/core";
import { isPlayBillingAvailable } from "@/lib/billing/playBilling";
import { isRewardedAdAvailable } from "@/lib/ads/rewardedAd";
import { FREE_BETA_MODE } from "@/lib/commerce/releaseMode";

export interface CommerceAvailability {
  locale: string;
  country?: string;
  storeCountry?: string;
  currency?: string;
  paymentAvailable: boolean;
  rewardAdAvailable: boolean;
  storeAvailable: boolean;
}

export function getCommerceAvailability(): CommerceAvailability {
  const locale = typeof navigator === "undefined" ? "en" : navigator.language;
  const nativeAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  return {
    locale,
    paymentAvailable: isPlayBillingAvailable(),
    rewardAdAvailable: isRewardedAdAvailable(),
    storeAvailable: nativeAndroid && !FREE_BETA_MODE,
  };
}
