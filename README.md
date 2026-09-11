# maniac.cc

Site + API для maniac.cc.

## Локальный запуск

```bash
npm install
cp .env.example .env
# заполни DATABASE_URL и JWT_SECRET
npx prisma migrate dev --name init
npm run seed
npm run dev
