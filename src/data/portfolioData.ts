export interface SkillGroup {
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

export const portfolioData: PortfolioData = {
  personalInfo: {
    name: "Arunam Jain",
    title: "Data Science Coordinator & Technical Lead",
    subTitle: "Python Developer & Full-Stack Analyst",
    email: "arunamjaindps7@gmail.com",
    location: "Guna, MP, India",
    githubUrl: "https://github.com/ArunamJain", // Replace with exact link if preferred
    linkedinUrl: "https://www.linkedin.com/in/arunam-jain-162a7931a", // Replace with exact link if preferred
    bio: "Passionate B.Tech Computer Science student specializing in Data Science, ETL optimization, and machine learning pipeline construction. Proven track record leading cohorts of 150+ students in predictive modeling and quantitative data analytics."
  },
  skills: [
    {
      category: "Languages",
      skills: ["Python", "SQL", "C", "C++", "Java"]
    },
    {
      category: "Libraries & Frameworks",
      skills: ["NumPy", "Pandas", "Matplotlib", "Scikit-learn", "Seaborn", "FastAPI", "SciPy"]
    },
    {
      category: "BI & Visualization Tools",
      skills: ["Power BI", "Excel", "Tableau", "Matplotlib", "Seaborn"]
    },
    {
      category: "Databases & Tools",
      skills: ["PostgreSQL", "MySQL", "Firebase", "Git", "VS Code", "Ubuntu/Linux"]
    },
    {
      category: "Core Concepts",
      skills: [
        "Data Analysis",
        "Dashboard Development",
        "KPI Monitoring",
        "ETL Pipelines",
        "Data Wrangling",
        "Data Visualization",
        "Time Series Analysis",
        "Statistical Modeling",
        "Linear Regression",
        "REST API Integration"
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
  ],
  projects: [
    {
      id: "bonito",
      title: "Bonito",
      subtitle: "Sports Analytics Backend",
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
    },
    {
      id: "fcc-data",
      title: "Data Analysis Dashboard Series",
      subtitle: "freeCodeCamp Specialization Series",
      tech: ["NumPy", "Pandas", "Matplotlib", "Seaborn", "SciPy"],
      highlights: [
        "Created a matrix statistics calculator, Census demographic dashboard, medical data heatmaps, forum activity time series analyzer, and sea level linear trend forecaster."
      ],
      stats: [
        { label: "Sub-Projects", value: "5 End-to-end" },
        { label: "Forecast Limit", value: "Year 2050" },
        { label: "Libraries Used", value: "Pandas/SciPy" }
      ]
    }
  ],
  education: [
    {
      institution: "Jaypee University of Engineering and Technology",
      degree: "B.Tech – Computer Science & Engineering",
      period: "Jul 2024 – May 2028",
      location: "Guna, Madhya Pradesh"
    }
  ],
  certifications: [
    {
      name: "Data Analysis with Python",
      issuer: "freeCodeCamp",
      date: "2026"
    },
    {
      name: "C Programming",
      issuer: "Infosys Springboard",
      date: "Feb 2025"
    },
    {
      name: "Data Science & DSA Workshop Facilitator",
      issuer: "Code Conquerors",
      date: "2025"
    },
    {
      name: "IETE Students Forum Member",
      issuer: "IETE",
      date: "Oct 2024"
    }
  ]
};
