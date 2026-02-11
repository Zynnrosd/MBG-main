// src/services/userService.js
const CHILD_DATA_KEY = 'mbg_child_data';

/**
 * Simpan data fisik anak ke LocalStorage
 */
export const saveChildData = (data) => {
  try {
    // Hitung target AKG sederhana
    const targetCalories = 1000 + (parseInt(data.age) * 100);
    const targetProtein = (parseFloat(data.weight) * 1.2).toFixed(1);

    const profileData = {
      ...data,
      akg: { targetCalories, targetProtein },
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(CHILD_DATA_KEY, JSON.stringify(profileData));
    return { success: true, data: profileData };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

/**
 * Ambil data anak yang tersimpan
 */
export const getChildData = () => {
  const data = localStorage.getItem(CHILD_DATA_KEY);
  return data ? JSON.parse(data) : null;
};

export default {
  saveChildData,
  getChildData
};