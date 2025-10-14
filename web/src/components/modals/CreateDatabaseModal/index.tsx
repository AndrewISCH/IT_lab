import type {UseMutateAsyncFunction} from "@tanstack/react-query";
import {useState, type FormEvent} from "react";
import type {CreateDatabaseDto, Database} from "../../../api/types";
import "../styles.css";
import {useErrorMessageTrigger} from "../../../store/useErrorMessage";
import {getErrorMessage} from "../../../utils/error";

interface CreateDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: UseMutateAsyncFunction<Database, Error, CreateDatabaseDto, unknown>;
  isLoading: boolean;
}

export const CreateDatabaseModal = ({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: CreateDatabaseModalProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const errorTrigger = useErrorMessageTrigger();
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    try {
      await onCreate({name, description: description || undefined});
      setName("");
      setDescription("");
      onClose();
    } catch (error) {
      errorTrigger(`Помилка ствоерння бази даних ${getErrorMessage(error)}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Створити базу даних</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label htmlFor="db-name">Назва *</label>
              <input
                id="db-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Введіть назву бази даних"
                required
                disabled={isLoading}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label htmlFor="db-description">Опис</label>
              <textarea
                id="db-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Опис бази даних (необов'язково)"
                disabled={isLoading}
                maxLength={500}
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                }}
              />
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
              disabled={isLoading || !name.trim()}
            >
              {isLoading ? "Створення..." : "Створити"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
