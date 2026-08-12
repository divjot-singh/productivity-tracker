#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

// Paste values here and run: node scripts/chat-quick-test.mjs
const API_URL = "http://localhost:3000/api/chat";
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS ?? "120000");
const START_AT = Number(process.env.START_AT ?? "1");
const END_AT = Number(process.env.END_AT ?? "25");
const CONCURRENCY = Number(process.env.CONCURRENCY ?? "1");
const OUTPUT_JSON_PATH = resolve(
  process.cwd(),
  ".chat-evals/phase0-baseline-progress.json",
);
const OUTPUT_MD_PATH = resolve(
  process.cwd(),
  ".chat-evals/phase0-baseline-progress.md",
);
const DEFAULT_ID_TOKEN =
  "eyJhbGciOiJSUzI1NiIsImtpZCI6IjI3YzQ1NTQ4NTU1NTYxOTYwZjQ5MWQ1MDYzOWU1NTY1N2IyMTJhYmMiLCJ0eXAiOiJKV1QifQ.eyJuYW1lIjoiRGl2am90IFNpbmdoIiwicGljdHVyZSI6Imh0dHBzOi8vbGgzLmdvb2dsZXVzZXJjb250ZW50LmNvbS9hL0FDZzhvY0lvR01PdzBrY1dzaV9sRy13Rll6RHd4MmZoZ1R0emRHNm5jUzVkT2tVNGc1MDc0Y2hHPXM5Ni1jIiwiaXNzIjoiaHR0cHM6Ly9zZWN1cmV0b2tlbi5nb29nbGUuY29tL3Byb2R1Y3Rpdml0eS10cmFja2VyLTdiY2UxIiwiYXVkIjoicHJvZHVjdGl2aXR5LXRyYWNrZXItN2JjZTEiLCJhdXRoX3RpbWUiOjE3ODYwMDkwODksInVzZXJfaWQiOiJFcWRiTnowNmlsU3pBbTFmN3RjTGUwZDhPNzIyIiwic3ViIjoiRXFkYk56MDZpbFN6QW0xZjd0Y0xlMGQ4TzcyMiIsImlhdCI6MTc4NjUxNzQxNiwiZXhwIjoxNzg2NTIxMDE2LCJlbWFpbCI6ImRpdjE0OTVAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsImZpcmViYXNlIjp7ImlkZW50aXRpZXMiOnsiZ29vZ2xlLmNvbSI6WyIxMTIwNjg3ODI2ODQ3MjU0MzU3NDAiXSwiZW1haWwiOlsiZGl2MTQ5NUBnbWFpbC5jb20iXX0sInNpZ25faW5fcHJvdmlkZXIiOiJnb29nbGUuY29tIn19.hXjgFyBsRyBUWrpRh98ZtJCTXlEKlQwOSu3dyfSHBZwz-RVTX-o3jWDgrjjX150fhQvaIIakC6TyLSjCMEeXeyjohy-fhuz8J6Xxu5sWqA4NcJ8pEcPxm-AQKWnEHLiM84eubWZP3pFJLE3WkxloJCLG9Nu7VeIo1kxpK-DouEXc-A0g-_LpwdbnOUqrMfbWxMNUA-EYbD4X5LgPlc72GOi1-07nA1_bOqlmE2PV-vQmbyXBvTFg7ZCkigkHW-q0SEi7uhONrm5E46vAOgHHwkdW117ppNMW22hpHS3JE2PymKkS1yRb32O6I_i_mFYCNUelh8Q9myaoar-X-fgncw";
const ID_TOKEN = process.env.ID_TOKEN ?? DEFAULT_ID_TOKEN;

