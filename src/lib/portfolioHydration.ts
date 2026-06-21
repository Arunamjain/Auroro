import { getSupabaseClient } from "./supabaseClient";
import { ProjectItem, ExperienceItem, PortfolioData } from "../data/portfolioData";

/**
 * Robust Type definitions for nested Supabase joint outputs
 */
interface SupabaseSkillInventoryJoint {
  id?: string;
  name?: string;
  skill_name?: string;
}

interface SupabaseProjectSkillsMapJoint {
  skill_id?: string;
  skill_name?: string;
  skills_inventory?: SupabaseSkillInventoryJoint | SupabaseSkillInventoryJoint[];
}

interface SupabaseProjectJointResponse {
  id: string;
  title: string;
  subtitle?: string;
  highlights?: any; // could be array, JSON string, or piped text
  stats?: any;      // could be array of objects or JSON string
  project_skills_map?: SupabaseProjectSkillsMapJoint[];
}

/**
 * 1. PROJECTS & RELATIONALLY MAPPED SKILLS FETCH & DE-NESTING ENGINE
 * 
 * Performs a single joint database request down through "project_skills_map"
 * junction table to "skills_inventory" table.
 * De-nests and normalizes the complex relational JSON fields to be fully
 * compatible with the local UI dashboard models.
 */
