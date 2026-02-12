// src/utils/nutritionCalculator.js
import nutritionData from '../../public/data/nutrition.json'; 

export const calculateNutritionalNeeds = (data) => {
  const { category, age, weight, height, gender = 'male', trimester, breastfeedingAge, activityLevel = 1.3 } = data;
  
  let bmr = 0;
  let totalCalories = 0;
  let proteinNeeds = 0; // gram
  
  // 1. Hitung BMR (Harris-Benedict)
  if (gender === 'male' || category === 'child') { // Asumsi anak default rumus laki-laki jika gender tdk spesifik
    bmr = 66.5 + (13.75 * parseFloat(weight)) + (5.003 * parseFloat(height)) - (6.75 * parseFloat(age));
  } else {
    bmr = 655.1 + (9.563 * parseFloat(weight)) + (1.850 * parseFloat(height)) - (4.676 * parseFloat(age));
  }

  // 2. Total Energi Harian
  totalCalories = bmr * activityLevel;

  // 3. Penyesuaian Berdasarkan Kategori
  if (category === 'child') {
    // Anak: Protein 10-15% dari total kalori
    proteinNeeds = (totalCalories * 0.15) / 4; 
  } 
  else if (category === 'pregnant') {
    // Hamil: Tambah kalori & Protein (+20g konstan)
    // Trimester 1: +180, Trimester 2/3: +300
    if (trimester === '1') totalCalories += 180;
    else totalCalories += 300;
    
    proteinNeeds = (totalCalories * 0.15) / 4 + 20; // Base + 20g
  } 
  else if (category === 'breastfeeding') {
    // Menyusui
    if (breastfeedingAge === '0-6') totalCalories += 330;
    else totalCalories += 400;

    proteinNeeds = (totalCalories * 0.15) / 4 + 20;
  }

  // 4. Target Makan Malam (Dinner) - 30% dari Harian
  const dinnerTarget = {
    calories: Math.round(totalCalories * 0.30),
    protein: Math.round(proteinNeeds * 0.30),
  };

  // 5. Target Sarapan - 25% dari Harian
  const breakfastTarget = {
      calories: Math.round(totalCalories * 0.25),
      protein: Math.round(proteinNeeds * 0.25),
  };

  return {
    daily: {
      calories: Math.round(totalCalories),
      protein: Math.round(proteinNeeds)
    },
    breakfastTarget,
    dinnerTarget
  };
};

export const findMatchingMenu = (target, mealType = 'dinner') => {
  // Ambil data dari JSON (Pastikan struktur JSON sesuai: { "breakfast": [], "dinner": [] })
  const menus = nutritionData[mealType] || [];
  
  if (menus.length === 0) return null;

  // Cari menu dengan kalori paling mendekati
  const recommended = menus.reduce((prev, curr) => {
    return (Math.abs(curr.nutrition.calories - target.calories) < Math.abs(prev.nutrition.calories - target.calories) ? curr : prev);
  });

  return recommended;
};