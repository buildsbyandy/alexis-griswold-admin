export interface Recipe {
  title: string;
  slug: string;
  images: string[];
  category: string;
  label: string;
}

// Recipe folder names mapped to their display titles and categories
const recipeConfig: Record<string, { title: string; category: string; label: string }> = {
  'Bananasmoothiebowl': { title: 'Banana Smoothie Bowl', category: 'Breakfast', label: 'Vegan' },
  'BerryBrownieParfait': { title: 'Berry Brownie Parfait', category: 'Breakfast', label: 'Gluten Free' },
  'BitterHerbDetoxEats': { title: 'Bitter Herb Detox Eats', category: 'Lunch', label: 'Detox' },
  'BuffaloMushroomSalad': { title: 'Buffalo Mushroom Salad', category: 'Lunch', label: 'Vegan' },
  'CauliflowerCurry': { title: 'Cauliflower Curry', category: 'Dinner', label: 'Vegan' },
  'ChiptoleHarvestBowl': { title: 'Chipotle Harvest Bowl', category: 'Lunch', label: 'Vegan' },
  'CreamyHerbdressing': { title: 'Creamy Herb Dressing', category: 'Other', label: 'Vegan' },
  'CreamyItalianDressing': { title: 'Creamy Italian Dressing', category: 'Other', label: 'Vegan' },
  'Cucumbermintjuice': { title: 'Cucumber Mint Juice', category: 'Shakes', label: 'Detox' },
  'CucumberRollUps': { title: 'Cucumber Roll Ups', category: 'Lunch', label: 'Raw' },
  'Enchiladas': { title: 'Enchiladas', category: 'Dinner', label: 'Vegan' },
  'ErewhonAcaiBowl': { title: 'Erewhon Acai Bowl', category: 'Breakfast', label: 'Vegan' },
  'FiberFruitBowl': { title: 'Fiber Fruit Bowl', category: 'Breakfast', label: 'Vegan' },
  'fudgebrownies': { title: 'Fudge Brownies', category: 'Other', label: 'Vegan' },
  'GardenSalad': { title: 'Garden Salad', category: 'Lunch', label: 'Vegan' },
  'GroceryList': { title: 'Grocery List', category: 'Other', label: 'Guide' },
  'Grocerylist2': { title: 'Grocery List 2', category: 'Other', label: 'Guide' },
  'HoneyMustard': { title: 'Honey Mustard', category: 'Other', label: 'Vegan' },
  'immunepowerboostshots': { title: 'Immune Power Boost Shots', category: 'Shakes', label: 'Immunity' },
  'Lemontahinicrunchcups': { title: 'Lemon Tahini Crunch Cups', category: 'Other', label: 'Vegan' },
  'Lionsmanecaesarsalad': { title: 'Lion\'s Mane Caesar Salad', category: 'Lunch', label: 'Vegan' },
  'MangoChiaPudding': { title: 'Mango Chia Pudding', category: 'Breakfast', label: 'Vegan' },
  'MapleTrailMix': { title: 'Maple Trail Mix', category: 'Other', label: 'Vegan' },
  'MealIdeas': { title: 'Meal Ideas', category: 'Other', label: 'Guide' },
  'MushroomAlfredo': { title: 'Mushroom Alfredo', category: 'Dinner', label: 'Vegan' },
  'MushroomTacoBowl': { title: 'Mushroom Taco Bowl', category: 'Lunch', label: 'Vegan' },
  'Nachobananafries': { title: 'Nacho Banana Fries', category: 'Other', label: 'Vegan' },
  'NaturesFluShot': { title: 'Nature\'s Flu Shot', category: 'Shakes', label: 'Immunity' },
  'NoodleSoupcoconutcurry': { title: 'Noodle Soup Coconut Curry', category: 'Dinner', label: 'Vegan' },
  'NuttyBananaPowerBowl': { title: 'Nutty Banana Power Bowl', category: 'Breakfast', label: 'Vegan' },
  'PalmsofItalyGlowCup': { title: 'Palms of Italy Glow Cup', category: 'Shakes', label: 'Vegan' },
  'PapayaStrawberrySmoothie': { title: 'Papaya Strawberry Smoothie', category: 'Shakes', label: 'Vegan' },
  'PB&JSmoothieBowl': { title: 'PB&J Smoothie Bowl', category: 'Breakfast', label: 'Vegan' },
  'peargingerjuice': { title: 'Pear Ginger Juice', category: 'Shakes', label: 'Detox' },
  'PestoZucchiniBowl': { title: 'Pesto Zucchini Bowl', category: 'Lunch', label: 'Vegan' },
  'QuinoaPorridge': { title: 'Quinoa Porridge', category: 'Breakfast', label: 'Vegan' },
  'Rawalfredopasta': { title: 'Raw Alfredo Pasta', category: 'Dinner', label: 'Raw' },
  'Rawchocolatetrailmix': { title: 'Raw Chocolate Trail Mix', category: 'Other', label: 'Raw' },
  'RawKoreanLettucecups': { title: 'Raw Korean Lettuce Cups', category: 'Lunch', label: 'Raw' },
  'RawSushi': { title: 'Raw Sushi', category: 'Lunch', label: 'Raw' },
  'RawVeganGranola': { title: 'Raw Vegan Granola', category: 'Breakfast', label: 'Raw' },
  'Rawveganreesesbar': { title: 'Raw Vegan Reese\'s Bar', category: 'Other', label: 'Raw' },
  'rawveganspagetthi': { title: 'Raw Vegan Spaghetti', category: 'Dinner', label: 'Raw' },
  'Rawveggierolls': { title: 'Raw Veggie Rolls', category: 'Lunch', label: 'Raw' },
  'Risingglowshot': { title: 'Rising Glow Shot', category: 'Shakes', label: 'Immunity' },
  'SeaMoss': { title: 'Sea Moss', category: 'Other', label: 'Superfood' },
  'SimpleTahiniDressing': { title: 'Simple Tahini Dressing', category: 'Other', label: 'Vegan' },
  'StirFry': { title: 'Stir Fry', category: 'Dinner', label: 'Vegan' },
  'SunriseSuperCharge': { title: 'Sunrise Super Charge', category: 'Shakes', label: 'Immunity' },
  'SuperfoodMuscleUpShake': { title: 'Superfood Muscle Up Shake', category: 'Shakes', label: 'Vegan' },
  'supergreensjuice': { title: 'Super Greens Juice', category: 'Shakes', label: 'Detox' },
  'sweetpotatocurry': { title: 'Sweet Potato Curry', category: 'Dinner', label: 'Vegan' },
  'ThickeningAgent': { title: 'Thickening Agent', category: 'Other', label: 'Guide' },
  'TomatoSoup': { title: 'Tomato Soup', category: 'Dinner', label: 'Vegan' },
  'veggienoodlesoup': { title: 'Veggie Noodle Soup', category: 'Dinner', label: 'Vegan' },
  'veggiesandwich': { title: 'Veggie Sandwich', category: 'Lunch', label: 'Vegan' },
  'whatieat': { title: 'What I Eat', category: 'Other', label: 'Guide' },
  'Whatieatinaday': { title: 'What I Eat in a Day', category: 'Other', label: 'Guide' },
  'WhatIeatinadayAZ': { title: 'What I Eat in a Day AZ', category: 'Other', label: 'Guide' },
  'Whatieatplantbased': { title: 'What I Eat Plant Based', category: 'Other', label: 'Guide' },
  'whatieatrawvegan': { title: 'What I Eat Raw Vegan', category: 'Other', label: 'Guide' },
  'Yahki\'sGeogeneticJuice': { title: 'Yahki\'s Geogenetic Juice', category: 'Shakes', label: 'Detox' },
};

// Generate recipes array from the folder structure
const recipes: Recipe[] = Object.entries(recipeConfig).map(([folderName, config]) => {
  // Generate image paths for this recipe (trying up to 16 images per recipe)
  const images = [];
  for (let i = 1; i <= 16; i++) {
    const imagePath = `/recipes/${folderName}/${i}.WEBP`;
    images.push(imagePath);
  }
  
  return {
    title: config.title,
    slug: folderName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
    images,
    category: config.category,
    label: config.label,
  };
});

export default recipes; 