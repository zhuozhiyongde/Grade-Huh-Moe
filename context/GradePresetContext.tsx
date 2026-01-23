'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  ConversionStrategy,
  DEFAULT_PRESET_ID,
  LetterGradeMapping,
  PresetConfig,
  PresetId,
  PRESETS,
  setGlobalPreset,
} from "@/lib/gradePresets";

type GradePresetContextValue = {
  presetId: PresetId;
  presetConfig: PresetConfig;
  customMappings: LetterGradeMapping;
  customStrategy: ConversionStrategy;
  setPresetId: (id: PresetId) => void;
  setCustomMappings: (mappings: LetterGradeMapping) => void;
  setCustomStrategy: (strategy: ConversionStrategy) => void;
};

const GradePresetContext = createContext<GradePresetContextValue | undefined>(undefined);

const STORAGE_KEYS = {
  presetId: "OPTION_GRADE_PRESET_ID",
  customMappings: "OPTION_GRADE_CUSTOM_MAPPINGS",
  customStrategy: "OPTION_GRADE_CUSTOM_STRATEGY",
} as const;

export function GradePresetProvider({ children }: { children: React.ReactNode }) {
  const [presetId, setPresetIdState] = useState<PresetId>(DEFAULT_PRESET_ID);
  const [customMappings, setCustomMappingsState] = useState<LetterGradeMapping>(
    PRESETS.custom.mappings
  );
  const [customStrategy, setCustomStrategyState] = useState<ConversionStrategy>("direct_gpa");

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedId = localStorage.getItem(STORAGE_KEYS.presetId);
      if (storedId && storedId in PRESETS) {
        setPresetIdState(storedId as PresetId);
      }

      const storedMappings = localStorage.getItem(STORAGE_KEYS.customMappings);
      if (storedMappings) {
        setCustomMappingsState(JSON.parse(storedMappings));
      }

      const storedStrategy = localStorage.getItem(STORAGE_KEYS.customStrategy);
      if (storedStrategy === "direct_gpa" || storedStrategy === "score_to_gpa") {
        setCustomStrategyState(storedStrategy);
      }
    } catch (error) {
      console.error("Failed to read grade preset from localStorage", error);
    }
  }, []);

  // Persist presetId
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.presetId, presetId);
    } catch (error) {
      console.error("Failed to persist presetId", error);
    }
  }, [presetId]);

  // Persist customMappings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customMappings, JSON.stringify(customMappings));
    } catch (error) {
      console.error("Failed to persist customMappings", error);
    }
  }, [customMappings]);

  // Persist customStrategy
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.customStrategy, customStrategy);
    } catch (error) {
      console.error("Failed to persist customStrategy", error);
    }
  }, [customStrategy]);

  // Compute the resolved preset config
  const presetConfig = useMemo<PresetConfig>(() => {
    if (presetId === "custom") {
      return {
        id: "custom",
        name: "自定义",
        description: "自定义等级制转换规则",
        strategy: customStrategy,
        mappings: customMappings,
      };
    }
    return PRESETS[presetId];
  }, [presetId, customMappings, customStrategy]);

  // Sync to global preset whenever config changes
  useEffect(() => {
    setGlobalPreset(presetConfig);
  }, [presetConfig]);

  const setPresetId = useCallback((id: PresetId) => {
    setPresetIdState(id);
  }, []);

  const setCustomMappings = useCallback((mappings: LetterGradeMapping) => {
    setCustomMappingsState(mappings);
  }, []);

  const setCustomStrategy = useCallback((strategy: ConversionStrategy) => {
    setCustomStrategyState(strategy);
  }, []);

  const value = useMemo<GradePresetContextValue>(
    () => ({
      presetId,
      presetConfig,
      customMappings,
      customStrategy,
      setPresetId,
      setCustomMappings,
      setCustomStrategy,
    }),
    [
      presetId,
      presetConfig,
      customMappings,
      customStrategy,
      setPresetId,
      setCustomMappings,
      setCustomStrategy,
    ]
  );

  return <GradePresetContext.Provider value={value}>{children}</GradePresetContext.Provider>;
}

export function useGradePreset() {
  const context = useContext(GradePresetContext);
  if (!context) {
    throw new Error("useGradePreset must be used within a GradePresetProvider");
  }
  return context;
}
