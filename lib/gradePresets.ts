// Letter grades that can be mapped
export type LetterGrade = 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D+' | 'D' | 'F';

// Conversion strategy
export type ConversionStrategy = 'direct_gpa' | 'score_to_gpa';

// Mapping for a single grade
export type GradeMapping = {
    value: number; // Either GPA (0-4) or percentage score (0-100), NaN means no calculation
};

// Full mapping configuration
export type LetterGradeMapping = Record<LetterGrade, GradeMapping>;

// Preset identifiers
export type PresetId =
    | 'graduate'
    | 'no_calculation'
    | 'guanghua'
    | 'life_sciences'
    | 'foreign_languages'
    | 'custom';

// Preset configuration
export type PresetConfig = {
    id: PresetId;
    name: string;
    description: string;
    strategy: ConversionStrategy;
    mappings: LetterGradeMapping;
};

export const LETTER_GRADES: LetterGrade[] = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'F'];

// Preset definitions
export const PRESETS: Record<PresetId, PresetConfig> = {
    no_calculation: {
        id: 'no_calculation',
        name: '不参与计算',
        description: '等级制成绩不参与绩点计算（默认）',
        strategy: 'direct_gpa',
        mappings: {
            'A+': { value: NaN },
            A: { value: NaN },
            'A-': { value: NaN },
            'B+': { value: NaN },
            B: { value: NaN },
            'B-': { value: NaN },
            'C+': { value: NaN },
            C: { value: NaN },
            'C-': { value: NaN },
            'D+': { value: NaN },
            D: { value: NaN },
            F: { value: NaN },
        },
    },

    graduate: {
        id: 'graduate',
        name: '研究生',
        description: '直接映射：A+/A→4, A-→3.7, B+→3.3, B→3, B-→2.7...',
        strategy: 'direct_gpa',
        mappings: {
            'A+': { value: 4.0 },
            A: { value: 4.0 },
            'A-': { value: 3.7 },
            'B+': { value: 3.3 },
            B: { value: 3.0 },
            'B-': { value: 2.7 },
            'C+': { value: 2.3 },
            C: { value: 2.0 },
            'C-': { value: 1.7 },
            'D+': { value: 1.3 },
            D: { value: 1.0 },
            F: { value: 0 },
        },
    },

    guanghua: {
        id: 'guanghua',
        name: '光华',
        description: '转换为百分制：A+→97, A→92, A-→87... 再计算绩点',
        strategy: 'score_to_gpa',
        mappings: {
            'A+': { value: 97 },
            A: { value: 92 },
            'A-': { value: 87 },
            'B+': { value: 82 },
            B: { value: 79 },
            'B-': { value: 76 },
            'C+': { value: 73 },
            C: { value: 69 },
            'C-': { value: 65 },
            'D+': { value: 62 },
            D: { value: 60 },
            F: { value: 30 },
        },
    },

    life_sciences: {
        id: 'life_sciences',
        name: '生科',
        description: '直接映射：A→3.9, B→3.4, C→2.5, D→1.5, F→0',
        strategy: 'direct_gpa',
        mappings: {
            'A+': { value: 3.9 },
            A: { value: 3.9 },
            'A-': { value: 3.9 },
            'B+': { value: 3.4 },
            B: { value: 3.4 },
            'B-': { value: 3.4 },
            'C+': { value: 2.5 },
            C: { value: 2.5 },
            'C-': { value: 2.5 },
            'D+': { value: 1.5 },
            D: { value: 1.5 },
            F: { value: 0 },
        },
    },

    foreign_languages: {
        id: 'foreign_languages',
        name: '外院',
        description: '转换为百分制：A+/A→90, A-→87, B+→83... 再计算绩点',
        strategy: 'score_to_gpa',
        mappings: {
            'A+': { value: 90 },
            A: { value: 90 },
            'A-': { value: 87 },
            'B+': { value: 83 },
            B: { value: 79 },
            'B-': { value: 76 },
            'C+': { value: 73 },
            C: { value: 70 },
            'C-': { value: 66 },
            'D+': { value: 63 },
            D: { value: 60 },
            F: { value: 30 },
        },
    },

    custom: {
        id: 'custom',
        name: '自定义',
        description: '自定义等级制转换规则',
        strategy: 'direct_gpa',
        mappings: {
            'A+': { value: 4.0 },
            A: { value: 4.0 },
            'A-': { value: 3.7 },
            'B+': { value: 3.3 },
            B: { value: 3.0 },
            'B-': { value: 2.7 },
            'C+': { value: 2.3 },
            C: { value: 2.0 },
            'C-': { value: 1.7 },
            'D+': { value: 1.3 },
            D: { value: 1.0 },
            F: { value: 0 },
        },
    },
};

export const DEFAULT_PRESET_ID: PresetId = 'no_calculation';

// Module-level state for global preset
let _currentPreset: PresetConfig = PRESETS.no_calculation;

export function setGlobalPreset(config: PresetConfig): void {
    _currentPreset = config;
}

export function getGlobalPreset(): PresetConfig {
    return _currentPreset;
}

/**
 * Convert a letter grade to GPA using the given (or global) preset config.
 * Returns null if the grade should not participate in GPA calculation.
 */
export function convertLetterGrade(letter: string, config?: PresetConfig): number | null {
    const preset = config ?? _currentPreset;

    // Check if this is a letter grade we handle
    if (!(letter in preset.mappings)) {
        return null;
    }

    const mapping = preset.mappings[letter as LetterGrade];

    // NaN indicates "do not calculate"
    if (Number.isNaN(mapping.value)) {
        return null;
    }

    if (preset.strategy === 'direct_gpa') {
        // Direct GPA mapping
        return mapping.value;
    }
    // score_to_gpa: Convert percentage to GPA using the formula
    // This is the same formula from courseGpaFromNormalizedScore
    const score = mapping.value;
    if (score >= 60) {
        return 4 - (3 * Math.pow(100 - score, 2)) / 1600;
    }
    return null;
}
