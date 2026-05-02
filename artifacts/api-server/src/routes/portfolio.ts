import { Router } from "express";
import fs from "fs";
import path from "path";

const portfolioRouter = Router();
const DATA_PATH = path.resolve(process.cwd(), "data/portfolio.json");

function readPortfolio() {
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw);
}

function writePortfolio(data: unknown) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

type ValidationError = string | null;

function validatePortfolioUpdate(body: unknown): ValidationError {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return "Request body must be a JSON object";
  }
  const b = body as Record<string, unknown>;

  const stringFields = ["name", "handle", "title", "location", "email", "website", "github", "linkedin", "resume", "summary"];
  for (const field of stringFields) {
    if (field in b && typeof b[field] !== "string") {
      return `Field "${field}" must be a string`;
    }
  }

  const arrayFields = ["career", "projects", "domains", "skills", "sideProjects"];
  for (const field of arrayFields) {
    if (field in b && !Array.isArray(b[field])) {
      return `Field "${field}" must be an array`;
    }
  }

  const objectFields = ["stats", "education", "contact"];
  for (const field of objectFields) {
    if (field in b && (typeof b[field] !== "object" || Array.isArray(b[field]) || b[field] === null)) {
      return `Field "${field}" must be an object`;
    }
  }

  return null;
}

portfolioRouter.get("/portfolio", (_req, res) => {
  try {
    const data = readPortfolio();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Failed to load portfolio data" });
  }
});

portfolioRouter.get("/portfolio/auth-check", (req, res) => {
  const adminToken = process.env.PORTFOLIO_ADMIN_TOKEN;
  const providedToken = req.headers["x-admin-token"];
  if (!adminToken || providedToken !== adminToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  res.json({ ok: true });
});

portfolioRouter.put("/portfolio", (req, res) => {
  const adminToken = process.env.PORTFOLIO_ADMIN_TOKEN;
  const providedToken = req.headers["x-admin-token"];

  if (!adminToken || providedToken !== adminToken) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const validationError = validatePortfolioUpdate(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  try {
    const current = readPortfolio();
    // Auto-stamp updatedAt on every successful PUT (YYYY-MM-DD UTC)
    const today = new Date().toISOString().slice(0, 10);
    const updated = { ...current, ...req.body, updatedAt: today };
    writePortfolio(updated);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ error: "Failed to update portfolio data" });
  }
});

export default portfolioRouter;
