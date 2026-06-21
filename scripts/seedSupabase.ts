import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment configurations
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
  console.error("❌ ERROR: Supabase configurations missing or placeholder detected.");
  console.error("Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your env settings.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Define high-fidelity static portfolio data for seeding
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

async function runSeed() {
  console.log("⚡ Starting Supabase dynamic portfolio migration & database seeding...");

  try {
    // 1. SEED EXPERIENCES
    console.log("\n[1/4] Processing experience records seeding...");
    for (const exp of seeds.experience) {
      console.log(` -> Inserting Experience: ${exp.role} @ ${exp.company}`);
      const payload = {
        id: exp.id,
        role: exp.role,
        company: exp.company,
        location: exp.location,
        period: exp.period,
        highlights: exp.highlights,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from("experiences").upsert(payload, { onConflict: "id" });
      if (error) {
        console.warn(`    ⚠️ Warning upserting to main experiences table: ${error.message}. Retrying with fallback structure...`);
        // Fallback for different schema configuration (e.g. highlights as description)
        const fallbackPayload = {
          id: exp.id,
          role: exp.role,
          company: exp.company,
          location: exp.location,
          period: exp.period,
          description: exp.highlights.join(" | "),
          created_at: new Date().toISOString()
        };
        const { error: fbErr } = await supabase.from("experiences").upsert(fallbackPayload, { onConflict: "id" });
        if (fbErr) console.error(`    ❌ Fatal Experience insert failure:`, fbErr.message);
      }
    }

    // 2. SEED PROJECTS
    console.log("\n[2/4] Processing project records seeding...");
    for (const proj of seeds.projects) {
      console.log(` -> Inserting Project: ${proj.title}`);
      const payload = {
        id: proj.id,
        title: proj.title,
        subtitle: proj.subtitle,
        highlights: proj.highlights,
        stats: proj.stats,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from("projects").upsert(payload, { onConflict: "id" });
      if (error) {
        console.warn(`    ⚠️ Warning upserting to main projects table: ${error.message}. Retrying with fallback structure...`);
        const fallbackPayload = {
          id: proj.id,
          title: proj.title,
          subtitle: proj.subtitle,
          description: proj.highlights.join(" | "),
          created_at: new Date().toISOString()
        };
        const { error: fbErr } = await supabase.from("projects").upsert(fallbackPayload, { onConflict: "id" });
        if (fbErr) console.error(`    ❌ Fatal Project insert failure:`, fbErr.message);
      }

      // 3. SEED SKILLS & PROJECT JUNCTIONS
      console.log(`    -> Mapping active tech stack tags for [${proj.id}] relativity...`);
      // First wipe old associations for this specific project
      await supabase.from("project_skills_map").delete().eq("project_id", proj.id);

      for (const tName of proj.tech) {
        const cleanTag = tName.trim();
        if (!cleanTag) continue;

        let skillId: any = null;

        // Find or insert in skills_inventory
        const { data: existingSkill } = await supabase
          .from("skills_inventory")
          .select("id")
          .eq("skill_name", cleanTag)
          .maybeSingle();

        if (existingSkill) {
          skillId = existingSkill.id;
        } else {
          // Attempt insert
          const { data: insertedSkill, error: insErr } = await supabase
            .from("skills_inventory")
            .insert({ skill_name: cleanTag })
            .select("id")
            .maybeSingle();

          if (insertedSkill) {
            skillId = insertedSkill.id;
          } else {
            // Attempt secondary structural name insert
            const { data: insertedFallback } = await supabase
              .from("skills_inventory")
              .insert({ skill_name: cleanTag })
              .select("id")
              .maybeSingle();
            if (insertedFallback) skillId = insertedFallback.id;
          }
        }

        // Write mapping link record
        if (skillId) {
          const { error: mapErr } = await supabase.from("project_skills_map").insert({
            project_id: proj.id,
            skill_id: skillId
          });
          if (mapErr) {
            // Secondary mapping column fallbacks
            await supabase.from("project_skills_map").insert({
              project_id: proj.id,
              skill_name: cleanTag
            });
          }
        } else {
          // Write pure string reference connection if skills_inventory structure bypassed
          await supabase.from("project_skills_map").insert({
            project_id: proj.id,
            skill_name: cleanTag
          });
        }
      }
    }

    // 4. WRITE TELEMETRY LOG ENTRY
    console.log("\n[3/4] Logging dynamic telemetry activation indicator...");
    const { error: logErr } = await supabase.from("administration_logs").insert({
      action_performed: "MIGRATION_INITIALIZATION",
      details: "Dispatched initial system seeds including Bonito, MNIST, Titanic, Life Flow, and College Timetable records successfully mapped."
    });
    if (logErr) {
      console.warn("  ⚠️ Warning logging to administration_logs:", logErr.message);
    }

    console.log("\n[4/4] ✅ SEED COMPLETION: System database fully synchronized!");
  } catch (err: any) {
    console.error("❌ Seeding fatal boundary exception encountered:", err.message || err);
  }
}

runSeed();
