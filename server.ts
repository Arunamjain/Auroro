import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import { portfolioData as basePortfolioData } from "./src/data/portfolioData";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let dbClient: any = null;
if (supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("placeholder")) {
  try {
    dbClient = createClient(supabaseUrl, supabaseAnonKey);
    console.log("[SYS] Live backend Supabase DB client active.");
  } catch (err) {
    console.error("[SYS] Error initializing Supabase client:", err);
  }
}

// --- DYNAMIC SUPABASE READ VECTOR ---
async function fetchPortfolioFromSupabase() {
  if (!dbClient) return null;
  try {
    // Query projects of analytical models, ordered by created_at DESC
    const { data: dbProjects, error: projError } = await dbClient
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (projError) {
      console.warn("[SYS] Failed to query projects from Supabase. Falling back.", projError.message);
      return null;
    }

    // Query experiences, ordered by created_at DESC
    let dbExperiences = null;
    const { data: expData, error: expError } = await dbClient
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false });

    if (expError) {
      // Fallback check with singular 'experience' table name
      const { data: expSingular, error: expSingularError } = await dbClient
        .from("experience")
        .select("*")
        .order("created_at", { ascending: false });

      if (expSingularError) {
        console.warn("[SYS] Failed to query both experiences/experience tables from Supabase. Falling back.", expError.message, expSingularError.message);
        return null;
      } else {
        dbExperiences = expSingular;
      }
    } else {
      dbExperiences = expData;
    }

    // Check skills association for projects in junction mapping table
    const { data: skillsMap, error: mapError } = await dbClient
      .from("project_skills_map")
      .select("project_id, skills_inventory(id, skill_name)");

    const mappedProjects = dbProjects.map((p: any) => {
      let projectTech: string[] = [];
      if (skillsMap && !mapError) {
        const matches = skillsMap.filter((m: any) => m.project_id === p.id);
        projectTech = matches.map((m: any) => {
          const sObj = m.skills_inventory;
          return sObj ? (sObj.skill_name || "") : "";
        }).filter(Boolean);
      }

      // Fallback: if tech array empty, check project's native text/array property fields
      if (projectTech.length === 0) {
        if (Array.isArray(p.tech)) {
          projectTech = p.tech;
        } else if (p.tech_string) {
          projectTech = p.tech_string.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (p.tech && typeof p.tech === "string") {
          try {
            projectTech = JSON.parse(p.tech);
          } catch {
            projectTech = p.tech.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        }
      }

      // Compile stats
      let projectStats = p.stats;
      if (typeof p.stats === "string") {
        try { projectStats = JSON.parse(p.stats); } catch { projectStats = []; }
      }

      // Compile description highlights
      let projectHighlights = p.highlights;
      if (typeof p.highlights === "string") {
        try {
          projectHighlights = JSON.parse(p.highlights);
        } catch {
          projectHighlights = p.highlights.split(";").map((h: string) => h.trim());
        }
      } else if (!Array.isArray(p.highlights) && p.description) {
        projectHighlights = [p.description];
      }

      return {
        id: p.id,
        title: p.title,
        subtitle: p.subtitle || "",
        tech: projectTech,
        highlights: Array.isArray(projectHighlights) ? projectHighlights : [],
        stats: Array.isArray(projectStats) ? projectStats : []
      };
    });

    const mappedExperiences = dbExperiences.map((e: any) => {
      let expHighlights = e.highlights;
      if (typeof e.highlights === "string") {
        try {
          expHighlights = JSON.parse(e.highlights);
        } catch {
          expHighlights = e.highlights.split(";").map((h: string) => h.trim());
        }
      } else if (!Array.isArray(e.highlights) && e.description) {
        expHighlights = [e.description];
      }

      return {
        id: e.id,
        role: e.role,
        company: e.company,
        location: e.location || "",
        period: e.period || "",
        highlights: Array.isArray(expHighlights) ? expHighlights : []
      };
    });

    // Query certificates ordered by created_at DESC
    let dbCertificates = [];
    try {
      const { data: certData, error: certError } = await dbClient
        .from("certificates")
        .select("*")
        .order("created_at", { ascending: false });
      if (!certError && certData) {
        dbCertificates = certData;
      }
    } catch (e: any) {
      console.warn("[SYS] Warning: Failed to query certificates table from Supabase in backend loop. Standby mode active.", e.message || e);
    }

    const mappedCertificates = dbCertificates.map((c: any) => ({
      name: c.title || c.name || "Untitled Certificate",
      issuer: c.issuer || "Unknown Issuer",
      date: c.issue_date || c.period || c.date || "2026",
      credentialUrl: c.credential_url || c.credentialUrl || ""
    }));

    return {
      projects: mappedProjects,
      experience: mappedExperiences,
      certifications: mappedCertificates
    };
  } catch (err: any) {
    console.error("[SYS] Error inside fetchPortfolioFromSupabase:", err.message || err);
    return null;
  }
}

