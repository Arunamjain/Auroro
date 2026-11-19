import bundledRawData from "../../data.json";

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
  credentialUrl?: string;
}

export interface PersonalInfo {
  name: string;
  title: string;
  subTitle: string;
  email: string;
  location: string;
  githubUrl: string;
  linkedinUrl: string;
  bio: string;
}

export interface GitHubPortfolioFile {
  skills: SkillGroup[];
  projects: ProjectItem[];
  certificates: CertificationItem[];
  experiences: ExperienceItem[];
  personalInfo?: PersonalInfo;
}

export interface PortfolioData {
  personalInfo: PersonalInfo;
  skills: SkillGroup[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  education: EducationItem[];
  certifications: CertificationItem[];
}

export const defaultPersonalInfo: PersonalInfo = {
  name: "Arunam Jain",
  title: "Data Science Coordinator & Technical Lead",
  subTitle: "Python Developer & Full-Stack Analyst",
  email: "arunamjaindps7@gmail.com",
  location: "Guna, MP, India",
  githubUrl: "https://github.com/ArunamJain",
  linkedinUrl: "https://www.linkedin.com/in/arunam-jain-162a7931a",
  bio: "Passionate B.Tech Computer Science student specializing in Data Science, ETL optimization, and machine learning pipeline construction. Proven track record leading cohorts of 150+ students in predictive modeling and quantitative data analytics."
};

export const defaultEducation: EducationItem[] = [
  {
    institution: "Jaypee University of Engineering and Technology",
    degree: "B.Tech – Computer Science & Engineering",
    period: "Jul 2024 – May 2028",
    location: "Guna, Madhya Pradesh"
  }
];

export const bundledGitHubData: GitHubPortfolioFile = bundledRawData as GitHubPortfolioFile;

export const portfolioData: PortfolioData = {
  personalInfo: {
    ...defaultPersonalInfo,
    ...(bundledGitHubData.personalInfo || {})
  },
  skills: Array.isArray(bundledGitHubData.skills) ? bundledGitHubData.skills : [],
  experience: Array.isArray(bundledGitHubData.experiences) ? bundledGitHubData.experiences : [],
  projects: Array.isArray(bundledGitHubData.projects) ? bundledGitHubData.projects : [],
  education: defaultEducation,
  certifications: Array.isArray(bundledGitHubData.certificates) ? bundledGitHubData.certificates : []
};
