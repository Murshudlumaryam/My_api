const Pokemon = require('../models/Pokemon');
const redis = require('../config/redis');

const CACHE_TTL = 60;

function parsePokedexId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id < 1) {
    return null;
  }

  return id;
}

async function clearPokemonListCache() {
  if (!redis.isReady) {
    return;
  }

  try {
    const keys = await redis.keys('pokemon:list:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } catch (error) {
    console.error('Could not clear Pokemon list cache:', error.message);
  }
}

function buildPayload(body, { allowPartial = false } = {}) {
  const payload = {};
  const numericFields = ['hp', 'attack', 'defense', 'speed', 'height', 'weight'];
  const textFields = ['name', 'imageUrl'];

  if (!allowPartial || body.pokedexId !== undefined) {
    const pokedexId = Number(body.pokedexId);
    if (!Number.isInteger(pokedexId) || pokedexId < 1) {
      throw new Error('pokedexId must be a positive integer');
    }
    payload.pokedexId = pokedexId;
  }

  for (const field of textFields) {
    if (body[field] === undefined) {
      continue;
    }

    if (typeof body[field] !== 'string' || body[field].trim() === '') {
      throw new Error(`${field} must be a non-empty string`);
    }

    payload[field] = body[field].trim();
  }

  if (!allowPartial && !payload.name) {
    throw new Error('name is required');
  }

  if (body.types !== undefined) {
    if (!Array.isArray(body.types) || body.types.length === 0) {
      throw new Error('types must be a non-empty array');
    }

    payload.types = body.types
      .map((item) => String(item).trim().toLowerCase())
      .filter(Boolean);
  }

  for (const field of numericFields) {
    if (body[field] === undefined) {
      continue;
    }

    const value = Number(body[field]);
    if (!Number.isFinite(value) || value < 0) {
      throw new Error(`${field} must be a non-negative number`);
    }

    payload[field] = value;
  }

  return payload;
}

exports.getAll = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    const type = typeof req.query.type === 'string' ? req.query.type.trim().toLowerCase() : '';

    const cacheKey = `pokemon:list:page=${page}:limit=${limit}:type=${type}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const filter = type ? { types: type.toLowerCase() } : {};
    const total = await Pokemon.countDocuments(filter);
    const data = await Pokemon.find(filter)
      .sort({ pokedexId: 1 })
      .skip(skip)
      .limit(limit);

    const result = { page, limit, total, totalPages: Math.ceil(total / limit), data };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getOne = async (req, res) => {
  try {
    const pokedexId = parsePokedexId(req.params.id);
    if (!pokedexId) {
      return res.status(400).json({ error: 'Pokemon id must be a positive integer' });
    }

    const cacheKey = `pokemon:item:${pokedexId}`;
    const cached = await redis.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const pokemon = await Pokemon.findOne({ pokedexId });
    if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(pokemon));
    res.json(pokemon);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const pokemon = await Pokemon.create(payload);
    await clearPokemonListCache();
    res.status(201).json(pokemon);
  } catch (err) {
    const status = err.code === 11000 ? 409 : 400;
    res.status(status).json({ error: err.code === 11000 ? 'pokedexId already exists' : err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const routeId = parsePokedexId(req.params.id);
    if (!routeId) {
      return res.status(400).json({ error: 'Pokemon id must be a positive integer' });
    }

    const payload = buildPayload(req.body, { allowPartial: true });
    const pokemon = await Pokemon.findOneAndUpdate(
      { pokedexId: routeId },
      payload,
      { new: true, runValidators: true }
    );
    if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });

    await redis.del(`pokemon:item:${routeId}`);
    await clearPokemonListCache();
    res.json(pokemon);
  } catch (err) {
    const status = err.code === 11000 ? 409 : 400;
    res.status(status).json({ error: err.code === 11000 ? 'pokedexId already exists' : err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const routeId = parsePokedexId(req.params.id);
    if (!routeId) {
      return res.status(400).json({ error: 'Pokemon id must be a positive integer' });
    }

    const pokemon = await Pokemon.findOneAndDelete({ pokedexId: routeId });
    if (!pokemon) return res.status(404).json({ error: 'Pokemon not found' });

    await redis.del(`pokemon:item:${routeId}`);
    await clearPokemonListCache();
    res.json({ message: 'Pokemon deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
