import {
  DataType,
  CharIntervalConfig,
  StringCharIntervalConfig,
  isCharIntervalConfig,
  isStringCharIntervalConfig,
} from '../types/data-types.enum';
import { ColumnDefinition } from '../types/column.interface';

const isNil = (value) => value === undefined || value === null;

export class TypeValidator {
  static validate<T = unknown>(value: T, column: ColumnDefinition): boolean {
    if (value === null || value === undefined) {
      return column.nullable;
    }

    switch (column.type) {
      case DataType.INTEGER:
        return this.validateInteger(value);

      case DataType.REAL:
        return this.validateReal(value);

      case DataType.CHAR:
        return this.validateChar(value);

      case DataType.STRING:
        return this.validateString(value);

      case DataType.CHAR_INTERVAL:
        if (!isCharIntervalConfig(column.typeConfig)) {
          throw new Error('Invalid typeConfig for charInvl');
        }
        return this.validateCharInterval(value, column.typeConfig);

      case DataType.STRING_CHAR_INTERVAL:
        if (!isStringCharIntervalConfig(column.typeConfig)) {
          throw new Error('Invalid typeConfig for stringCharInvl');
        }
        return this.validateStringCharInterval(value, column.typeConfig);

      default:
        return false;
    }
  }

  static validateRecord<T extends Record<string, unknown>>(
    data: T,
    columns: ColumnDefinition[],
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const column of columns) {
      const value = data[column.name];

      if (value && column.isPrimaryKey && column.autoIncrement) {
        errors.push(
          `Insert statement should not include primary key autoIncrementing column '${column.name}'.`,
        );
        continue;
      }
      if (column.isPrimaryKey && column.autoIncrement) {
        continue;
      }

      if (
        (value === undefined || value === null) &&
        !column.nullable &&
        column.defaultValue === undefined
      ) {
        errors.push(`Column '${column.name}' is required`);
        continue;
      }

      if (value !== undefined && value !== null) {
        if (!this.validate(value, column)) {
          errors.push(this.getValidationError(value, column));
        }
      }
    }

    const validColumnNames = columns.map((c) => c.name);
    for (const key of Object.keys(data)) {
      if (!validColumnNames.includes(key)) {
        errors.push(`Unknown column: '${key}'`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  static applyDefaults<T extends Record<string, unknown>>(
    data: T,
    columns: ColumnDefinition[],
  ): T & Record<string, unknown> {
    return Object.fromEntries(
      columns.map((column) => {
        const key = column.name;
        const value =
          isNil(key) && column.defaultValue !== undefined
            ? column.defaultValue
            : data[key];
        return [key, value];
      }),
    ) as T;
  }

  private static validateInteger(value: unknown): value is number {
    return typeof value === 'number' && Number.isInteger(value);
  }

  private static validateReal(value: unknown): value is number {
    return typeof value === 'number' && !isNaN(value);
  }

  private static validateChar(value: unknown): value is string {
    return typeof value === 'string' && value.length === 1;
  }

  private static validateString(value: unknown): value is string {
    return typeof value === 'string';
  }

  private static validateCharInterval(
    value: unknown,
    config: CharIntervalConfig,
  ): boolean {
    if (!this.validateChar(value)) return false;

    const charCode = value.charCodeAt(0);
    const startCode = config.start.charCodeAt(0);
    const endCode = config.end.charCodeAt(0);

    return charCode >= startCode && charCode <= endCode;
  }

  private static validateStringCharInterval(
    value: unknown,
    config: StringCharIntervalConfig,
  ): boolean {
    if (!this.validateString(value)) return false;

    if (config.minLength !== undefined && value.length < config.minLength) {
      return false;
    }
    if (config.maxLength !== undefined && value.length > config.maxLength) {
      return false;
    }

    if (value.length === 0) {
      return config.minLength === undefined || config.minLength === 0;
    }

    for (const char of value) {
      if (!this.validateCharInterval(char, config.charInterval)) {
        return false;
      }
    }

    return true;
  }

  static getValidationError(value: unknown, column: ColumnDefinition): string {
    if (value === null || value === undefined) {
      if (!column.nullable) {
        return `Column '${column.name}' cannot be null`;
      }
      return '';
    }
    const printValue = JSON.stringify(value);
    switch (column.type) {
      case DataType.INTEGER:
        return `Value '${printValue}' in column '${column.name}' is not a valid integer`;

      case DataType.REAL:
        return `Value '${printValue}' in column '${column.name}' is not a valid real number`;

      case DataType.CHAR:
        return `Value '${printValue}' in column '${column.name}' is not a single character`;

      case DataType.STRING:
        return `Value '${printValue}' in column '${column.name}' is not a valid string`;

      case DataType.CHAR_INTERVAL: {
        if (!isCharIntervalConfig(column.typeConfig)) {
          return `Invalid configuration for column '${column.name}'`;
        }
        const config = column.typeConfig;
        return `Character '${printValue}' in column '${column.name}' is not in interval [${config.start}..${config.end}]`;
      }

      case DataType.STRING_CHAR_INTERVAL: {
        if (!isStringCharIntervalConfig(column.typeConfig)) {
          return `Invalid configuration for column '${column.name}'`;
        }
        const config = column.typeConfig;
        const lengthStr =
          config.minLength !== undefined || config.maxLength !== undefined
            ? `, length: ${config.minLength || 0}-${config.maxLength || '∞'}`
            : '';
        return `String '${printValue}' in column '${column.name}' does not match pattern (chars: [${config.charInterval.start}..${config.charInterval.end}]${lengthStr})`;
      }

      default:
        return `Unknown type for column '${column.name}': ${column.type as string}`;
    }
  }

  static isInteger(value: unknown): value is number {
    return this.validateInteger(value);
  }

  static isReal(value: unknown): value is number {
    return this.validateReal(value);
  }

  static isChar(value: unknown): value is string {
    return this.validateChar(value);
  }

  static isString(value: unknown): value is string {
    return this.validateString(value);
  }

  static isCharInterval(
    value: unknown,
    config: CharIntervalConfig,
  ): value is string {
    return this.validateCharInterval(value, config);
  }

  static isStringCharInterval(
    value: unknown,
    config: StringCharIntervalConfig,
  ): value is string {
    return this.validateStringCharInterval(value, config);
  }
}

export type InferRecordType<T extends ColumnDefinition[]> = {
  [K in T[number]['name']]: Extract<
    T[number],
    { name: K }
  > extends ColumnDefinition
    ? InferColumnType<Extract<T[number], { name: K }>>
    : never;
};

export type InferColumnType<T extends ColumnDefinition> =
  T['nullable'] extends true
    ? InferDataType<T['type']> | null
    : InferDataType<T['type']>;

export type InferDataType<T extends DataType> = T extends DataType.INTEGER
  ? number
  : T extends DataType.REAL
    ? number
    : T extends DataType.CHAR
      ? string
      : T extends DataType.STRING
        ? string
        : T extends DataType.CHAR_INTERVAL
          ? string
          : T extends DataType.STRING_CHAR_INTERVAL
            ? string
            : never;
