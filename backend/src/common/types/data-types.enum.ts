export enum DataType {
  INTEGER = 'integer',
  REAL = 'real',
  CHAR = 'char',
  STRING = 'string',
  CHAR_INTERVAL = 'charInvl',
  STRING_CHAR_INTERVAL = 'stringCharInvl',
}

export interface CharIntervalConfig {
  start: string;
  end: string;
}

export interface StringCharIntervalConfig {
  charInterval: CharIntervalConfig;
  minLength?: number;
  maxLength?: number;
}

export type TypeConfig = CharIntervalConfig | StringCharIntervalConfig | null;

export function isCharIntervalConfig(
  config: TypeConfig | undefined,
): config is CharIntervalConfig {
  return (
    !!config &&
    'start' in config &&
    'end' in config &&
    !('charInterval' in config)
  );
}

export function isStringCharIntervalConfig(
  config: TypeConfig | undefined,
): config is StringCharIntervalConfig {
  return !!config && 'charInterval' in config;
}
