import {useState, type FormEvent} from "react";
import {
  type CreateColumnDto,
  type CreateTableDto,
  DataType,
} from "../../../api/types";
import type {UseMutateAsyncFunction} from "@tanstack/react-query";
import "../styles.css";

interface CreateTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: UseMutateAsyncFunction<unknown, Error, CreateTableDto, unknown>;
  isLoading: boolean;
}

interface ColumnForm {
  name: string;
  type: DataType;
  nullable: boolean;
  isPrimaryKey: boolean;
  autoIncrement: boolean;
  charStart: string;
  charEnd: string;
  stringCharStart: string;
  stringCharEnd: string;
  minLength: string;
  maxLength: string;
}

export const CreateTableModal = ({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: CreateTableModalProps) => {
  const [tableName, setTableName] = useState("");
  const [columns, setColumns] = useState<ColumnForm[]>([
    {
      name: "",
      type: DataType.STRING,
      nullable: false,
      isPrimaryKey: false,
      autoIncrement: false,
      charStart: "",
      charEnd: "",
      stringCharStart: "",
      stringCharEnd: "",
      minLength: "",
      maxLength: "",
    },
  ]);

  const addColumn = () => {
    setColumns([
      ...columns,
      {
        name: "",
        type: DataType.STRING,
        nullable: false,
        isPrimaryKey: false,
        autoIncrement: false,
        charStart: "",
        charEnd: "",
        stringCharStart: "",
        stringCharEnd: "",
        minLength: "",
        maxLength: "",
      },
    ]);
  };

  const removeColumn = (index: number) => {
    setColumns(columns.filter((_, i) => i !== index));
  };

  const updateColumn = (
    index: number,
    field: keyof ColumnForm,
    value: unknown,
  ) => {
    const updated = [...columns];
    updated[index] = {...updated[index], [field]: value};

    if (field === "type") {
      if (value !== DataType.INTEGER) {
        updated[index].autoIncrement = false;
      }
    }

    if (field === "isPrimaryKey" && !value) {
      updated[index].autoIncrement = false;
    }

    setColumns(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (columns.some((col) => !col.name.trim())) {
      alert("Всі колонки повинні мати назву");
      return;
    }

    const names = columns.map((c) => c.name.trim());
    if (new Set(names).size !== names.length) {
      alert("Назви колонок повинні бути унікальними");
      return;
    }

    const pkCount = columns.filter((c) => c.isPrimaryKey).length;
    if (pkCount > 1) {
      alert("Тільки одна колонка може бути Primary Key");
      return;
    }

    const invalidAutoIncrement = columns.some(
      (c) =>
        c.autoIncrement && (!c.isPrimaryKey || c.type !== DataType.INTEGER),
    );
    if (invalidAutoIncrement) {
      alert("Auto-increment можливий тільки для INTEGER Primary Key");
      return;
    }

    const columnsDto = columns.map((col) => {
      const dto: CreateColumnDto = {
        name: col.name.trim(),
        type: col.type,
        nullable: col.nullable,
        isPrimaryKey: col.isPrimaryKey ?? false,
        autoIncrement: col.autoIncrement ?? false,
      };

      if (col.type === DataType.CHAR_INTERVAL) {
        if (!col.charStart || !col.charEnd) {
          alert(
            `Колонка "${col.name}": вкажіть start та end для Char Interval`,
          );
          throw new Error("Invalid charInvl config");
        }
        dto.typeConfig = {
          start: col.charStart,
          end: col.charEnd,
        };
      }

      if (col.type === DataType.STRING_CHAR_INTERVAL) {
        if (!col.stringCharStart || !col.stringCharEnd) {
          alert(
            `Колонка "${col.name}": вкажіть інтервал символів для String Char Interval`,
          );
          throw new Error("Invalid stringCharInvl config");
        }
        dto.typeConfig = {
          charInterval: {
            start: col.stringCharStart,
            end: col.stringCharEnd,
          },
        };
        if (col.minLength) {
          dto.typeConfig.minLength = parseInt(col.minLength, 10);
        }
        if (col.maxLength) {
          dto.typeConfig.maxLength = parseInt(col.maxLength, 10);
        }
      }

      return dto;
    });

    try {
      await onCreate({name: tableName, columns: columnsDto});
      setTableName("");
      setColumns([
        {
          name: "",
          type: DataType.STRING,
          nullable: false,
          isPrimaryKey: false,
          autoIncrement: false,
          charStart: "",
          charEnd: "",
          stringCharStart: "",
          stringCharEnd: "",
          minLength: "",
          maxLength: "",
        },
      ]);
      onClose();
    } catch (error) {
      console.error("Error creating table:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Створити таблицю</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="table-name">Назва таблиці *</label>
              <input
                id="table-name"
                type="text"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                placeholder="Введіть назву таблиці"
                required
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div className="columns-section">
              <div className="columns-header">
                <h3>Колонки</h3>
                <button
                  type="button"
                  className="btn-add-column"
                  onClick={addColumn}
                  disabled={isLoading}
                >
                  + Додати колонку
                </button>
              </div>

              <div className="columns-list">
                {columns.map((column, index) => (
                  <div key={index} className="column-item">
                    <div className="column-main">
                      <input
                        type="text"
                        value={column.name}
                        onChange={(e) =>
                          updateColumn(index, "name", e.target.value)
                        }
                        placeholder="Назва колонки"
                        required
                        disabled={isLoading}
                      />

                      <select
                        value={column.type}
                        onChange={(e) =>
                          updateColumn(
                            index,
                            "type",
                            e.target.value as DataType,
                          )
                        }
                        disabled={isLoading}
                      >
                        <option value={DataType.INTEGER}>Integer</option>
                        <option value={DataType.REAL}>Real</option>
                        <option value={DataType.CHAR}>Char</option>
                        <option value={DataType.STRING}>String</option>
                        <option value={DataType.CHAR_INTERVAL}>
                          Char Interval
                        </option>
                        <option value={DataType.STRING_CHAR_INTERVAL}>
                          String Char Interval
                        </option>
                      </select>
                    </div>

                    <div className="column-options">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={column.nullable}
                          onChange={(e) =>
                            updateColumn(index, "nullable", e.target.checked)
                          }
                          disabled={isLoading}
                        />
                        <span>Nullable</span>
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={column.isPrimaryKey}
                          onChange={(e) =>
                            updateColumn(
                              index,
                              "isPrimaryKey",
                              e.target.checked,
                            )
                          }
                          disabled={isLoading}
                        />
                        <span>Primary Key</span>
                      </label>

                      {column.type === DataType.INTEGER &&
                        column.isPrimaryKey && (
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={column.autoIncrement}
                              onChange={(e) =>
                                updateColumn(
                                  index,
                                  "autoIncrement",
                                  e.target.checked,
                                )
                              }
                              disabled={isLoading}
                            />
                            <span>Auto Increment</span>
                          </label>
                        )}
                    </div>

                    {column.type === DataType.CHAR_INTERVAL && (
                      <div className="type-config">
                        <div className="config-title">Інтервал символів:</div>
                        <div className="config-row">
                          <input
                            type="text"
                            maxLength={1}
                            value={column.charStart}
                            onChange={(e) =>
                              updateColumn(index, "charStart", e.target.value)
                            }
                            placeholder="Start (напр. 'a')"
                            disabled={isLoading}
                            required
                          />
                          <span>→</span>
                          <input
                            type="text"
                            maxLength={1}
                            value={column.charEnd}
                            onChange={(e) =>
                              updateColumn(index, "charEnd", e.target.value)
                            }
                            placeholder="End (напр. 'z')"
                            disabled={isLoading}
                            required
                          />
                        </div>
                      </div>
                    )}

                    {column.type === DataType.STRING_CHAR_INTERVAL && (
                      <div className="type-config">
                        <div className="config-title">
                          Інтервал символів для рядка:
                        </div>
                        <div className="config-row">
                          <input
                            type="text"
                            maxLength={1}
                            value={column.stringCharStart}
                            onChange={(e) =>
                              updateColumn(
                                index,
                                "stringCharStart",
                                e.target.value,
                              )
                            }
                            placeholder="Start"
                            disabled={isLoading}
                            required
                          />
                          <span>→</span>
                          <input
                            type="text"
                            maxLength={1}
                            value={column.stringCharEnd}
                            onChange={(e) =>
                              updateColumn(
                                index,
                                "stringCharEnd",
                                e.target.value,
                              )
                            }
                            placeholder="End"
                            disabled={isLoading}
                            required
                          />
                        </div>
                        <div className="config-row">
                          <input
                            type="number"
                            min="0"
                            value={column.minLength}
                            onChange={(e) =>
                              updateColumn(index, "minLength", e.target.value)
                            }
                            placeholder="Min довжина (опційно)"
                            disabled={isLoading}
                          />
                          <input
                            type="number"
                            min="0"
                            value={column.maxLength}
                            onChange={(e) =>
                              updateColumn(index, "maxLength", e.target.value)
                            }
                            placeholder="Max довжина (опційно)"
                            disabled={isLoading}
                          />
                        </div>
                      </div>
                    )}

                    {columns.length > 1 && (
                      <button
                        type="button"
                        className="btn-remove-column"
                        onClick={() => removeColumn(index)}
                        disabled={isLoading}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
              disabled={isLoading || !tableName.trim() || columns.length === 0}
            >
              {isLoading ? "Створення..." : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