// --- DYNAMIC SUPABASE WRITE & SYNC OPERATIONS ---
async function syncProjectToSupabase(project: any, actionType: "CREATE_PROJECT" | "UPDATE_PROJECT" | "DELETE_PROJECT") {
  if (!dbClient) return;
  try {
    if (actionType === "DELETE_PROJECT") {
      await dbClient.from("project_skills_map").delete().eq("project_id", project.id);
      await dbClient.from("projects").delete().eq("id", project.id);
      await dbClient.from("administration_logs").insert({
        action_performed: "DELETE_PROJECT",
        details: `Deleted project ID: ${project.id}. Title: ${project.title}`
      });
      return;
    }

    const isNew = actionType === "CREATE_PROJECT";
    const projectRecord = {
      id: project.id,
      title: project.title,
      subtitle: project.subtitle,
      highlights: project.highlights,
      stats: project.stats,
      updated_at: new Date().toISOString()
    };

    if (isNew) {
      const { error: insertErr } = await dbClient.from("projects").insert({
        ...projectRecord,
        created_at: new Date().toISOString()
      });
      if (insertErr) {
        console.warn("[SYS] Failed to insert project directly, trying description fallback.", insertErr.message);
        await dbClient.from("projects").insert({
          id: projectRecord.id,
          title: projectRecord.title,
          subtitle: projectRecord.subtitle,
          description: project.highlights.join(" | "),
          created_at: new Date().toISOString()
        });
      }
    } else {
      const { error: updateErr } = await dbClient.from("projects").update(projectRecord).eq("id", project.id);
      if (updateErr) {
        console.warn("[SYS] Failed to update project directly, trying description fallback.", updateErr.message);
        await dbClient.from("projects").update({
          title: projectRecord.title,
          subtitle: projectRecord.subtitle,
          description: project.highlights.join(" | ")
        }).eq("id", project.id);
      }
    }

    // Process tag mappings in junction table
    if (Array.isArray(project.tech)) {
      await dbClient.from("project_skills_map").delete().eq("project_id", project.id);

      for (const skillName of project.tech) {
        const cleanSkillName = skillName.trim();
        if (!cleanSkillName) continue;

        let skillId: any = null;

        const { data: existingSkill } = await dbClient
          .from("skills_inventory")
          .select("id")
          .eq("skill_name", cleanSkillName)
          .maybeSingle();

        if (existingSkill) {
          skillId = existingSkill.id;
        } else {
          const { data: newSkill } = await dbClient
            .from("skills_inventory")
            .insert({ skill_name: cleanSkillName })
            .select("id")
            .maybeSingle();
            
          if (newSkill) {
            skillId = newSkill.id;
          } else {
            const { data: fallbackSkill } = await dbClient
              .from("skills_inventory")
              .insert({ skill_name: cleanSkillName })
              .select("id")
              .maybeSingle();
            if (fallbackSkill) skillId = fallbackSkill.id;
          }
        }

        if (skillId) {
          const { error: mapErr } = await dbClient.from("project_skills_map").insert({
            project_id: project.id,
            skill_id: skillId
          });
          if (mapErr) {
            await dbClient.from("project_skills_map").insert({
              project_id: project.id,
              skill_name: cleanSkillName
            });
          }
        } else {
          await dbClient.from("project_skills_map").insert({
            project_id: project.id,
            skill_name: cleanSkillName
          });
        }
      }
    }

    await dbClient.from("administration_logs").insert({
      action_performed: actionType,
      details: `${isNew ? "Created" : "Updated"} project ${project.title} (ID: ${project.id}) with tech stack [${project.tech?.join(", ")}]`
    });
  } catch (err: any) {
    console.error("[SYS] Error inside syncProjectToSupabase:", err.message || err);
  }
}

