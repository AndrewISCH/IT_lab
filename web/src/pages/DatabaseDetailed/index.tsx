import {useState} from "react";
import {useParams, Link} from "react-router-dom";
import {useDatabase} from "../../hooks/queries/useDatabases";
import {
  useTables,
  useCreateTable,
  useDeleteTable,
} from "../../hooks/queries/useTables";
import {CreateTableModal} from "../../components/modals/CreateTableModal";
import {getErrorMessage} from "../../utils/error";
import "./styles.css";

const DatabaseDetailPage = () => {
  const {databaseId} = useParams<{databaseId: string}>();
  const [isCreateTableModalOpen, setIsCreateTableModalOpen] = useState(false);

  const {
    data: database,
    isLoading: isLoadingDb,
    error: dbError,
  } = useDatabase(databaseId!);
  const {
    data: tables,
    isLoading: isLoadingTables,
    error: tablesError,
  } = useTables(databaseId!);
  const createTableMutation = useCreateTable();
  const deleteTableMutation = useDeleteTable();

  const handleDeleteTable = async (tableName: string) => {
    if (!confirm(`Ви впевнені, що хочете видалити таблицю "${tableName}"?`)) {
      return;
    }

    try {
      await deleteTableMutation.mutateAsync({dbId: databaseId!, tableName});
    } catch (err: unknown) {
      alert(`Помилка видалення: ${getErrorMessage(err)}`);
    }
  };

  if (isLoadingDb || isLoadingTables) {
    return <div className="page-loading">Завантаження...</div>;
  }

  if (dbError || tablesError) {
    return (
      <div className="page-error">
        Помилка: {dbError?.message || tablesError?.message}
      </div>
    );
  }

  const canEdit =
    !database?.userRole ||
    database.userRole === "owner" ||
    database.userRole === "editor";

  return (
    <div className="database-detail-page">
      <div className="breadcrumb">
        <Link to="/databases">Бази даних</Link>
        <span> / </span>
        <span>{database?.name}</span>
      </div>

      <div className="db-info-card">
        <div className="db-info-content">
          <div>
            <h1>{database?.name}</h1>
            {database?.description && (
              <p className="db-description">{database.description}</p>
            )}
            <div className="db-meta">
              <span className="meta-item">
                📅 Створено:{" "}
                {new Date(database?.createdAt || "").toLocaleDateString(
                  "uk-UA",
                )}
              </span>
              <span className="meta-item">
                Роль:{" "}
                <span className="role-badge">
                  {database?.userRole || "owner"}
                </span>
              </span>
            </div>
          </div>
          {canEdit && (
            <button
              className="btn-primary"
              onClick={() => setIsCreateTableModalOpen(true)}
            >
              + Створити таблицю
            </button>
          )}
        </div>
      </div>

      <div className="tables-section">
        <div className="section-header">
          <h2>Таблиці</h2>
          <span className="tables-count">{tables?.length || 0}</span>
        </div>

        {!tables || tables.length === 0 ? (
          <div className="empty-state">
            <h3>У цій базі даних ще немає таблиць</h3>
            <p>Створіть першу таблицю для збереження даних</p>
            {canEdit && (
              <button
                className="btn-primary"
                onClick={() => setIsCreateTableModalOpen(true)}
              >
                Створити таблицю
              </button>
            )}
          </div>
        ) : (
          <div className="tables-grid">
            {tables.map((table) => (
              <div key={table.name} className="table-card">
                <div className="table-card-header">
                  <h3>
                    <Link to={`/databases/${databaseId}/tables/${table.name}`}>
                      {table.name}
                    </Link>
                  </h3>
                </div>

                <div className="table-stats">
                  <div className="stat">
                    <div>
                      <span className="stat-value">{table.columnCount}</span>
                      <span className="stat-label">колонок</span>
                    </div>
                  </div>
                  <div className="stat">
                    <div>
                      <span className="stat-value">{table.recordCount}</span>
                      <span className="stat-label">записів</span>
                    </div>
                  </div>
                </div>

                <div className="table-meta">
                  <span>
                    📅 {new Date(table.createdAt).toLocaleDateString("uk-UA")}
                  </span>
                </div>

                <div className="table-actions">
                  <Link
                    to={`/databases/${databaseId}/tables/${table.name}`}
                    className="btn-view"
                  >
                    Відкрити
                  </Link>

                  {canEdit && (
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteTable(table.name)}
                      disabled={deleteTableMutation.isPending}
                    >
                      Видалити
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {canEdit && (
        <CreateTableModal
          isOpen={isCreateTableModalOpen}
          onClose={() => setIsCreateTableModalOpen(false)}
          onCreate={(data) =>
            createTableMutation.mutateAsync({dbId: databaseId!, data})
          }
          isLoading={createTableMutation.isPending}
        />
      )}
    </div>
  );
};

export default DatabaseDetailPage;
