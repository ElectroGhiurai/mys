import { describe, it, expect } from 'vitest';
import { getSuggestions } from '../suggestionsEngine';

describe('suggestionsEngine', () => {
  it('should return onboarding suggestions when tracker is empty', () => {
    // Arrange & Act
    const suggestions = getSuggestions([]);

    // Assert
    expect(suggestions).toHaveLength(3);
    expect(suggestions.some(s => s.name === 'Oats')).toBe(true);
    expect(suggestions.some(s => s.name === 'Chicken Breast')).toBe(true);
    expect(suggestions.some(s => s.name === 'Avocado')).toBe(true);
  });

  it('should suggest Banana and Milk when Oats are in the tracked list', () => {
    // Arrange
    const trackedList = [
      { name: 'Rolled Oats', weight: 100, caloriesPer100g: 389, proteinPer100g: 16.9, carbsPer100g: 66, fatPer100g: 6.9 }
    ];

    // Act
    const suggestions = getSuggestions(trackedList);

    // Assert
    expect(suggestions.some(s => s.name === 'Banana')).toBe(true);
    expect(suggestions.some(s => s.name === 'Milk')).toBe(true);
  });

  it('should suggest high protein foods when protein has the lowest percentage completion', () => {
    // Arrange
    // Carbs and fats are already fully hit (target carbs: 220g, fat: 70g), protein is extremely low (target: 130g)
    const trackedList = [
      { name: 'White Rice', weight: 800, caloriesPer100g: 130, proteinPer100g: 2.7, carbsPer100g: 28, fatPer100g: 0.3 }, // lots of carbs
      { name: 'Olive Oil', weight: 70, caloriesPer100g: 884, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 100 }     // lots of fat
    ];

    // Act
    const suggestions = getSuggestions(trackedList);

    // Assert
    // Check that we suggest Greek Yogurt, Chicken Breast, or Whey Protein
    const hasProteinSug = suggestions.some(s => s.name.startsWith('Greek yogurt') || s.name.startsWith('Chicken breast') || s.name === 'Whey protein powder');
    expect(hasProteinSug).toBe(true);
  });

  it('should use custom targets to determine the lowest percentage completion and suggestions', () => {
    // Arrange
    const trackedList = [
      { name: 'Pure Protein', weight: 100, caloriesPer100g: 400, proteinPer100g: 40, carbsPer100g: 0, fatPer100g: 0 },
      { name: 'Pure Fat', weight: 100, caloriesPer100g: 900, proteinPer100g: 0, carbsPer100g: 0, fatPer100g: 40 }
    ];
    const customTargets = {
      calories: 2000,
      protein: 50,
      carbs: 100,
      fat: 50
    };

    // Act
    const suggestions = getSuggestions(trackedList, customTargets);

    // Assert
    const hasCarbSug = suggestions.some(s => s.name.startsWith('Oats') || s.name.startsWith('Sweet potato') || s.name === 'Banana');
    expect(hasCarbSug).toBe(true);
  });
});