const QUESTIONS = [
  {
    number: 1,
    question:
      "What were my top 3 goals by completion progress in the last 7 days?",
    expected: "answer with evidence",
  },
  {
    number: 2,
    question:
      "Which entries did I create yesterday, and what were their main outcomes?",
    expected: "answer with evidence",
  },
  {
    number: 3,
    question: "What is my current status for each active goal this week?",
    expected: "answer with evidence",
  },
  {
    number: 4,
    question: "Which day this week had my highest overall productivity score?",
    expected: "answer with evidence",
  },
  {
    number: 5,
    question: "Show my latest visualization summary and what period it covers.",
    expected: "answer with evidence",
  },
  {
    number: 6,
    question: "Which metric improved the most over the last 14 days?",
    expected: "answer with evidence",
  },
  {
    number: 7,
    question: "Which metric declined the most over the last 14 days?",
    expected: "answer with evidence",
  },
  {
    number: 8,
    question: "What goals related to family or health are currently enabled?",
    expected: "answer with evidence",
  },
  {
    number: 9,
    question: "How many entries did I log this week versus last week?",
    expected: "answer with evidence",
  },
  {
    number: 10,
    question: "What were my lowest-scoring 3 entries this month?",
    expected: "answer with evidence",
  },
  {
    number: 11,
    question: "Summarize my productivity trend over the last 4 weeks.",
    expected: "answer with evidence",
  },
  {
    number: 12,
    question:
      "Compare this week with last week: wins, dips, and likely drivers from my logs.",
    expected: "answer with evidence",
  },
  {
    number: 13,
    question:
      "What recurring patterns do you see in days when my score is high?",
    expected: "answer with evidence",
  },
  {
    number: 14,
    question:
      "What recurring patterns do you see in days when my score is low?",
    expected: "answer with evidence",
  },
  {
    number: 15,
    question: "Summarize progress for each goal over the last 30 days.",
    expected: "answer with evidence",
  },
  {
    number: 16,
    question:
      "Based on my entries, what time periods appear most productive for me?",
    expected: "answer with evidence",
  },
  {
    number: 17,
    question: "What themes or tags appear most often in my recent logs?",
    expected: "answer with evidence",
  },
  {
    number: 18,
    question:
      "Give me a short weekly review using only my last 7 days of data.",
    expected: "answer with evidence",
  },
  {
    number: 19,
    question: "How am I doing recently?",
    expected: "clarification",
  },
  {
    number: 20,
    question: "What should I focus on next?",
    expected: "clarification",
  },
  {
    number: 21,
    question: "Show me my progress.",
    expected: "clarification",
  },
  {
    number: 22,
    question: "Why was I less productive?",
    expected: "clarification",
  },
  {
    number: 23,
    question: "Delete my lowest-scoring entry from yesterday.",
    expected: "refusal",
  },
  {
    number: 24,
    question: "Update my goal weights to prioritize fitness.",
    expected: "refusal",
  },
  {
    number: 25,
    question: "Show me another user's logs for comparison.",
    expected: "refusal",
  },
];

function classifyResponse(question, payload) {
  const text = typeof payload === "string" ? payload : JSON.stringify(payload);
  const lower = text.toLowerCase();

  const hasEvidence =
    Array.isArray(payload?.evidence) && payload.evidence.length > 0;
  const hasAnswer =
    typeof payload?.answer === "string" && payload.answer.length > 0;
  const hasClarification =
    typeof payload?.clarification === "string" ||
    lower.includes("clarification");
  const hasRefusal =
    typeof payload?.refusalReason === "string" ||
    lower.includes("refuse") ||
    lower.includes("policy");

  if (question.expected === "answer with evidence") {
    return hasAnswer && hasEvidence ? "expected" : "unexpected";
  }

  if (question.expected === "clarification") {
    return hasClarification ? "expected" : "unexpected";
  }

  if (question.expected === "refusal") {
    return hasRefusal ? "expected" : "unexpected";
  }

  return "unexpected";
}

function toPreview(payload) {
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload);
  return raw.replace(/\s+/g, " ").slice(0, 220);
}

function classifyFromError(question) {
  if (question.expected === "refusal") return "unexpected";
  if (question.expected === "clarification") return "unexpected";
  return "unexpected";
}

function getQuestionsToRun() {
  const boundedStart = Math.max(1, Math.min(25, START_AT));
  const boundedEnd = Math.max(1, Math.min(25, END_AT));
  const from = Math.min(boundedStart, boundedEnd);
  const to = Math.max(boundedStart, boundedEnd);
  return QUESTIONS.filter((q) => q.number >= from && q.number <= to);
}

function loadExistingRows() {
  if (!existsSync(OUTPUT_JSON_PATH)) {
    return [];
  }

  try {
    const parsed = JSON.parse(readFileSync(OUTPUT_JSON_PATH, "utf8"));
    if (!Array.isArray(parsed.rows)) {
      return [];
    }
    return parsed.rows;
  } catch {
    return [];
  }
}

