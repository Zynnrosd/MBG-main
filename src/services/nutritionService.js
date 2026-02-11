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
    } catch (e) { return []; }
  }

  async searchMenu(query) {
    const data = await this.getAllNutrisi();
    if (!query) return [];
    return data.filter(i => i.name.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
  }

  async getDinnerRecommendation(targetCal) {
    const data = await this.getAllNutrisi();
    
    // 1. Blacklist: Buang nasi dan camilan
    const blacklist = ['enting', 'wijen', 'kerupuk', 'permen', 'kue', 'biskuit', 'snack', 'nasi', 'cokelat', 'keripik', 'sambal'];
    
    // 2. Kelompokkan Kata Kunci untuk Variasi Menu
    const categories = {
      ikan: ['ikan', 'lele', 'tongkol', 'nila', 'bandeng', 'gurame', 'udang', 'cumi'],
      ayam: ['ayam', 'bebek'],
      daging: ['daging', 'sapi', 'kambing', 'hati'],
      telur: ['telur', 'puyuh'],
      nabati: ['tempe', 'tahu']
    };

    // Filter lauk utama yang bukan camilan dan protein tinggi (>5g)
    let mainDishes = data.filter(i => {
      const nameLower = i.name.toLowerCase();
      const isBlacklisted = blacklist.some(word => nameLower.includes(word));
      return !isBlacklisted && i.proteins > 5;
    });

    // Ambil menu yang sesuai rentang kalori
    const candidates = mainDishes.filter(i => i.calories <= (targetCal + 100));

    // 3. Logika Variasi: Ambil 1 dari setiap kategori jika tersedia
    let finalSuggestions = [];
    
    Object.values(categories).forEach(keywords => {
      const groupCandidates = candidates.filter(item => 
        keywords.some(k => item.name.toLowerCase().includes(k))
      );
      
      if (groupCandidates.length > 0) {
        // Ambil 1 acak dari kategori ini
        const randomItem = groupCandidates[Math.floor(Math.random() * groupCandidates.length)];
        finalSuggestions.push(randomItem);
      }
    });

    // 4. Jika hasil kurang dari 5, penuhi dengan menu protein lain yang tersisa
    if (finalSuggestions.length < 5) {
      const remainingCandidates = candidates.filter(c => !finalSuggestions.includes(c));
      const needed = 5 - finalSuggestions.length;
      const additional = remainingCandidates.sort(() => 0.5 - Math.random()).slice(0, needed);
      finalSuggestions = [...finalSuggestions, ...additional];
    }

    // 5. Pastikan unik dan ambil tepat 5 menu
    const unique = [...new Map(finalSuggestions.map(item => [item.name, item])).values()];
    return unique.sort(() => 0.5 - Math.random()).slice(0, 5); 
  }
}

export default new NutritionService();