import { TFunction } from 'i18next';

export const translateVehicleType = (type: 'DAILY' | 'SEASONAL', t: TFunction): string => {
  return t(`vehicle.types.${type}`);
};

export const translateCostCategory = (category: string, t: TFunction): string => {
  return t(`cost.categories.${category}`);
};

export const translateSeasonStatus = (status: 'ACTIVE' | 'CLOSED', t: TFunction): string => {
  return t(`season.status.${status}`);
};
