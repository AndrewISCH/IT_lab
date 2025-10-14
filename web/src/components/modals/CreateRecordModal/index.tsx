/* eslint-disable no-case-declarations */
import {useState, type FormEvent} from "react";
import {
  type CreateRecordDto,
  type ColumnDefinition,
  DataType,
  type StringCharIntervalConfig,
  type CharIntervalConfig,
} from "../../../api/types";
import "../styles.css";
import type {UseMutateAsyncFunction} from "@tanstack/react-query";
import {useErrorMessageTrigger} from "../../../store/useErrorMessage";
import {getErrorMessage} from "../../../utils/error";

interface CreateRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: UseMutateAsyncFunction<unknown, Error, CreateRecordDto, unknown>;
  columns: ColumnDefinition[];
  isLoading: boolean;
}

export const CreateRecordModal = ({
  isOpen,
  onClose,
  onCreate,
  columns,
  isLoading,
}: CreateRecordModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const errorTrigger = useErrorMessageTrigger();
  const editableColumns = columns.filter(
    (col) => !(col.isPrimaryKey && col.autoIncrement),
  );

  const createOnChangeHandler = (col: ColumnDefinition) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;

      switch (col.type) {
        case DataType.CHAR:
          if (value.length > 1) {
            e.preventDefault();
            return;
          }
          break;

        case DataType.CHAR_INTERVAL:
          if (value.length > 1) {
            e.preventDefault();
            return;
          }
          if (value.length === 1 && col.typeConfig) {
            const config = col.typeConfig as {start: string; end: string};
            const charCode = value.charCodeAt(0);
            const startCode = config.start.charCodeAt(0);
            const endCode = config.end.charCodeAt(0);

            if (charCode < startCode || charCode > endCode) {
              errorTrigger(
                `Символ "${value}" не входить в інтервал ${config.start}-${config.end}`,
              );
              e.preventDefault();
              return;
            }
          }
          break;

        case DataType.STRING_CHAR_INTERVAL:
          if (col.typeConfig) {
            const config = col.typeConfig as {
              charInterval: {start: string; end: string};
              minLength?: number;
              maxLength?: number;
            };

            for (let i = 0; i < value.length; i++) {
              const char = value[i];
              const charCode = char.charCodeAt(0);
              const startCode = config.charInterval.start.charCodeAt(0);
              const endCode = config.charInterval.end.charCodeAt(0);

              if (charCode < startCode || charCode > endCode) {
                errorTrigger(
                  `Символ "${char}" не входить в інтервал ${config.charInterval.start}-${config.charInterval.end}`,
                );
                e.preventDefault();
                return;
              }
            }

            if (config.maxLength && value.length > config.maxLength) {
              errorTrigger(`Максимальна довжина: ${config.maxLength} символів`);
              e.preventDefault();
              return;
            }
          }
          break;

        case DataType.INTEGER:
          if (value && !/^-?\d*$/.test(value)) {
            e.preventDefault();
            return;
          }
          break;

        case DataType.REAL:
          if (value && !/^-?\d*\.?\d*$/.test(value)) {
            e.preventDefault();
            return;
          }
          break;
      }

      setFormData({...formData, [col.name]: value});
    };
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const convertedData: Record<string, unknown> = {};

    for (const col of editableColumns) {
      const value = formData[col.name];

      if (value === "" || value === null || value === undefined) {
        if (!col.nullable) {
          errorTrigger(`Поле "${col.name}" є обов'язковим`);
          return;
        }
        convertedData[col.name] = null;
        continue;
      }

      if (col.type === DataType.STRING_CHAR_INTERVAL && col.typeConfig) {
        const config = col.typeConfig as {
          charInterval: {start: string; end: string};
          minLength?: number;
          maxLength?: number;
        };
        if (config.minLength && value.length < config.minLength) {
          errorTrigger(
            `Поле "${col.name}": мінімальна довжина ${config.minLength} символів`,
          );
          return;
        }
      }

      switch (col.type) {
        case DataType.INTEGER:
          convertedData[col.name] = parseInt(value, 10);
          break;
        case DataType.REAL:
          convertedData[col.name] = parseFloat(value);
          break;
        default:
          convertedData[col.name] = value;
      }
    }

    try {
      await onCreate({data: [convertedData]});
      setFormData({});
      onClose();
    } catch (error) {
      errorTrigger(`Помилка створення запису: ${getErrorMessage(error)}`);
    }
  };

  const renderInput = (col: ColumnDefinition) => {
    const value = formData[col.name] ?? "";

    switch (col.type) {
      case DataType.INTEGER:
        return (
          <input
            type="text"
            value={value}
            onChange={createOnChangeHandler(col)}
            placeholder={col.nullable ? "Необов'язково" : "Введіть число"}
            required={!col.nullable}
            disabled={isLoading}
          />
        );

      case DataType.REAL:
        return (
          <input
            type="text"
            value={value}
            onChange={createOnChangeHandler(col)}
            placeholder={col.nullable ? "Необов'язково" : "Введіть число"}
            required={!col.nullable}
            disabled={isLoading}
          />
        );

      case DataType.CHAR:
        return (
          <input
            type="text"
            maxLength={1}
            value={value}
            onChange={createOnChangeHandler(col)}
            placeholder={col.nullable ? "Необов'язково" : "Один символ"}
            required={!col.nullable}
            disabled={isLoading}
          />
        );

      case DataType.CHAR_INTERVAL:
        return (
          <input
            type="text"
            maxLength={1}
            value={value}
            onChange={createOnChangeHandler(col)}
            placeholder={
              col.typeConfig
                ? `${(col.typeConfig as CharIntervalConfig).start}-${
                    (col.typeConfig as CharIntervalConfig).end
                  }`
                : col.nullable
                ? "Необов'язково"
                : ""
            }
            required={!col.nullable}
            disabled={isLoading}
          />
        );

      case DataType.STRING_CHAR_INTERVAL:
        const config = col.typeConfig as StringCharIntervalConfig;
        const hint = config
          ? `${config.charInterval.start}-${config.charInterval.end}${
              config.minLength || config.maxLength
                ? ` (${config.minLength || 0}-${config.maxLength || "∞"})`
                : ""
            }`
          : "";
        return (
          <input
            type="text"
            value={value}
            onChange={createOnChangeHandler(col)}
            placeholder={
              hint || (col.nullable ? "Необов'язково" : "Введіть текст")
            }
            required={!col.nullable}
            disabled={isLoading}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={createOnChangeHandler(col)}
            placeholder={col.nullable ? "Необов'язково" : "Введіть текст"}
            required={!col.nullable}
            disabled={isLoading}
          />
        );
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Додати запис</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {editableColumns.length === 0 ? (
              <div className="info-message">
                Всі поля генеруються автоматично
              </div>
            ) : (
              editableColumns.map((col) => (
                <div key={col.name} className="form-group">
                  <label htmlFor={`field-${col.name}`}>
                    {col.name}
                    {col.isPrimaryKey && <span className="pk-badge">PK</span>}
                    <span className="field-type"> ({col.type})</span>
                    {!col.nullable && <span className="required">*</span>}
                  </label>
                  {renderInput(col)}
                </div>
              ))
            )}
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Скасувати
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || editableColumns.length === 0}
            >
              {isLoading ? "Додавання..." : "Додати"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
