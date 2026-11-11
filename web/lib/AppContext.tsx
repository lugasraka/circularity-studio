"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DRILL_DEFAULT, CHAIR_DEFAULT } from "./defaults";
import { computeLevers, sortLevers, summarize } from "./model";
import type {
  Confidence,
  Factors,
  Gates,
  LeverComputation,
  ModelParams,
  ProductInputs,
  StudioState,
  Summary,
  BomComponent,
} from "./types";

export type PresetId = "drill" | "chair";

const STORAGE_KEY = "circularity-studio-state-v1";

export interface StudioContextValue {
  state: StudioState;
  factors: Factors;
  levers: LeverComputation[];
  sorted: LeverComputation[];
  summary: Summary;
  /** true once a saved session has been restored from localStorage */
  restored: boolean;
  resetToDrillExample: () => void;
  loadPreset: (id: PresetId) => void;
  preset: PresetId;
  setInput: <K extends keyof ProductInputs>(key: K, value: ProductInputs[K]) => void;
  setParam: <K extends keyof ModelParams>(key: K, value: number) => void;
  setGate: (code: string, gateIndex: 0 | 1 | 2, value: boolean) => void;
  setCost: (code: string, value: number) => void;
  setOverride: (code: string, value: number | null) => void;
  setBasis: (code: string, value: string) => void;
  setConfidence: (code: string, value: Confidence) => void;
  setBomRow: (index: number, field: keyof BomComponent, value: string | number | null) => void;
  addBomRow: () => void;
  removeBomRow: (index: number) => void;
  touched: boolean;
  setStateDirect: (s: StudioState) => void;
}

const StudioContext = createContext<StudioContextValue | null>(null);

export function StudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StudioState>(() => DRILL_DEFAULT);
  const [restored, setRestored] = useState(false);
  const [touched, setTouched] = useState(false);
  const [preset, setPreset] = useState<PresetId>("drill");

  // restore saved session after mount (SSR renders drill defaults → consistent hydration)
  useEffect(() => {
    try {
      // priority: URL hash share link
      const { stateFromHash } = await_import_share();
      function await_import_share() {
        // inline to avoid async import issues
        try {
          const hash = window.location.hash;
          if (hash.startsWith("#s=")) {
            const s = hash.slice(3);
            const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
            const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
            const parsed = JSON.parse(decodeURIComponent(escape(atob(b64 + pad)))) as StudioState;
            setState((prev) => ({
              ...prev,
              ...parsed,
              inputs: { ...prev.inputs, ...parsed.inputs, bom: parsed.inputs?.bom ?? prev.inputs.bom, displayCurrency: parsed.inputs?.displayCurrency ?? "EUR" },
              params: { ...prev.params, ...parsed.params },
            }));
            setTouched(true);
            return { stateFromHash: () => null };
          }
        } catch {}
        return { stateFromHash: () => null };
      }
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StudioState;
        setState((prev) => ({
          ...prev,
          ...parsed,
          inputs: { ...prev.inputs, ...parsed.inputs, bom: parsed.inputs?.bom ?? prev.inputs.bom, displayCurrency: parsed.inputs?.displayCurrency ?? "EUR" },
          params: { ...prev.params, ...parsed.params },
        }));
        setTouched(true);
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    } finally {
      setRestored(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // persist on change
  useEffect(() => {
    if (!restored) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / private mode — non-fatal */
    }
  }, [state, restored]);

  const mark = useCallback(() => setTouched(true), []);

  const resetToDrillExample = useCallback(() => {
    setState(DRILL_DEFAULT);
    setPreset("drill");
    window.localStorage.removeItem(STORAGE_KEY);
    setTouched(false);
  }, []);

  const loadPreset = useCallback((id: PresetId) => {
    setState(id === "chair" ? CHAIR_DEFAULT : DRILL_DEFAULT);
    setPreset(id);
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(id === "chair" ? CHAIR_DEFAULT : DRILL_DEFAULT)); } catch {}
    mark();
  }, [mark]);

  const setInput = useCallback(<K extends keyof ProductInputs>(key: K, value: ProductInputs[K]) => {
    setState((s) => ({ ...s, inputs: { ...s.inputs, [key]: value } }));
    mark();
  }, [mark]);

  const setParam = useCallback(<K extends keyof ModelParams>(key: K, value: number) => {
    setState((s) => ({ ...s, params: { ...s.params, [key]: value } }));
    mark();
  }, [mark]);

  const setGate = useCallback((code: string, gateIndex: 0 | 1 | 2, value: boolean) => {
    setState((s) => {
      const current = s.gates[code] ?? [true, true, true];
      const next = [...current] as Gates;
      next[gateIndex] = value;
      return { ...s, gates: { ...s.gates, [code]: next } };
    });
    mark();
  }, [mark]);

  const setCost = useCallback((code: string, value: number) => {
    setState((s) => ({ ...s, costs: { ...s.costs, [code]: value } }));
    mark();
  }, [mark]);

  const setOverride = useCallback((code: string, value: number | null) => {
    setState((s) => ({ ...s, overrides: { ...s.overrides, [code]: value } }));
    mark();
  }, [mark]);

  const setBasis = useCallback((code: string, value: string) => {
    setState((s) => ({ ...s, basis: { ...s.basis, [code]: value } }));
    mark();
  }, [mark]);

  const setConfidence = useCallback((code: string, value: Confidence) => {
    setState((s) => ({ ...s, confidence: { ...s.confidence, [code]: value } }));
    mark();
  }, [mark]);

  const setBomRow = useCallback((index: number, field: keyof BomComponent, value: string | number | null) => {
    setState((s) => {
      const bom = s.inputs.bom.map((row, i) => (i === index ? { ...row, [field]: value } : row));
      return { ...s, inputs: { ...s.inputs, bom } };
    });
    mark();
  }, [mark]);

  const addBomRow = useCallback(() => {
    setState((s) => ({
      ...s,
      inputs: {
        ...s.inputs,
        bom: [...s.inputs.bom, { component: "", family: "", massKg: 0, virginShare: null }],
      },
    }));
    mark();
  }, [mark]);

  const removeBomRow = useCallback((index: number) => {
    setState((s) => ({
      ...s,
      inputs: { ...s.inputs, bom: s.inputs.bom.filter((_, i) => i !== index) },
    }));
    mark();
  }, [mark]);

  const setStateDirect = useCallback((s: StudioState) => {
    setState((prev) => ({
      ...prev,
      ...s,
      inputs: { ...prev.inputs, ...s.inputs, bom: s.inputs?.bom ?? prev.inputs.bom, displayCurrency: s.inputs?.displayCurrency ?? "EUR" },
      params: { ...prev.params, ...s.params },
    }));
    mark();
  }, [mark]);

  const { factors, levers } = useMemo(() => computeLevers(state), [state]);
  const sorted = useMemo(() => sortLevers(levers), [levers]);
  const summary = useMemo(() => summarize(levers), [levers]);

  const value: StudioContextValue = {
    state, factors, levers, sorted, summary, restored,
    resetToDrillExample, loadPreset, preset, setInput, setParam, setGate, setCost,
    setOverride, setBasis, setConfidence, setBomRow, addBomRow, removeBomRow, touched, setStateDirect,
  };

  return <StudioContext.Provider value={value}>{children}</StudioContext.Provider>;
}

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used inside <StudioProvider>");
  return ctx;
}
