// src/services/nutritionService.js
import axios from 'axios';

class NutritionService {
  constructor() {
    this.cachedData = null;
  }

  async getAllNutrisi() {
    if (this.cachedData) return this.cachedData;
    try {
      const res = await axios.get('/data/nutrition.json');
      this.cachedData = res.data.map(item => ({
        id: item.id,
        name: item.name || item.nama,
        calories: item.calories || item.kalori || 0,
        proteins: item.proteins || item.protein || 0,
        image: item.image || item.gambar || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c'
      }));
      return this.cachedData;
    } catch (e) {
      return [];
    }
  }

  async searchMenu(query) {
    const data = await this.getAllNutrisi();
    if (!query) return [];
    return data
      .filter(i => i.name.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 10);
  }

  async getDinnerRecommendation(targetCal) {
    const data = await this.getAllNutrisi();

    const blacklist = [
      'enting', 'wijen', 'kerupuk', 'permen', 'kue',
      'biskuit', 'snack', 'nasi', 'cokelat', 'keripik', 'sambal'
    ];

    const categories = {
      ikan: ['ikan', 'lele', 'tongkol', 'nila', 'bandeng', 'gurame', 'udang', 'cumi'],
      ayam: ['ayam', 'bebek'],
      daging: ['daging', 'sapi', 'kambing', 'hati'],
      telur: ['telur', 'puyuh'],
      nabati: ['tempe', 'tahu']
    };

    let mainDishes = data.filter(i => {
      const nameLower = i.name.toLowerCase();
      const isBlacklisted = blacklist.some(word => nameLower.includes(word));
      return !isBlacklisted && i.proteins > 5;
    });

    const candidates = mainDishes.filter(i => i.calories <= (targetCal + 100));

    let finalSuggestions = [];

    Object.values(categories).forEach(keywords => {
      const groupCandidates = candidates.filter(item =>
        keywords.some(k => item.name.toLowerCase().includes(k))
      );

      if (groupCandidates.length > 0) {
        const randomItem = groupCandidates[Math.floor(Math.random() * groupCandidates.length)];
        finalSuggestions.push(randomItem);
      }
    });

    if (finalSuggestions.length < 5) {
      const remainingCandidates = candidates.filter(c => !finalSuggestions.includes(c));
      const needed = 5 - finalSuggestions.length;
      const additional = remainingCandidates
        .sort(() => 0.5 - Math.random())
        .slice(0, needed);

      finalSuggestions = [...finalSuggestions, ...additional];
    }

    const unique = [
      ...new Map(finalSuggestions.map(item => [item.name, item])).values()
    ];

    return unique
      .sort(() => 0.5 - Math.random())
      .slice(0, 5);
  }
}

export default new NutritionService();
