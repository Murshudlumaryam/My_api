# My API

Backend API project built with Node.js, Express and MongoDB.

The topic chosen for this project is Pokemon. The database is seeded from the public PokeAPI and stores more than 1000 rows, which satisfies the project requirement for a large dataset.

## Features

- JWT authentication for protected routes
- Token check endpoint for authenticated users
- Public GET routes
- Full CRUD for Pokemon records
- Pagination with a maximum of 20 items per page
- Redis cache support for list and detail requests
- Swagger documentation
- Postman collection included in the project

## Stack

- Node.js
- Express
- MongoDB with Mongoose
- Redis with ioredis
- Swagger UI

## Project Setup

```bash
npm install
copy .env.example .env
```

Update the values inside `.env` before starting the project.

## Environment Variables

```env
PORT=3000
DATABASE_URL=mongodb://127.0.0.1:27017/pokemon_api
JWT_SECRET=change-this-secret
BASE_URL=http://localhost:3000
REDIS_URL=redis://127.0.0.1:6379
```

`REDIS_URL` is optional. If it is not set, the API still runs and simply skips cache storage.

## Run

```bash
npm run seed
npm run dev
```

Production start:

```bash
npm start
```

## API Endpoints

### Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/token`

### Pokemon

- `GET /api/pokemon`
- `GET /api/pokemon/:id`
- `POST /api/pokemon`
- `PUT /api/pokemon/:id`
- `DELETE /api/pokemon/:id`

## Query Parameters

`GET /api/pokemon`

- `page`: page number, default is `1`
- `limit`: max value is `20`
- `type`: optional filter such as `fire`, `water`, `grass`

Example:

```text
GET /api/pokemon?page=1&limit=20&type=fire
```

## Documentation

- Swagger UI: `/api-docs`
- Postman collection: [docs/My-API.postman_collection.json](./docs/My-API.postman_collection.json)

## Repository

- GitHub: [https://github.com/Murshudlumaryam/My_api](https://github.com/Murshudlumaryam/My_api)

## Deployment

Render quick deploy:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Murshudlumaryam/My_api)

After deployment, replace the placeholders below with your real public URLs:

- Live API: `your-cloud-url-here`
- Swagger UI: `your-cloud-url-here/api-docs`

## Notes

- Seed data comes from [PokeAPI](https://pokeapi.co/)
- The root route `/` and `/health` can be used to check that the server is running
