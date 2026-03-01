exports.calculateNutrition = (age_month, weight) => {
  if (!weight || weight <= 0) {
    return {
      stage: "Unknown",
      calories_per_day: 0,
      food_per_day: 0,
      food_per_meal: 0
    };
  }

  const RER = 70 * Math.pow(weight, 0.75);

  let factor = 1.2; // Default Adult/Neutered
  let stage = "Adult";

  if (age_month < 4) {
    factor = 3.0;
    stage = "Kitten (Growth)";
  } else if (age_month < 12) {
    factor = 2.0;
    stage = "Junior";
  } else if (age_month >= 12 && age_month < 84) {
    factor = 1.2; // Adult
    stage = "Adult";
  } else if (age_month >= 84) {
    factor = 1.1; // Senior
    stage = "Senior";
  }

  const calories = Math.round(RER * factor);

  // Assigning average calories for dry food ~350 kcal/100g
  // Formula: (Calories / 350) * 100
  const food_per_day = Math.round((calories / 350) * 100);

  // Suggest 3 meals per day
  const food_per_meal = Math.round(food_per_day / 3);

  return {
    stage,
    calories_per_day: calories,
    food_per_day,
    food_per_meal
  };
};