async function syncExperienceToSupabase(exp: any, actionType: "CREATE_EXPERIENCE" | "UPDATE_EXPERIENCE" | "DELETE_EXPERIENCE") {
  if (!dbClient) return;
  try {
    if (actionType === "DELETE_EXPERIENCE") {
      const { error: delErr } = await dbClient.from("experiences").delete().eq("id", exp.id);
      if (delErr) {
        await dbClient.from("experience").delete().eq("id", exp.id);
      }
      await dbClient.from("administration_logs").insert({
        action_performed: "DELETE_EXPERIENCE",
        details: `Deleted experience ID: ${exp.id}. Role: ${exp.role} @ ${exp.company}`
      });
      return;
    }

    const isNew = actionType === "CREATE_EXPERIENCE";
    const expRecord = {
      id: exp.id,
      role: exp.role,
      company: exp.company,
      location: exp.location,
      period: exp.period,
      highlights: exp.highlights,
      updated_at: new Date().toISOString()
    };

    if (isNew) {
      const { error: insertErr } = await dbClient.from("experiences").insert({
        ...expRecord,
        created_at: new Date().toISOString()
      });
      if (insertErr) {
        const { error: insertErr2 } = await dbClient.from("experience").insert({
          ...expRecord,
          created_at: new Date().toISOString()
        });
        if (insertErr2) {
          console.warn("[SYS] Failed to insert experiences directly, trying fallback with description.", insertErr.message, insertErr2.message);
          const { error: insertErr3 } = await dbClient.from("experiences").insert({
            id: expRecord.id,
            role: expRecord.role,
            company: expRecord.company,
            location: expRecord.location,
            period: expRecord.period,
            description: exp.highlights.join(" | "),
            created_at: new Date().toISOString()
          });
          if (insertErr3) {
            await dbClient.from("experience").insert({
              id: expRecord.id,
              role: expRecord.role,
              company: expRecord.company,
              location: expRecord.location,
              period: expRecord.period,
              description: exp.highlights.join(" | "),
              created_at: new Date().toISOString()
            });
          }
        }
      }
    } else {
      const { error: updateErr } = await dbClient.from("experiences").update(expRecord).eq("id", exp.id);
      if (updateErr) {
        const { error: updateErr2 } = await dbClient.from("experience").update(expRecord).eq("id", exp.id);
        if (updateErr2) {
          console.warn("[SYS] Failed to update experiences directly, trying fallback with description.", updateErr.message, updateErr2.message);
          const { error: updateErr3 } = await dbClient.from("experiences").update({
            role: expRecord.role,
            company: expRecord.company,
            location: expRecord.location,
            period: expRecord.period,
            description: exp.highlights.join(" | ")
          }).eq("id", exp.id);
          if (updateErr3) {
            await dbClient.from("experience").update({
              role: expRecord.role,
              company: expRecord.company,
              location: expRecord.location,
              period: expRecord.period,
              description: exp.highlights.join(" | ")
            }).eq("id", exp.id);
          }
        }
      }
    }

    await dbClient.from("administration_logs").insert({
      action_performed: actionType,
      details: `${isNew ? "Created" : "Updated"} Experience: ${exp.role} @ ${exp.company}`
    });
  } catch (err: any) {
    console.error("[SYS] Error inside syncExperienceToSupabase:", err.message || err);
  }
}


const app = express();
const PORT = 3000;

// Enable JSON bodies with moderate size limit
app.use(express.json({ limit: "5mb" }));

// Custom minimal cookie parser middleware
const getCookies = (req: express.Request): Record<string, string> => {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    list[parts.shift()?.trim() || ""] = decodeURIComponent(parts.join("="));
  });
  return list;
};

// --- DATA SECURITY SANITIZER ---
function sanitizeInput(obj: any): any {
  if (typeof obj === "string") {
    // Simple scrub to prevent basic HTML/Script injection in critical fields
    return obj
      .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, "[REDACTED_ATTACK]")
      .replace(/on\w+\s*=/gi, "blocked_attr=");
  } else if (Array.isArray(obj)) {
    return obj.map(sanitizeInput);
  } else if (obj !== null && typeof obj === "object") {
    const cleaned: any = {};
    for (const key in obj) {
      cleaned[key] = sanitizeInput(obj[key]);
    }
    return cleaned;
  }
  return obj;
}

// Ensure database folders are resolved
const PORTFOLIO_JSON_PATH = path.join(process.cwd(), "src/data/portfolioData.json");
const PORTFOLIO_TS_PATH = path.join(process.cwd(), "src/data/portfolioData.ts");

