# MusicTheory.com backend

Express + MongoDB (Mongoose) API serving the quiz question bank.

## Setup
```bash
cd backend
npm install
cp .env.example .env      # set MONGODB_URI
npm run seed              # loads ../questions_mongodb.json (130 questions)
npm run dev               # http://localhost:3000
```

## Endpoints
| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Server + DB status |
| GET | `/api/levels` | `[{ level, topics, count }]` |
| GET | `/api/questions?level=1&topic=&type=&limit=10&shuffle=true` | Questions **without** `answer`/`why` |
| GET | `/api/questions/:id` | One question (no answer) |
| POST | `/api/questions/:id/check` | Body `{ "answer": 1 }` (or `[2,3,5]` for `multi`) -> `{ correct, correctAnswer, why }` |

`answer` is always the option **index**. For `multi` questions all correct options must be selected (order doesn't matter).
No scoring yet — the client just calls `/check` and shows correct/incorrect plus `why`.

## Frontend example
```js
const qs = await (await fetch("http://localhost:3000/api/questions?level=1&limit=10")).json();
const res = await (await fetch(`http://localhost:3000/api/questions/${qs[0].id}/check`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ answer: 1 }),
})).json();
// res = { correct: true, correctAnswer: 1, why: "..." }
```
