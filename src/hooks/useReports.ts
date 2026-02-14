import { useState, useCallback, useRef } from 'react';
import * as reportService from '@/services/reportService.ts';
import type { ReportData } from '@/types/api.ts';

interface UseReportsReturn {
  report: ReportData | null;
  monthlySummary: Awaited<ReturnType<typeof reportService.getMonthlySummary>> | null;
  categoryBreakdown: Awaited<ReturnType<typeof reportService.getCategoryBreakdown>>;
  monthlyTrend: Awaited<ReturnType<typeof reportService.getMonthlyTrend>>;
  balance: Awaited<ReturnType<typeof reportService.getBalance>> | null;
  loading: boolean;
  error: string | null;
  fetchReport: (dateFrom: string, dateTo: string) => Promise<void>;
  fetchMonthlySummary: (userId: string, year: number, month: number) => Promise<void>;
  fetchCategoryBreakdown: (userId: string, dateFrom: string, dateTo: string) => Promise<void>;
  fetchMonthlyTrend: (userId: string, months?: number) => Promise<void>;
  fetchBalance: (userId: string) => Promise<void>;
}

export function useReports(): UseReportsReturn {
  const [report, setReport] = useState<ReportData | null>(null);
  const [monthlySummary, setMonthlySummary] = useState<Awaited<ReturnType<typeof reportService.getMonthlySummary>> | null>(null);
  const [categoryBreakdown, setCategoryBreakdown] = useState<Awaited<ReturnType<typeof reportService.getCategoryBreakdown>>>([] as Awaited<ReturnType<typeof reportService.getCategoryBreakdown>>);
  const [monthlyTrend, setMonthlyTrend] = useState<Awaited<ReturnType<typeof reportService.getMonthlyTrend>>>([] as Awaited<ReturnType<typeof reportService.getMonthlyTrend>>);
  const [balance, setBalance] = useState<Awaited<ReturnType<typeof reportService.getBalance>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cache = useRef(new Map<string, { data: unknown; timestamp: number }>());

  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  function getCached<T>(key: string): T | null {
    const entry = cache.current.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
      return entry.data as T;
    }
    return null;
  }

  function setCache(key: string, data: unknown) {
    cache.current.set(key, { data, timestamp: Date.now() });
  }

  const fetchReport = useCallback(async (dateFrom: string, dateTo: string) => {
    const cacheKey = `report:${dateFrom}:${dateTo}`;
    const cached = getCached<ReportData>(cacheKey);
    if (cached) { setReport(cached); return; }

    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getReport(dateFrom, dateTo);
      setReport(data);
      setCache(cacheKey, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch report');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlySummary = useCallback(async (userId: string, year: number, month: number) => {
    const cacheKey = `monthly:${userId}:${year}:${month}`;
    const cached = getCached<typeof monthlySummary>(cacheKey);
    if (cached) { setMonthlySummary(cached); return; }

    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getMonthlySummary(userId, year, month);
      setMonthlySummary(data);
      setCache(cacheKey, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategoryBreakdown = useCallback(async (userId: string, dateFrom: string, dateTo: string) => {
    const cacheKey = `breakdown:${userId}:${dateFrom}:${dateTo}`;
    const cached = getCached<typeof categoryBreakdown>(cacheKey);
    if (cached) { setCategoryBreakdown(cached); return; }

    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getCategoryBreakdown(userId, dateFrom, dateTo);
      setCategoryBreakdown(data);
      setCache(cacheKey, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch breakdown');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMonthlyTrend = useCallback(async (userId: string, months: number = 6) => {
    const cacheKey = `trend:${userId}:${months}`;
    const cached = getCached<typeof monthlyTrend>(cacheKey);
    if (cached) { setMonthlyTrend(cached); return; }

    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getMonthlyTrend(userId, months);
      setMonthlyTrend(data);
      setCache(cacheKey, data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch trend');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalance = useCallback(async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await reportService.getBalance(userId);
      setBalance(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    report,
    monthlySummary,
    categoryBreakdown,
    monthlyTrend,
    balance,
    loading,
    error,
    fetchReport,
    fetchMonthlySummary,
    fetchCategoryBreakdown,
    fetchMonthlyTrend,
    fetchBalance,
  };
}
