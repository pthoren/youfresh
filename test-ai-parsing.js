// Test script for AI parsing functionality
// Run with: node test-ai-parsing.js

import { openaiService } from './lib/openai.js';

async function testParsing() {
  console.log('Testing AI ingredient parsing...\n');

  const testIngredients = [
    `2 cups cooked rice
1 lb chicken breast, diced
2 tablespoons olive oil
1 large onion, chopped
3 cloves garlic, minced
1 bell pepper, diced
2 cups broccoli florets
3 tablespoons soy sauce
1 tablespoon sesame oil`,

    `1 lb ground beef
8 oz pasta shells
1 jar marinara sauce
1 cup shredded mozzarella cheese
1/2 cup parmesan cheese
1 onion, diced
2 cloves garlic
Italian seasoning`,

    `4 large eggs
2 slices whole wheat bread
1 avocado
2 strips bacon
Salt and pepper to taste
1 tablespoon butter`
  ];

  for (let i = 0; i < testIngredients.length; i++) {
    console.log(`\n--- Test ${i + 1} ---`);
    console.log('Input:', testIngredients[i].replace(/\n/g, ' | '));
    
    try {
      const result = await openaiService.parseIngredients(testIngredients[i]);
      console.log('\nParsed Result:');
      console.log('✓ Valid Meal:', result.is_valid_meal);
      console.log('🥩 Primary Protein:', result.primary_protein);
      console.log('🌾 Primary Carb:', result.primary_carbohydrate);
      console.log('🥬 Primary Vegetable:', result.primary_vegetable);
      console.log('📋 Ingredients Count:', result.ingredients.length);
      
      console.log('\nDetailed Ingredients:');
      result.ingredients.forEach((ing, idx) => {
        console.log(`  ${idx + 1}. ${ing.quantity} ${ing.unit} ${ing.name}`);
      });
      
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
    
    console.log('\n' + '='.repeat(60));
  }
}

testParsing().catch(console.error);
