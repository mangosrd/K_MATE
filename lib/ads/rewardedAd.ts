import { Capacitor } from "@capacitor/core";
import { AdMob, RewardAdPluginEvents } from "@capacitor-community/admob";
import { isOneStoreBuild } from "@/lib/distribution/channel";

const TEST_REWARDED_ID = "ca-app-pub-3940256099942544/5224354917";
let initialized = false;
let showing = false;

export function isRewardedAdAvailable(): boolean {
  return (
    !isOneStoreBuild() &&
    Capacitor.isNativePlatform() &&
    Capacitor.getPlatform() === "android"
  );
}

export interface RewardAdService {
  isAvailable(): boolean;
  show(userId: string, claimId: string): Promise<string>;
}

export async function showRewardedAd(userId: string, claimId: string): Promise<string> {
  if (!isRewardedAdAvailable()) throw new Error("광고 보상은 Android 앱에서 이용할 수 있어요.");
  if (showing) throw new Error("이미 광고를 불러오고 있어요.");
  showing = true;
  const isTesting = process.env.NODE_ENV !== "production";
  const adId = isTesting ? TEST_REWARDED_ID : process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID;
  if (!adId) { showing = false; throw new Error("광고 단위가 아직 설정되지 않았어요."); }
  if (!initialized) {
    await AdMob.initialize({ initializeForTesting: isTesting });
    initialized = true;
  }
  return new Promise(async (resolve, reject) => {
    let settled = false;
    const handles = await Promise.all([
      AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        if (!settled) { settled = true; resolve(`${claimId}:${crypto.randomUUID()}`); }
      }),
      AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => {
        if (!settled) { settled = true; reject(new Error("광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")); }
      }),
      AdMob.addListener(RewardAdPluginEvents.FailedToShow, () => {
        if (!settled) { settled = true; reject(new Error("광고를 재생하지 못했어요. 잠시 후 다시 시도해 주세요.")); }
      }),
      AdMob.addListener(RewardAdPluginEvents.Dismissed, () => {
        if (!settled) { settled = true; reject(new Error("광고 시청을 완료하면 코인을 받을 수 있어요.")); }
      }),
    ]);
    try {
      await AdMob.prepareRewardVideoAd({ adId, isTesting, ssv: { userId, customData: claimId } });
      await AdMob.showRewardVideoAd();
    } catch {
      if (!settled) { settled = true; reject(new Error("광고를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.")); }
    } finally {
      await Promise.all(handles.map((handle) => handle.remove()));
      showing = false;
    }
  });
}

export const admobRewardAdService: RewardAdService = {
  isAvailable: isRewardedAdAvailable,
  show: showRewardedAd,
};