export async function fetchProjectsWithSkills(): Promise<ProjectItem[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase || typeof supabase.from !== "function") {
    console.warn("[HYDRATION] Supabase client is not initialized or in standby fallback. Using empty default.");
    return [];
  }

  try {
    // Single request join query fetching everything in a single trip
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        title,
        highlights,
        stats,
        project_skills_map (
          skill_id,
          skills_inventory (
            id,
            skill_name
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[HYDRATION] Supabase Projects Join fetch error:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // CRITICAL DATA DE-NESTING LAYER
    return data.map((proj: any): ProjectItem => {
      const p = proj as SupabaseProjectJointResponse;
      
      // A. Extract and flatten mapped skills junction array
      let techTags: string[] = [];
      if (p.project_skills_map && Array.isArray(p.project_skills_map)) {
        techTags = p.project_skills_map
          .map((mapItem: SupabaseProjectSkillsMapJoint) => {
            if (!mapItem) return null;
            // Case 1: skill_name resides directly on the junction table itself
            if (mapItem.skill_name) {
              return mapItem.skill_name;
            }
            // Case 2: skill_name or name resides on skills_inventory join target
            if (mapItem.skills_inventory) {
              const invList = Array.isArray(mapItem.skills_inventory)
                ? mapItem.skills_inventory
                : [mapItem.skills_inventory];
              
              const matchedTag = invList
                .map(inv => inv?.name || inv?.skill_name)
                .find(name => !!name);
                
              return matchedTag || null;
            }
            return null;
          })
          .filter((tag): tag is string => typeof tag === "string" && tag.trim() !== "");
      }

      // Fallback fallback: If tags still empty, check project's native fields
      if (techTags.length === 0) {
        const rawProj = p as any;
        if (Array.isArray(rawProj.tech)) {
          techTags = rawProj.tech;
        } else if (typeof rawProj.tech_string === "string" && rawProj.tech_string) {
          techTags = rawProj.tech_string.split(",").map((s: string) => s.trim()).filter(Boolean);
        } else if (typeof rawProj.tech === "string" && rawProj.tech) {
          try {
            techTags = JSON.parse(rawProj.tech);
          } catch {
            techTags = rawProj.tech.split(",").map((s: string) => s.trim()).filter(Boolean);
          }
        }
      }

      // Check final tags safety
      if (!Array.isArray(techTags)) {
        techTags = [];
      }

      // B. Structure & decode description highlights (handles JSON, arrays, text/piped)
      let parsedHighlights: string[] = [];
      const rawHighlights = p.highlights || (p as any).description || [];
      if (Array.isArray(rawHighlights)) {
        parsedHighlights = rawHighlights;
      } else if (typeof rawHighlights === "string") {
        try {
          parsedHighlights = JSON.parse(rawHighlights);
        } catch {
          if (rawHighlights.includes(";")) {
            parsedHighlights = rawHighlights.split(";").map((h: string) => h.trim());
          } else if (rawHighlights.includes("|")) {
            parsedHighlights = rawHighlights.split("|").map((h: string) => h.trim());
          } else {
            parsedHighlights = [rawHighlights];
          }
        }
      }

      // C. Structure & decode metrics stats
      let parsedStats: { label: string; value: string }[] = [];
      const rawStats = p.stats || [];
      if (Array.isArray(rawStats)) {
        parsedStats = rawStats.map((item: any) => ({
          label: String(item.label || item.name || ""),
          value: String(item.value || item.metric || "")
        })).filter(item => item.label !== "");
      } else if (typeof rawStats === "string") {
        try {
          parsedStats = JSON.parse(rawStats);
        } catch {
          parsedStats = [];
        }
      }

      return {
        id: p.id,
        title: p.title || "Untitled Project",
        subtitle: p.subtitle || "",
        tech: techTags,
        highlights: parsedHighlights.filter(Boolean),
        stats: parsedStats
      };
    });

  } catch (err: any) {
    console.error("[HYDRATION] Fatal exception inside projects query:", err.message || err);
    return []; // Return empty safety-net array on crash/timeout to prevent terminal UI collapse
  }
}

/**
 * 2. COMPANION EXPERIENCES FETCH WITH FALLBACK CHANNELS
 * 
 * Target 'experiences' or singular 'experience' table dynamically.
 * Retrieve role, company, duration, and correctly marshal text arrays / JSON
 * of points/highlights.
 */
export async function fetchExperiences(): Promise<ExperienceItem[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase || typeof supabase.from !== "function") {
    console.warn("[HYDRATION] Supabase client is not available or in standby fallback.");
    return [];
  }

  // Attempt to load from 'experiences' plural first, fallback to 'experience' singular on exception/error
  let data: any[] | null = null;
  let fetchError: any = null;

  try {
    const { data: pluralData, error: pluralError } = await supabase
      .from("experiences")
      .select("*")
      .order("created_at", { ascending: false });

    if (pluralError) {
      console.warn("[HYDRATION] FAILED querying plural 'experiences', retrying singular 'experience' fallback...", pluralError.message);
      const { data: singularData, error: singularError } = await supabase
        .from("experience")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (singularError) {
        fetchError = singularError;
      } else {
        data = singularData;
      }
    } else {
      data = pluralData;
    }

    if (fetchError) {
      console.error("[HYDRATION] Error querying experiences (both schema attempts):", fetchError.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Marshall table rows safely
    return data.map((exp: any): ExperienceItem => {
      // Decode points or highlights which may arrive as PostgreSQL text[], JSON string arrays, or semi-colon separated string blocks.
      const rawPoints = exp.points || exp.highlights || exp.description || [];
      let finalPoints: string[] = [];

      if (Array.isArray(rawPoints)) {
        finalPoints = rawPoints;
      } else if (typeof rawPoints === "string") {
        const trimmed = rawPoints.trim();
        if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
          try {
            finalPoints = JSON.parse(trimmed);
          } catch {
            finalPoints = trimmed.split(";").map(s => s.trim()).filter(Boolean);
          }
        } else if (trimmed.includes(";")) {
          finalPoints = trimmed.split(";").map(s => s.trim()).filter(Boolean);
        } else if (trimmed.includes("|")) {
          finalPoints = trimmed.split("|").map(s => s.trim()).filter(Boolean);
        } else if (trimmed !== "") {
          finalPoints = [trimmed];
        }
      }

      return {
        id: exp.id || `exp-${Math.random().toString(36).substr(2, 9)}`,
        role: exp.role || "Professional Drone",
        company: exp.company || "Stealth Startup",
        location: exp.location || "Remote",
        // Map postgres 'duration' or 'period' to standard UI key: 'period'
        period: exp.period || exp.duration || "Present",
        highlights: finalPoints.filter(Boolean)
      };
    });

  } catch (err: any) {
    console.error("[HYDRATION] Fatal exception inside experiences fetch:", err.message || err);
    return []; // Return empty safety-net array on crash/timeout to prevent terminal UI collapse
  }
}

/**
 * 2.5 Standalone Certificates Fetch from 'certificates' table
 */
export async function fetchCertificates(): Promise<any[]> {
  const supabase = getSupabaseClient();
  
  if (!supabase || typeof supabase.from !== "function") {
    console.warn("[HYDRATION] Supabase client is not available or in standby fallback to query certificates.");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("certificates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[HYDRATION] Error querying certificates table from Supabase:", error.message);
      return [];
    }

    if (!data || data.length === 0) {
      return [];
    }

    return data.map((cert: any) => ({
      name: cert.title || cert.name || "Untitled Certificate",
      issuer: cert.issuer || "Unknown Issuer",
      date: cert.issue_date || cert.period || cert.date || "2026",
      credentialUrl: cert.credential_url || cert.credentialUrl || ""
    }));
  } catch (err: any) {
    console.error("[HYDRATION] Fatal exception inside certificates fetch:", err.message || err);
    return [];
  }
}

/**
 * 3. MAIN GLOBAL WRAPPER: fetchPortfolioData()
 * 
 * Fetches, structures, and integrates projects, experiences, and certificates together,
 * merging with a supplied base/static state template if database records are empty.
 */
export async function fetchPortfolioDataUnified(baseState: PortfolioData): Promise<PortfolioData> {
  try {
    const [liveProjects, liveExperiences, liveCerts] = await Promise.all([
      fetchProjectsWithSkills(),
      fetchExperiences(),
      fetchCertificates()
    ]);

    const activeProjects = liveProjects.length > 0 ? liveProjects : baseState.projects;
    const activeExperiences = liveExperiences.length > 0 ? liveExperiences : baseState.experience;
    const activeCerts = liveCerts.length > 0 ? liveCerts : baseState.certifications;

    return {
      ...baseState,
      projects: activeProjects,
      experience: activeExperiences,
      certifications: activeCerts
    };
  } catch (err: any) {
    console.warn("[HYDRATION] Failed to execute full remote database query. Preserving static client state.", err.message);
    return baseState;
  }
}