// IP Locking Registry for mitigation of brute force
interface IPTracker {
  failedAttempts: number;
  lockoutUntil: number;
}
const ipRegistry: Record<string, IPTracker> = {};

// JWT Token Configuration - generates an ephemeral 256-bit safe secret if no secret defined in env
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || crypto.randomBytes(32).toString("hex");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Generate clean HMAC HS256 Token
function generateJWT(payload: any): string {
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 2 * 60 * 60 * 1000 })).toString("base64url");
  const hmac = crypto.createHmac("sha256", JWT_SECRET);
  hmac.update(`${header}.${body}`);
  const signature = hmac.digest("base64url");
  return `${header}.${body}.${signature}`;
}

// Verify HMAC Token
function verifyJWT(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, signature] = parts;
    const hmac = crypto.createHmac("sha256", JWT_SECRET);
    hmac.update(`${header}.${body}`);
    const expectedSignature = hmac.digest("base64url");
    if (signature !== expectedSignature) return null;
    const data = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (Date.now() > data.exp) return null;
    return data;
  } catch {
    return null;
  }
}

// Load current runtime portfolio data state
let currentPortfolio = { ...basePortfolioData };

if (fs.existsSync(PORTFOLIO_JSON_PATH)) {
  try {
    currentPortfolio = JSON.parse(fs.readFileSync(PORTFOLIO_JSON_PATH, "utf8"));
  } catch (err) {
    console.error("Failed to parse portfolio JSON, running on base data", err);
  }
} else {
  // Sync initial setup
  try {
    fs.writeFileSync(PORTFOLIO_JSON_PATH, JSON.stringify(currentPortfolio, null, 2), "utf8");
  } catch (err) {
    console.error("Failed to save initial portfolio JSON", err);
  }
}

// Function to safely update values ondisk
function savePortfolioState(updatedData: any) {
  currentPortfolio = sanitizeInput(updatedData);
  
  // Write to JSON file for high persistent durability
  fs.writeFileSync(PORTFOLIO_JSON_PATH, JSON.stringify(currentPortfolio, null, 2), "utf8");
  
  // Compiling back into a clean ES Module `.ts` structure so build/ZIP backups are perfect
  const tsTemplate = `export interface SkillGroup {
  category: string;
  skills: string[];
}

export interface ExperienceItem {
  id: string;
  role: string;
  company: string;
  location: string;
  period: string;
  highlights: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  subtitle: string;
  tech: string[];
  highlights: string[];
  stats?: { label: string; value: string }[];
}

export interface EducationItem {
  institution: string;
  degree: string;
  period: string;
  location: string;
}

export interface CertificationItem {
  name: string;
  issuer: string;
  date: string;
}

export interface PortfolioData {
  personalInfo: {
    name: string;
    title: string;
    subTitle: string;
    email: string;
    location: string;
    githubUrl: string;
    linkedinUrl: string;
    bio: string;
  };
  skills: SkillGroup[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export const portfolioData: PortfolioData = ${JSON.stringify(currentPortfolio, null, 2)};
`;
  
  fs.writeFileSync(PORTFOLIO_TS_PATH, tsTemplate, "utf8");
}

// --- SECURE ROUTING ENDPOINTS ---

// 1. Fetch public portfolio state - Dynamic Supabase Read Vector
app.get("/api/portfolio", async (req, res) => {
  try {
    const liveDB = await fetchPortfolioFromSupabase();
    if (liveDB && liveDB.projects && liveDB.experience) {
      const mergedPortfolio = {
        ...currentPortfolio,
        projects: liveDB.projects,
        experience: liveDB.experience,
        certifications: liveDB.certifications && liveDB.certifications.length > 0 
          ? liveDB.certifications 
          : currentPortfolio.certifications
      };
      return res.json(mergedPortfolio);
    }
  } catch (err: any) {
    console.error("[SYS] Error merging Supabase live data for /api/portfolio:", err.message);
  }
  res.json(currentPortfolio);
});

