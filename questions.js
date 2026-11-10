import { Router } from "express";
import Question from "../models/Question.js";

const router = Router();

// Fields the client must never receive before answering
const HIDE = { _id: 0, answer: 0, why: 0 };

const toInt = (v) => (v === undefined || v === "" ? undefined : Number.parseInt(v, 10));

// GET /api/levels  ->  [{ level, topics: [...], count }]
router.get("/levels", async (_req, res, next) => {
  try {
    const rows = await Question.aggregate([
      { $group: { _id: "$level", topics: { $addToSet: "$topic" }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
      { $project: { _id: 0, level: "$_id", topics: 1, count: 1 } },
    ]);
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

// GET /api/questions?level=1&topic=Intervals&type=mc&limit=10&shuffle=true
router.get("/questions", async (req, res, next) => {
  try {
    const { topic, type, shuffle } = req.query;
    const level = toInt(req.query.level);
    const limit = Math.min(Math.max(toInt(req.query.limit) || 10, 1), 50);

    const match = {};
    if (Number.isInteger(level)) match.level = level;
    if (topic) match.topic = String(topic);
    if (type) match.type = String(type);

    const pipeline = [{ $match: match }];
    if (shuffle === "true") pipeline.push({ $sample: { size: limit } });
    else pipeline.push({ $sort: { id: 1 } }, { $limit: limit });
    pipeline.push({ $project: HIDE });

    res.json(await Question.aggregate(pipeline));
  } catch (e) {
    next(e);
  }
});

// GET /api/questions/:id  ->  single question (no answer)
router.get("/questions/:id", async (req, res, next) => {
  try {
    const q = await Question.findOne({ id: toInt(req.params.id) }, HIDE).lean();
    if (!q) return res.status(404).json({ error: "Question not found" });
    res.json(q);
  } catch (e) {
    next(e);
  }
});

// POST /api/questions/:id/check   body: { "answer": 1 }  or  { "answer": [2,3,5] } for multi
// -> { correct, correctAnswer, why }
router.post("/questions/:id/check", async (req, res, next) => {
  try {
    const q = await Question.findOne({ id: toInt(req.params.id) }).lean();
    if (!q) return res.status(404).json({ error: "Question not found" });

    const { answer } = req.body ?? {};
    let correct;

    if (q.type === "multi") {
      if (!Array.isArray(answer) || !answer.every(Number.isInteger)) {
        return res.status(400).json({ error: "answer must be an array of option indexes" });
      }
      const given = [...new Set(answer)].sort((a, b) => a - b);
      const expected = [...q.answer].sort((a, b) => a - b);
      correct = given.length === expected.length && given.every((v, i) => v === expected[i]);
    } else {
      if (!Number.isInteger(answer)) {
        return res.status(400).json({ error: "answer must be an option index" });
      }
      correct = answer === q.answer;
    }

    res.json({ correct, correctAnswer: q.answer, why: q.why });
  } catch (e) {
    next(e);
  }
});

export default router;
