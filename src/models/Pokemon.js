const mongoose = require('mongoose');

const pokemonSchema = new mongoose.Schema({
  pokedexId:  { type: Number, required: true, unique: true },
  name:       { type: String, required: true },
  types:      [{ type: String }],
  hp:         { type: Number },
  attack:     { type: Number },
  defense:    { type: Number },
  speed:      { type: Number },
  height:     { type: Number },
  weight:     { type: Number },
  imageUrl:   { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Pokemon', pokemonSchema);