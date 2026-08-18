import {
  getLocalizedPlayProducts,
  isPlayBillingAvailable,
  purchaseCharacterPack,
  purchaseCoinPack,
  purchasePremium,
  type CharacterPackId,
  type CoinPackId,
  type LocalizedProduct,
} from "./playBilling";

export interface PaymentService {
  isAvailable(): boolean;
  products(): LocalizedProduct[];
  buyCoins(productId: CoinPackId): Promise<void>;
  unlockCaptain(productId: CharacterPackId): Promise<void>;
  subscribePremium(): Promise<void>;
}

export const googlePlayBillingService: PaymentService = {
  isAvailable: isPlayBillingAvailable,
  products: getLocalizedPlayProducts,
  buyCoins: purchaseCoinPack,
  unlockCaptain: purchaseCharacterPack,
  subscribePremium: purchasePremium,
};
