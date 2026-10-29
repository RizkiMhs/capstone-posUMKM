const SETTINGS_KEY = 'pos_store_settings';

export const defaultSettings = {
  storeName: 'POS UMKM KULINER',
  address: 'Jl. Kuliner Enak No. 12',
  phone: '0812-3456-7890',
  receiptFooter: 'Terima Kasih atas Kunjungan Anda\nSelamat Menikmati!',
};

export const getStoreSettings = () => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
  } catch {
    return defaultSettings;
  }
};

export const saveStoreSettings = (settings) => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
};

