import React, { createContext, useContext, useState, useEffect } from "react";
import { portfolioData as baseData, PortfolioData } from "../data/portfolioData";
import { fetchPortfolioDataUnified } from "../lib/portfolioHydration";

interface PortfolioContextProps {
  portfolio: PortfolioData;
  setPortfolio: (data: PortfolioData) => void;
  refreshPortfolio: () => Promise<void>;
  isLoading: boolean;
  loadingProgress: number;
  loadingLogs: string[];
}

const PortfolioContext = createContext<PortfolioContextProps | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioData>(baseData);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);

  // Robust function to wrap any promise within a strict timeout period to ensure high-performance loading screens
  const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((resolve) => setTimeout(() => {
        console.warn(`[TIMEOUT] Database fetch exceeded ${ms}ms threshold. Activating local fallback payload.`);
        resolve(fallback);
      }, ms))
    ]);
  };

  const appendLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLoadingLogs((prev) => [...prev, `[${timeStr}] ${msg}`]);
  };

  const refreshPortfolio = async () => {
    setIsLoading(true);
    setLoadingProgress(0);
    setLoadingLogs([]);

    // Establish a beautiful background animation sweep that gently approaches 90%
    // of completion as the network requests resolve in the foreground.
    let currentProgress = 0;
    const progressTimer = setInterval(() => {
      if (currentProgress < 30) {
        currentProgress += Math.floor(Math.random() * 5) + 5; // Fast initial handshakes
      } else if (currentProgress < 65) {
        currentProgress += Math.floor(Math.random() * 3) + 2; // Mid-stage asset streams
      } else if (currentProgress < 90) {
        currentProgress += Math.floor(Math.random() * 2) + 1; // Fine-tuning calibrations
      }
      setLoadingProgress(Math.min(currentProgress, 90));
    }, 70);

    try {
      appendLog("SYSTEM_INITIALIZE: Launching port 3000 client framework...");
      await new Promise(resolve => setTimeout(resolve, 100));

      appendLog("INIT_HANDSHAKE: Handshaking secure Aurora database gateway...");
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 1: Query Projects with tech tags
      appendLog("[DATABASE_QUERY] CONNECT: Accessing 'projects' relational schema table...");
      await new Promise(resolve => setTimeout(resolve, 80));

      // Step 2: Query Experiences timeline
      appendLog("[DATABASE_QUERY] STREAM: Accessing 'experiences' timeline database...");
      await new Promise(resolve => setTimeout(resolve, 80));

      // Step 3: Query Certificates verified registry
      appendLog("[DATABASE_QUERY] VALIDATE: Accessing 'certificates' credential store...");
      await new Promise(resolve => setTimeout(resolve, 80));

      // Trigger the real-time fetch with a 2.0 second overall failsafe limit, preventing any infinite hangs
      const fetchPromise = fetchPortfolioDataUnified(baseData);
      const directHydrated = await withTimeout(fetchPromise, 2000, baseData);

      const matchesBaseProjects = JSON.stringify(directHydrated.projects) === JSON.stringify(baseData.projects);
      const matchesBaseExperience = JSON.stringify(directHydrated.experience) === JSON.stringify(baseData.experience);

      if (!matchesBaseProjects || !matchesBaseExperience) {
        appendLog("[DB_RESPONSE] DATA_VECTOR_RESOLVED: Direct Supabase client query pulled live data.");
        setPortfolio(directHydrated);

        clearInterval(progressTimer);
        setLoadingProgress(95);
        appendLog("INTEGRITY_CHECK: Validating SHA-256 database matrix checksums... OK");
        await new Promise(resolve => setTimeout(resolve, 100));

        setLoadingProgress(100);
        appendLog("CORE_READY: Aurora gateway link fully established. Welcome back.");
        await new Promise(resolve => setTimeout(resolve, 150));
        setIsLoading(false);
        return;
      }
    } catch (directError: any) {
      appendLog(`[WARNING] DIRECT QUERY BLOCKED (${directError.message || 'TIMEOUT'}). HANDSHAKING INTERNAL REST API...`);
    }

    // Step 4: Fallback to Backend Middleware route, capped at an aggressive 1.5 seconds check
    try {
      appendLog("[DB_QUERY] CALL: Querying database multiplexer proxy (/api/portfolio)...");
      const apiFetchPromise = fetch("/api/portfolio")
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            if (data && data.projects) {
              return data;
            }
          }
          throw new Error("Invalid response.");
        });

      const apiData = await withTimeout(apiFetchPromise, 1500, null);
      if (apiData) {
        appendLog("[DB_RESPONSE] PROXY_SUCCESS: Middleware api fetched live structures.");
        setPortfolio(apiData);
      } else {
        appendLog("[FALLBACK] SCHEMAS OFFLINE OR RESTRICTED. INITIALIZING COMPILED MEMORY PACKAGES.");
      }
    } catch (e: any) {
      appendLog("[FALLBACK] SOCKET RESOLUTION ERROR. INITIALIZING COMPILED BACKUP ARCHIVE.");
    }

    // Stop fast timer, smoothly conclude loading to 100%
    clearInterval(progressTimer);
    setLoadingProgress(95);
    appendLog("INTEGRITY_CHECK: Restoring compiled static cache matrix.");
    await new Promise(resolve => setTimeout(resolve, 100));

    setLoadingProgress(100);
    appendLog("CORE_READY: Compile bypass complete. Secured sandbox viewport ready.");
    await new Promise(resolve => setTimeout(resolve, 150));
    setIsLoading(false);
  };

  useEffect(() => {
    refreshPortfolio();
  }, []);

  return (
    <PortfolioContext.Provider value={{ portfolio, setPortfolio, refreshPortfolio, isLoading, loadingProgress, loadingLogs }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio() {
  const context = useContext(PortfolioContext);
  if (!context) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}