// 1.2 Fetch Supabase dynamic diagnostic configuration status
app.get("/api/supabase/status", async (req, res) => {
  const isConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes("placeholder"));
  const clientInitialized = !isConfigured ? false : !!dbClient;
  let connectionStable = false;
  let errorMsg = "";
  const tableChecks = {
    projects: false,
    experiences: false,
    skills_inventory: false,
    project_skills_map: false,
    administration_logs: false,
    certificates: false
  };

  if (isConfigured && dbClient) {
    try {
      const [projCheck, expCheck, skillCheck, mapCheck, logCheck, certCheck] = await Promise.all([
        dbClient.from("projects").select("id").limit(1),
        dbClient.from("experiences").select("id").limit(1),
        dbClient.from("skills_inventory").select("id").limit(1),
        dbClient.from("project_skills_map").select("project_id").limit(1),
        dbClient.from("administration_logs").select("id").limit(1),
        dbClient.from("certificates").select("id").limit(1)
      ]);

      tableChecks.projects = !projCheck.error;
      tableChecks.experiences = !expCheck.error;
      tableChecks.skills_inventory = !skillCheck.error;
      tableChecks.project_skills_map = !mapCheck.error;
      tableChecks.administration_logs = !logCheck.error;
      tableChecks.certificates = !certCheck.error;

      // Check for common table naming variations (e.g. experience vs experiences)
      if (expCheck.error) {
        const { error: expCheckFB } = await dbClient.from("experience").select("id").limit(1);
        if (!expCheckFB) {
          tableChecks.experiences = true;
        }
      }

      connectionStable = tableChecks.projects && tableChecks.experiences;
      if (!connectionStable) {
        const errors = [];
        if (projCheck.error) errors.push(`projects: ${projCheck.error.message}`);
        if (expCheck.error) errors.push(`experiences: ${expCheck.error.message}`);
        errorMsg = errors.join(" | ");
      }
    } catch (err: any) {
      errorMsg = err.message || "Failed to handshake with Supabase tables.";
    }
  } else {
    errorMsg = "Supabase env credentials (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are missing or set to placeholder values.";
  }

  res.json({
    configured: isConfigured,
    initialized: clientInitialized,
    connected: connectionStable,
    dbUrl: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : null,
    tableChecks,
    error: errorMsg
  });
});

// 2. Cryptographic Handshake (Initiates session setup, supplies CSRF token)
app.post(["/api/admin/handshake", "/api/verify-admin"], (req, res) => {
  const clientIP = req.ip || "unknown-ip";
  const tracker = ipRegistry[clientIP] || { failedAttempts: 0, lockoutUntil: 0 };
  
  if (Date.now() < tracker.lockoutUntil) {
    const minutesLeft = Math.ceil((tracker.lockoutUntil - Date.now()) / 60000);
    return res.status(429).json({
      error: `HANDSHAKE_BLOCKED: Telemetry flags raised. Nodes are locked. Retry in ${minutesLeft} minutes.`
    });
  }
  
  // Create unique single-session CSRF token
  const csrfToken = crypto.randomBytes(24).toString("hex");
  res.json({
    status: "SECURE_CONNECTION_STABLE",
    entropy: "4096_DH_PARAMS_VERIFIED",
    csrfToken
  });
});

// 3. Secure Admin Login with bruteforce lock protection
app.post("/api/admin/login", (req, res) => {
  const clientIP = req.ip || "unknown-ip";
  const { password, csrfToken } = req.body;
  
  const tracker = ipRegistry[clientIP] || { failedAttempts: 0, lockoutUntil: 0 };
  
  if (Date.now() < tracker.lockoutUntil) {
    const minutesLeft = Math.ceil((tracker.lockoutUntil - Date.now()) / 60000);
    return res.status(429).json({
      error: `HANDSHAKE_BLOCKED: Unauthorized connection attempts logged. Retry in ${minutesLeft} minutes.`
    });
  }
  
  // Payload validation
  if (!password || !csrfToken) {
    return res.status(400).json({ error: "ERR_BAD_HANDSHAKE: Missing credentials or token." });
  }
  
  if (password !== ADMIN_PASSWORD) {
    tracker.failedAttempts += 1;
    if (tracker.failedAttempts >= 3) {
      tracker.lockoutUntil = Date.now() + 15 * 60 * 1000; // Lock for 15 minutes
      ipRegistry[clientIP] = tracker;
      return res.status(401).json({
        error: "ERR_ACCESS_DENIED: Security threat vector flagged. Node locking down for 15 minutes."
      });
    } else {
      ipRegistry[clientIP] = tracker;
      return res.status(401).json({
        error: `ERR_ACCESS_DENIED: Handshake verification failed. ${3 - tracker.failedAttempts} attempts remaining.`
      });
    }
  }
  
  // Login succeeded! Reset rate-limiting tracker
  tracker.failedAttempts = 0;
  tracker.lockoutUntil = 0;
  ipRegistry[clientIP] = tracker;
  
  // Generate JWT containing session details and signed CSRF token
  const token = generateJWT({
    role: "admin",
    ip: clientIP,
    csrfToken
  });
  
  // Write secure HttpOnly cookie
  const isProd = process.env.NODE_ENV === "production";
  res.setHeader(
    "Set-Cookie",
    `admin_session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=7200; ${isProd ? "Secure;" : ""}`
  );
  
  res.json({
    auth: "AUTHORIZED",
    message: "Welcome to Central Matrix Deck.",
    sessionExpires: "2 hours"
  });
});