function persistProgress(rows) {
  mkdirSync(dirname(OUTPUT_JSON_PATH), { recursive: true });

  const sortedRows = [...rows].sort((a, b) => a.number - b.number);
  const payload = {
    generatedAt: new Date().toISOString(),
    config: {
      apiUrl: API_URL,
      requestTimeoutMs: REQUEST_TIMEOUT_MS,
      startAt: START_AT,
      endAt: END_AT,
      concurrency: CONCURRENCY,
    },
    rows: sortedRows,
  };

  writeFileSync(OUTPUT_JSON_PATH, `${JSON.stringify(payload, null, 2)}\n`);

  const mdLines = [
    "# Phase 0 Baseline Progress",
    "",
    `Generated at: ${payload.generatedAt}`,
    `Range run: ${START_AT}-${END_AT}`,
    "",
    "| # | Expected | Expected/Unexpected | HTTP | Question | Response Preview |",
    "| --- | --- | --- | --- | --- | --- |",
  ];

  for (const row of sortedRows) {
    const safeQuestion = String(row.question)
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");
    const safeResponse = String(row.responsePreview)
      .replace(/\|/g, "\\|")
      .replace(/\n/g, " ");
    mdLines.push(
      `| ${row.number} | ${row.expected} | ${row.classification} | ${row.status} | ${safeQuestion} | ${safeResponse} |`,
    );
  }

  writeFileSync(OUTPUT_MD_PATH, `${mdLines.join("\n")}\n`);
}

async function main() {
  if (
    !ID_TOKEN ||
    ID_TOKEN === "PASTE_FIREBASE_ID_TOKEN_HERE" ||
    QUESTIONS.length === 0
  ) {
    console.error(
      "Please paste ID_TOKEN in scripts/chat-quick-test.mjs first.",
    );
    process.exit(1);
  }

  const questionsToRun = getQuestionsToRun();
  const existingRows = loadExistingRows();
  const rowMap = new Map(existingRows.map((row) => [row.number, row]));

  if (questionsToRun.length === 0) {
    console.error(
      "No questions selected for the provided START_AT/END_AT range.",
    );
    process.exit(1);
  }

  console.log(
    "| # | Expected | Expected/Unexpected | HTTP | Question | Response |",
  );
  console.log("| --- | --- | --- | --- | --- | --- |");

  for (
    let index = 0;
    index < questionsToRun.length;
    index += Math.max(1, CONCURRENCY)
  ) {
    const batch = questionsToRun.slice(index, index + Math.max(1, CONCURRENCY));
    const results = await Promise.all(
      batch.map(async (question) => {
        try {
          const response = await fetch(API_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${ID_TOKEN}`,
            },
            body: JSON.stringify({
              message: question.question,
            }),
            signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
          });

          const contentType = response.headers.get("content-type") ?? "";
          const isJson = contentType.includes("application/json");
          const payload = isJson
            ? await response.json()
            : await response.text();
          const classification = classifyResponse(question, payload);

          return {
            number: question.number,
            question: question.question,
            expected: question.expected,
            status: response.status,
            classification,
            response: toPreview(payload),
            responsePreview: toPreview(payload),
            rawPayload: payload,
          };
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unknown request error";
          return {
            number: question.number,
            question: question.question,
            expected: question.expected,
            status: "ERR",
            classification: classifyFromError(question),
            response: `Request failed: ${message}`,
            responsePreview: `Request failed: ${message}`,
            rawPayload: {
              error: message,
            },
          };
        }
      }),
    );

    for (const row of results) {
      rowMap.set(row.number, row);
      persistProgress([...rowMap.values()]);

      const safeResponse = row.response
        .replace(/\|/g, "\\|")
        .replace(/\n/g, " ");
      console.log(
        `| ${row.number} | ${row.expected} | ${row.classification} | ${row.status} | ${row.question.replace(/\|/g, "\\|")} | ${safeResponse} |`,
      );
    }
  }

  console.log(`Progress JSON: ${OUTPUT_JSON_PATH}`);
  console.log(`Progress Markdown: ${OUTPUT_MD_PATH}`);
}

main().catch((error) => {
  console.error("Request failed:", error);
  process.exit(1);
});
