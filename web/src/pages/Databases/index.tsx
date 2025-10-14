import {useState} from "react";
import {Link} from "react-router-dom";
import {
  useDatabases,
  useCreateDatabase,
  useDeleteDatabase,
} from "../../hooks/queries/useDatabases";
import {CreateDatabaseModal} from "../../components/modals/CreateDatabaseModal";
import {getErrorMessage} from "../../utils/error";
import "./styles.css";

const DatabasesPage = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const {data: databases, isLoading, error} = useDatabases();
  const createMutation = useCreateDatabase();
  const deleteMutation = useDeleteDatabase();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Ви впевнені, що хочете видалити базу даних "${name}"?`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: unknown) {
      alert(`Помилка видалення: ${getErrorMessage(err)}`);
    }
  };

  if (isLoading) {
    return <div className="page-loading">Завантаження баз даних...</div>;
  }

  if (error) {
    return <div className="page-error">Помилка: {error.message}</div>;
  }

  return (
    <div className="databases-page">
      <div className="page-header">
        <h1>Мої бази даних</h1>
        <button
          className="btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + Створити БД
        </button>
      </div>

      {!databases || databases.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h3>У вас ще немає баз даних</h3>
          <p>Створіть першу базу даних для початку роботи</p>
          <button
            className="btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Створити базу даних
          </button>
        </div>
      ) : (
        <div className="databases-grid">
          {databases.map((db) => (
            <div key={db.id} className="database-card">
              <div className="database-card-header">
                <h3>{db.name}</h3>
                <span className="database-role">{db.userRole || "OWNER"}</span>
              </div>

              {db.description && (
                <p className="database-description">{db.description}</p>
              )}

              <div className="database-meta">
                <span>
                  Редаговано {new Date(db.createdAt).toLocaleString("uk-UA")}
                </span>
              </div>

              <div className="database-actions">
                <Link to={`/databases/${db.id}`} className="btn-view">
                  Відкрити
                </Link>

                {(db.userRole === "owner" || !db.userRole) && (
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(db.id, db.name)}
                    disabled={deleteMutation.isPending}
                  >
                    Видалити
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateDatabaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={createMutation.mutateAsync}
        isLoading={createMutation.isPending}
      />
    </div>
  );
};

export default DatabasesPage;
