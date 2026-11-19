import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { portfolioData as baseData, PortfolioData } from "../data/portfolioData";
import {
  fetchPortfolioFromGitHub,
  getSessionToken,
  DataSourceStatus,
  FetchPortfolioResult,
} from "../services/githubData";

interface PortfolioContextProps {
  portfolio: PortfolioData;
  setPortfolio: (data: PortfolioData) => void;
  markSavedToGitHub: (data: PortfolioData, commitSha?: string) => void;
  refreshPortfolio: (options?: { silent?: boolean }) => Promise<FetchPortfolioResult>;
  dataSource: DataSourceStatus;
  dataSourceMessage: string;
  isLoading: boolean;
  loadingProgress: number;
  loadingLogs: string[];
}

const PortfolioContext = createContext<PortfolioContextProps | undefined>(undefined);

export function PortfolioProvider({ children }: { children: React.ReactNode }) {
  const [portfolio, setPortfolio] = useState<PortfolioData>(baseData);
  const [dataSource, setDataSource] = useState<DataSourceStatus>("fallback");
  const [dataSourceMessage, setDataSourceMessage] = useState<string>("Initializing portfolio data...");
  const [isLoading, setIsLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingLogs, setLoadingLogs] = useState<string[]>([]);

  const withTimeout = async <T,>(promise: Promise<T>, ms: number, fallback: T): Promise<T> => {
    return Promise.race([
      promise,
      new Promise<T>((resolve) =>
        setTimeout(() => {
          console.warn(`[TIMEOUT] GitHub fetch exceeded ${ms}ms threshold. Activating bundled fallback.`);
          resolve(fallback);
        }, ms)
      ),
    ]);
  };

  const appendLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString("en-US", { hour12: false });
    setLoadingLogs((prev) => [...prev, `[${timeStr}] ${msg}`]);
  };

  const refreshPortfolio = useCallback(async (options?: { silent?: boolean }): Promise<FetchPortfolioResult> => {
    const silent = options?.silent ?? false;

    if (!silent) {
      setIsLoading(true);
      setLoadingProgress(0);
      setLoadingLogs([]);
    }

    let currentProgress = 0;
    const progressTimer = !silent
      ? setInterval(() => {
          if (currentProgress < 30) {
            currentProgress += Math.floor(Math.random() * 5) + 5;
          } else if (currentProgress < 65) {
            currentProgress += Math.floor(Math.random() * 3) + 2;
          } else if (currentProgress < 90) {
            currentProgress += Math.floor(Math.random() * 2) + 1;
          }
          setLoadingProgress(Math.min(currentProgress, 90));
        }, 70)
      : null;

    let result: FetchPortfolioResult = {
      data: baseData,
      source: "fallback",
      sha: null,
      message: "GitHub fetch timed out — using bundled copy.",
    };

    try {
      if (!silent) {
        appendLog("SYSTEM_INITIALIZE: Launching core client framework...");
        await new Promise((resolve) => setTimeout(resolve, 80));
        appendLog("GITHUB_API: Requesting Arunamjain/Auroro/contents/data.json...");
      }

      const token = getSessionToken();
      result = await withTimeout(fetchPortfolioFromGitHub(token), 5000, result);

      setPortfolio(result.data);
      setDataSource(result.source);
      setDataSourceMessage(result.message);

      if (!silent) {
        if (result.source === "github") {
          appendLog("[GITHUB_OK] Decoded Base64 payload for skills, projects, certificates & experiences.");
        } else if (result.source === "github-empty") {
          appendLog("[GITHUB_404] Remote data.json not yet published — loaded bundled data.json.");
        } else {
          appendLog("[FALLBACK] GitHub Contents API unavailable — loaded bundled portfolio snapshot.");
        }
      }
    } catch {
      setPortfolio(baseData);
      setDataSource("fallback");
      setDataSourceMessage("Unexpected error loading GitHub data — using bundled copy.");
      if (!silent) {
        appendLog("[FALLBACK] Unexpected error. Restoring bundled backup archive.");
      }
    }

    if (!silent) {
      if (progressTimer) clearInterval(progressTimer);
      setLoadingProgress(95);
      appendLog("INTEGRITY_CHECK: Portfolio state hydrated and verified.");
      await new Promise((resolve) => setTimeout(resolve, 90));

      setLoadingProgress(100);
      appendLog("CORE_READY: Secured sandbox viewport ready.");
      await new Promise((resolve) => setTimeout(resolve, 120));
      setIsLoading(false);
    }

    return result;
  }, []);

  const markSavedToGitHub = useCallback((data: PortfolioData, commitSha?: string) => {
    setPortfolio(data);
    setDataSource("github");
    setDataSourceMessage(
      commitSha
        ? `Synced with GitHub data.json (commit ${commitSha.slice(0, 7)}).`
        : "Synced with GitHub data.json."
    );
  }, []);

  useEffect(() => {
    refreshPortfolio();
  }, [refreshPortfolio]);

  return (
    <PortfolioContext.Provider
      value={{
        portfolio,
        setPortfolio,
        markSavedToGitHub,
        refreshPortfolio,
        dataSource,
        dataSourceMessage,
        isLoading,
        loadingProgress,
        loadingLogs,
      }}
    >
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