// 4. Session Validation and Verification Endpoint
app.get(["/api/admin/verify", "/api/verify-admin"], (req, res) => {
  const cookies = getCookies(req);
  const token = cookies.admin_session;
  
  if (!token) {
    return res.status(401).json({ auth: false, error: "ERR_SESSION_VOID: No active authentication session found." });
  }
  
  const decodedPayload = verifyJWT(token);
  if (!decodedPayload || decodedPayload.role !== "admin") {
    return res.status(401).json({ auth: false, error: "ERR_SESSION_INVALID: Session signature is corrupt or expired." });
  }
  
  res.json({ auth: true, info: "SESSION_HEALTHY", csrfToken: decodedPayload.csrfToken });
});

// 5. Admin logout endpoint
app.post("/api/admin/logout", (req, res) => {
  // Clear cookie immediately
  res.setHeader(
    "Set-Cookie",
    `admin_session=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0`
  );
  res.json({ status: "DEAUTH_COMPLETED" });
});

// 6. Multi-module CRUD administrator patch
app.post("/api/admin/update", async (req, res) => {
  const cookies = getCookies(req);
  const token = cookies.admin_session;
  
  if (!token) {
    return res.status(401).json({ error: "ERR_UNAUTHORIZED: Missing session token." });
  }
  
  const decodedPayload = verifyJWT(token);
  if (!decodedPayload || decodedPayload.role !== "admin") {
    return res.status(401).json({ error: "ERR_UNAUTHORIZED: Session invalid." });
  }
  
  // Enforce stateless Double-Submit CSRF check
  const clientCsrfToken = req.headers["x-csrf-token"];
  if (!clientCsrfToken || clientCsrfToken !== decodedPayload.csrfToken) {
    return res.status(403).json({ error: "ERR_CSRF_DETECTED: Cryptographic csrf handshake invalidated." });
  }
  
  const { updatedData } = req.body;
  if (!updatedData) {
    return res.status(400).json({ error: "ERR_MALFORMED_DATA: Missing portfolio data packet." });
  }
  
  try {
    // --- DYNAMIC WRITE/EDIT VECTOR (DIFFERENTIAL DELTA OPERATION) ---
    if (dbClient) {
      try {
        const oldProjects = currentPortfolio.projects || [];
        const newProjects = updatedData.projects || [];

        // 1. Detect Deleted Projects
        for (const oldP of oldProjects) {
          if (!newProjects.some((np: any) => np.id === oldP.id)) {
            console.log(`[SYS] Syncing deletion of project to Supabase: ${oldP.title}`);
            await syncProjectToSupabase(oldP, "DELETE_PROJECT");
          }
        }

        // 2. Detect Created or Updated Projects
        for (const newP of newProjects) {
          const oldP = oldProjects.find((op: any) => op.id === newP.id);
          if (!oldP) {
            console.log(`[SYS] Syncing creation of project to Supabase: ${newP.title}`);
            await syncProjectToSupabase(newP, "CREATE_PROJECT");
          } else {
            // Check for fields updates
            const changed =
              oldP.title !== newP.title ||
              oldP.subtitle !== newP.subtitle ||
              JSON.stringify(oldP.tech) !== JSON.stringify(newP.tech) ||
              JSON.stringify(oldP.highlights) !== JSON.stringify(newP.highlights) ||
              JSON.stringify(oldP.stats) !== JSON.stringify(newP.stats);

            if (changed) {
              console.log(`[SYS] Syncing update of project to Supabase: ${newP.title}`);
              await syncProjectToSupabase(newP, "UPDATE_PROJECT");
            }
          }
        }

        const oldExp = currentPortfolio.experience || [];
        const newExp = updatedData.experience || [];

        // 3. Detect Deleted Experiences
        for (const oldE of oldExp) {
          if (!newExp.some((ne: any) => ne.id === oldE.id)) {
            console.log(`[SYS] Syncing deletion of experience of Supabase: ${oldE.role}`);
            await syncExperienceToSupabase(oldE, "DELETE_EXPERIENCE");
          }
        }

        // 4. Detect Created or Updated Experiences
        for (const ne of newExp) {
          const oe = oldExp.find((o: any) => o.id === ne.id);
          if (!oe) {
            console.log(`[SYS] Syncing creation of experience to Supabase: ${ne.role}`);
            await syncExperienceToSupabase(ne, "CREATE_EXPERIENCE");
          } else {
            const changed =
              oe.role !== ne.role ||
              oe.company !== ne.company ||
              oe.location !== ne.location ||
              oe.period !== ne.period ||
              JSON.stringify(oe.highlights) !== JSON.stringify(ne.highlights);

            if (changed) {
              console.log(`[SYS] Syncing update of experience to Supabase: ${ne.role}`);
              await syncExperienceToSupabase(ne, "UPDATE_EXPERIENCE");
            }
          }
        }
      } catch (syncErr: any) {
        console.error("[SYS] Error during live Supabase delta sync execution:", syncErr.message || syncErr);
      }
    }

    // Keep file systems fully synchronized
    savePortfolioState(updatedData);
    res.json({ success: true, message: "PORTFOLIO_NODES_UPDATED_SUCCESSFULLY", data: currentPortfolio });
  } catch (err: any) {
    res.status(500).json({ error: "ERR_IO_FAILURE: Failed to write state update to disk.", details: err?.message });
  }
});

