import {useState, type FormEvent, useEffect} from "react";
import {
  type UpdateRecordDto,
  type ColumnDefinition,
  DataType,
  type TableRecord,
} from "../../../api/types";
import "../styles.css";
import type {UseMutateAsyncFunction} from "@tanstack/react-query";
import {useErrorMessageTrigger} from "../../../store/useErrorMessage";
import {getErrorMessage} from "../../../utils/error";

interface EditRecordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: UseMutateAsyncFunction<unknown, Error, UpdateRecordDto, unknown>;
  record: TableRecord;
  columns: ColumnDefinition[];
  isLoading: boolean;
}

export const EditRecordModal = ({
  isOpen,
  onClose,
  onUpdate,
  record,
  columns,
  isLoading,
}: EditRecordModalProps) => {
  const [formData, setFormData] = useState<Record<string, string>>(
    record.data as Record<string, string>,
  );

  useEffect(() => {
    setFormData(record.data as Record<string, string>);
  }, [record]);

  const errorTrigger = useErrorMessageTrigger();
  const editableColumns = columns.filter(
    (col) => !(col.isPrimaryKey && col.autoIncrement),
  );

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
      await onUpdate({data: convertedData});
      onClose();
    } catch (error) {
      errorTrigger(`Помилка оновлення запису ${getErrorMessage(error)}`);
    }
  };

  const renderInput = (col: ColumnDefinition) => {
    const value = formData[col.name] ?? "";

    switch (col.type) {
      case DataType.INTEGER:
        return (
          <input
            type="number"
            step="1"
            value={value}
            onChange={(e) =>
              setFormData({...formData, [col.name]: e.target.value})
            }
            placeholder={col.nullable ? "Необов'язково" : "Введіть число"}
            required={!col.nullable}
            disabled={isLoading}
          />
        );

      case DataType.REAL:
        return (
          <input
            type="number"
            step="any"
            value={value}
            onChange={(e) =>
              setFormData({...formData, [col.name]: e.target.value})
            }
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
            onChange={(e) =>
              setFormData({...formData, [col.name]: e.target.value})
            }
            placeholder={col.nullable ? "Необов'язково" : "Один символ"}
            required={!col.nullable}
            disabled={isLoading}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) =>
              setFormData({...formData, [col.name]: e.target.value})
            }
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
          <h2>Редагувати запис #{record.id}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {editableColumns.length === 0 ? (
              <div className="info-message">
                Всі поля генеруються автоматично і не можуть бути змінені
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
              {isLoading ? "Збереження..." : "Зберегти"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
