import nutritionData from '../../public/data/nutrition.json';

export const calculateNutritionalNeeds = (data) => {
  const {
    category,
    age,
    weight,
    height,
    gender = 'male',
    trimester,
    breastfeedingAge,
    activityLevel = 1.3
  } = data;

  let bmr = 0;
  let totalCalories = 0;
  let proteinNeeds = 0;

  // Basal Metabolic Rate (Harris-Benedict)
  if (gender === 'male' || category === 'child') {
    bmr =
      66.5 +
      13.75 * parseFloat(weight) +
      5.003 * parseFloat(height) -
      6.75 * parseFloat(age);
  } else {
    bmr =
      655.1 +
      9.563 * parseFloat(weight) +
      1.85 * parseFloat(height) -
      4.676 * parseFloat(age);
  }

  totalCalories = bmr * activityLevel;

  if (category === 'child') {
    proteinNeeds = (totalCalories * 0.15) / 4;
  } else if (category === 'pregnant') {
    totalCalories += trimester === '1' ? 180 : 300;
    proteinNeeds = (totalCalories * 0.15) / 4 + 20;
  } else if (category === 'breastfeeding') {
    totalCalories += breastfeedingAge === '0-6' ? 330 : 400;
    proteinNeeds = (totalCalories * 0.15) / 4 + 20;
  }

  const breakfastTarget = {
    calories: Math.round(totalCalories * 0.25),
    protein: Math.round(proteinNeeds * 0.25)
  };

  const dinnerTarget = {
    calories: Math.round(totalCalories * 0.3),
    protein: Math.round(proteinNeeds * 0.3)
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
  const menus = nutritionData[mealType] || [];

  if (!menus.length) return null;

  return menus.reduce((prev, curr) =>
    Math.abs(curr.nutrition.calories - target.calories) <
    Math.abs(prev.nutrition.calories - target.calories)
      ? curr
      : prev
  );
};
