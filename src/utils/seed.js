require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const Pokemon = require('../models/Pokemon');

async function fetchPokemon(id) {
  const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const p = res.data;
  return {
    pokedexId: p.id,
    name: p.name,
    types: p.types.map(t => t.type.name),
    hp:      (p.stats.find(s => s.stat.name === 'hp') || {}).base_stat,
    attack:  (p.stats.find(s => s.stat.name === 'attack') || {}).base_stat,
    defense: (p.stats.find(s => s.stat.name === 'defense') || {}).base_stat,
    speed:   (p.stats.find(s => s.stat.name === 'speed') || {}).base_stat,
    height:  p.height,
    weight:  p.weight,
    imageUrl: p.sprites.front_default
  };
}

async function seed() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Connected to MongoDB');

  await Pokemon.deleteMany({});
  console.log('Cleared existing data');

  const TOTAL = 1010;
  const BATCH = 20;

  for (let i = 1; i <= TOTAL; i += BATCH) {
    const ids = [];
    for (let j = i; j < i + BATCH && j <= TOTAL; j++) ids.push(j);

    const results = await Promise.allSettled(ids.map(fetchPokemon));
    const valid = results
      .filter(r => r.status === 'fulfilled')
      .map(r => r.value);

    if (valid.length > 0) {
      await Pokemon.insertMany(valid, { ordered: false });
    }

    console.log(`Seeded up to #${Math.min(i + BATCH - 1, TOTAL)}`);
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Seeding complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});