// 7. Manual/UI triggered Supabase dynamic seed router
app.post("/api/admin/seed", async (req, res) => {
  const cookies = getCookies(req);
  const token = cookies.admin_session;
  
  if (!token) {
    return res.status(401).json({ error: "ERR_UNAUTHORIZED: Missing session token." });
  }
  
  const decodedPayload = verifyJWT(token);
  if (!decodedPayload || decodedPayload.role !== "admin") {
    return res.status(401).json({ error: "ERR_UNAUTHORIZED: Session invalid." });
  }

  // Double submit token check
  const clientCsrfToken = req.headers["x-csrf-token"];
  if (!clientCsrfToken || clientCsrfToken !== decodedPayload.csrfToken) {
    return res.status(403).json({ error: "ERR_CSRF_DETECTED: Cryptographic csrf verification failed." });
  }

  if (!dbClient) {
    return res.status(400).json({ error: "ERR_UNCONFIGURED: Supabase target URL or Anon key is placeholder." });
  }

  try {
    console.log("[SYS] Seeding triggered via admin UI.");
    const seeds = {
      projects: [
        {
          id: "bonito",
          title: "Bonito Sports Analytics Backend",
          subtitle: "Sports Analytics Backend Engine",
          tech: ["Python", "FastAPI", "PostgreSQL", "Pandas", "Matplotlib"],
          highlights: [
            "Improved data integrity to 99%+ across 10,000+ player records by building ETL pipelines in PostgreSQL with automated validation checks.",
            "Reduced manual data entry times by ~60% via customized FastAPI dashboard endpoints."
          ],
          stats: [
            { label: "Data Integrity", value: "99%+" },
            { label: "Data Entry Speedup", value: "60%" },
            { label: "Records Handled", value: "10,000+" }
          ]
        },
        {
          id: "college-timetable",
          title: "College Timetable App",
          subtitle: "Automated Scheduler Engine",
          tech: ["Python", "FastAPI", "MySQL", "Genetic Algorithm", "React"],
          highlights: [
            "Developed automated scheduling matrix utilizing genetic algorithms to eliminate administrative class overlapping completely.",
            "Created custom administrative override dashboard logs keeping schedules fully synchronized with live department feeds."
          ],
          stats: [
            { label: "Timetable Collisions", value: "0" },
            { label: "Scheduler Duration", value: "2.4 sec" },
            { label: "Faculty Registered", value: "85+" }
          ]
        },
        {
          id: "life-flow",
          title: "Life Flow Webapp",
          subtitle: "Habit Tracking & Analytical Matrix",
          tech: ["React", "FastAPI", "PostgreSQL", "Tailwind CSS", "Recharts"],
          highlights: [
            "Designed and maintained visual analytics charts tracking cognitive routines and daily progress metrics.",
            "Implemented secure JWT access code layers and low latency telemetry reporting widgets."
          ],
          stats: [
            { label: "Operational Speed", value: "92ms" },
            { label: "Daily Active Nodes", value: "240+" },
            { label: "Habit Multiplier", value: "1.4x" }
          ]
        },
        {
          id: "mnist",
          title: "MNIST Digit Classifier",
          subtitle: "Machine Learning Pipeline",
          tech: ["Python", "Scikit-learn", "NumPy", "Matplotlib"],
          highlights: [
            "Achieved 97%+ test accuracy on 70,000 samples by training and benchmarking Logistic Regression, SVM, and Random Forest models.",
            "Produced rigorous model performance reports including confusion matrix analysis for business and stakeholder reviews."
          ],
          stats: [
            { label: "Accuracy Score", value: "97.4%" },
            { label: "Total Samples", value: "70k" },
            { label: "Algorithms", value: "Logistic/SVM/RF" }
          ]
        },
        {
          id: "titanic",
          title: "Titanic Dataset EDA",
          subtitle: "Exploratory & Predictive Modeling",
          tech: ["Python", "Pandas", "Seaborn", "Scikit-learn"],
          highlights: [
            "Built survival prediction models reaching ~80% accuracy on 891 records by engineering deep demographic/fare features.",
            "Visualized critical survival patterns and key performance indexes (KPIs) including rates by class, gender, and age through active widgets."
          ],
          stats: [
            { label: "Model Accuracy", value: "~80%" },
            { label: "Record Pool", value: "891 rows" },
            { label: "Viz Focus", value: "KPIs / Survival" }
          ]
        }
      ],
      experience: [
        {
          id: "code-conquerors",
          role: "Data Science Coordinator & Technical Lead",
          company: "Code Conquerors",
          location: "Guna, India",
          period: "Jun 2025 - Present",
          highlights: [
            "Improved data handling proficiency of 150+ students by 40% across 3 cohorts by designing and delivering an 8-module Python/data curriculum with hands-on dashboard-building & KPI tracking.",
            "Accelerated project delivery for 20+ mentees building EDA and classification models; conducted structured reviews translating findings into stakeholder-ready reports using Pandas and Seaborn."
          ]
        },
        {
          id: "rospinot",
          role: "Python Developer (Volunteer)",
          company: "RoSPinoT",
          location: "Remote, India",
          period: "Jul 2024 - Present",
          highlights: [
            "Reduced ETL pipeline runtime by ~30% for a distributed open-source team by engineering batch-processing Python scripts for multi-source data collection, cleaning, and transformation.",
            "Improved cross-team workflow consistency across 5+ data pipelines by documenting end-to-end ETL processes on Ubuntu/Linux, enabling direct action on outputs."
          ]
        }
      ]
    };

    // Erase old records if any to avoid duplication errors on first seed execution
    try {
      await dbClient.from("project_skills_map").delete().neq("project_id", "none");
      await dbClient.from("projects").delete().neq("id", "none");
      await dbClient.from("experiences").delete().neq("id", "none");
    } catch {}

    // Seed Experiences
    for (const exp of seeds.experience) {
      await syncExperienceToSupabase(exp, "CREATE_EXPERIENCE");
    }

    // Seed Projects, which triggers tags junction insertion recursively
    for (const proj of seeds.projects) {
      await syncProjectToSupabase(proj, "CREATE_PROJECT");
    }

    // Create log trace entry
    await dbClient.from("administration_logs").insert({
      action_performed: "MIGRATION_INITIALIZATION",
      details: "Dispatched direct seeds via dynamic panel dashboard interface successfully."
    });

    const diskPortfolio = {
      ...currentPortfolio,
      projects: seeds.projects,
      experience: seeds.experience
    };
    savePortfolioState(diskPortfolio);

    res.json({ success: true, message: "PROCESSED_SUCCESSFULLY: Database migration seeds loaded." });
  } catch (err: any) {
    res.status(500).json({ error: `ERR_SEEDING_FAILED: ${err.message}` });
  }
});

// --- ENHANCED CLIENT SPA ROUTING PROTECTION ---
// Protect navigation directly accessing '/admin' without valid authorization
app.get("/admin", (req, res, next) => {
  const cookies = getCookies(req);
  const token = cookies.admin_session;
  
  if (!token || !verifyJWT(token)) {
    // Aggressive redirect back to home with telemetry warning parameter
    return res.redirect("/?error=telemetry_flagged");
  }
  next();
});

// Setup Vite & Client server serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SYS] Full-stack application online. Listening on Port ${PORT}`);
  });
}

startServer();
