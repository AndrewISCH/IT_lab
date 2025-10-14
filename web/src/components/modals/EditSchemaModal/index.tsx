import {useEffect, useState, type FormEvent} from "react";
import type {UpdateSchemaDto, TableSchema} from "../../../api/types";
import type {UseMutateAsyncFunction} from "@tanstack/react-query";
import "../styles.css";
import {useErrorMessageTrigger} from "../../../store/useErrorMessage";

interface EditSchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: UseMutateAsyncFunction<unknown, Error, UpdateSchemaDto, unknown>;
  schema: TableSchema;
  isLoading: boolean;
}

export const EditSchemaModal = ({
  isOpen,
  onClose,
  onUpdate,
  schema,
  isLoading,
}: EditSchemaModalProps) => {
  const [columns, setColumns] = useState<
    Array<{oldName: string; newName: string; position: number}>
  >(
    schema.columns
      .sort((a, b) => a.position - b.position)
      .map((col) => ({
        oldName: col.name,
        newName: col.name,
        position: col.position,
      })),
  );
  const errorMessageTrigger = useErrorMessageTrigger();
  const handleNameChange = (index: number, newName: string) => {
    const updated = [...columns];
    updated[index].newName = newName;
    setColumns(updated);
  };

  useEffect(() => {
    setColumns(
      schema.columns
        .sort((a, b) => a.position - b.position)
        .map((col) => ({
          oldName: col.name,
          newName: col.name,
          position: col.position,
        })),
    );
  }, [schema]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...columns];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setColumns(updated);
  };

  const moveDown = (index: number) => {
    if (index === columns.length - 1) return;
    const updated = [...columns];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setColumns(updated);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (columns.some((col) => !col.newName.trim())) {
      errorMessageTrigger("Всі колонки повинні мати назву");
      return;
    }

    const names = columns.map((c) => c.newName.trim());
    if (new Set(names).size !== names.length) {
      errorMessageTrigger("Назви колонок повинні бути унікальними");
      return;
    }

    const updateData: UpdateSchemaDto = {
      columns: columns.map((col, index) => ({
        oldName: col.oldName,
        newName: col.newName !== col.oldName ? col.newName : undefined,
        position: index,
      })),
    };

    try {
      await onUpdate(updateData);
      onClose();
    } catch (error) {
      console.error("Error updating schema:", error);
      errorMessageTrigger("Помилка оновлення схеми таблиці");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Редагувати структуру таблиці</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="schema-info">
              <p>Ви можете перейменувати колонки та змінити їх порядок</p>
            </div>

            <div className="schema-columns">
              {columns.map((col, index) => {
                const originalColumn = schema.columns.find(
                  (c) => c.name === col.oldName,
                );
                const isAutoIncrement =
                  originalColumn?.isPrimaryKey && originalColumn?.autoIncrement;

                return (
                  <div key={col.oldName} className="schema-column-item">
                    <div className="schema-column-order">
                      <button
                        type="button"
                        className="btn-move"
                        onClick={() => moveUp(index)}
                        disabled={index === 0 || isLoading}
                        title="Вгору"
                      >
                        ▲
                      </button>
                      <span className="position-number">{index + 1}</span>
                      <button
                        type="button"
                        className="btn-move"
                        onClick={() => moveDown(index)}
                        disabled={index === columns.length - 1 || isLoading}
                        title="Вниз"
                      >
                        ▼
                      </button>
                    </div>

                    <div className="schema-column-content">
                      <div className="schema-column-info">
                        {!!originalColumn?.isPrimaryKey && (
                          <span className="pk-badge">PK</span>
                        )}
                        <span className="column-type-badge">
                          {originalColumn?.type}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={col.newName}
                        onChange={(e) =>
                          handleNameChange(index, e.target.value)
                        }
                        placeholder="Назва колонки"
                        disabled={isLoading}
                        required
                      />
                      {col.oldName !== col.newName && (
                        <span className="rename-hint">
                          було: <strong>{col.oldName}</strong>
                        </span>
                      )}
                      {!!isAutoIncrement && (
                        <span className="auto-hint">
                          Auto-increment колонка
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
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
            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? "Збереження..." : "Зберегти зміни"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
