import {useState} from "react";
import {Link, useParams} from "react-router-dom";
import type {TableRecord} from "../../api/types";
import {CreateRecordModal} from "../../components/modals/CreateRecordModal";
import {EditRecordModal} from "../../components/modals/EditRecordModal";
import {EditSchemaModal} from "../../components/modals/EditSchemaModal";
import {useDatabase} from "../../hooks/queries/useDatabases";
import {
  useCreateRecord,
  useDeleteRecord,
  useRecords,
  useUpdateRecord,
} from "../../hooks/queries/useRecords";
import {useTableSchema, useUpdateSchema} from "../../hooks/queries/useTables";
import {getErrorMessage} from "../../utils/error";
import "./styles.css";

const TablePage = () => {
  const {databaseId, tableName} = useParams<{
    databaseId: string;
    tableName: string;
  }>();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditSchemaModalOpen, setIsEditSchemaModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<TableRecord | null>(null);

  const {data: schema, isLoading: isLoadingSchema} = useTableSchema(
    databaseId!,
    tableName!,
  );
  const {data: dbData} = useDatabase(databaseId!);
  const dBName = dbData?.name || "";
  const {data, isLoading: isLoadingRecords} = useRecords(
    databaseId!,
    tableName!,
  );
  const records = data?.records || [];
  const createMutation = useCreateRecord();
  const updateMutation = useUpdateRecord();
  const deleteMutation = useDeleteRecord();
  const updateSchemaMutation = useUpdateSchema();

  const handleDelete = async (recordId: string) => {
    if (!confirm("Ви впевнені, що хочете видалити цей запис?")) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({
        dbId: databaseId!,
        tableName: tableName!,
        id: recordId,
      });
    } catch (err: unknown) {
      alert(`Помилка видалення: ${getErrorMessage(err)}`);
    }
  };

  if (isLoadingSchema || isLoadingRecords) {
    return <div className="page-loading">Завантаження...</div>;
  }

  if (!schema) {
    return <div className="page-error">Таблицю не знайдено</div>;
  }

  return (
    <div className="table-page">
      <div className="breadcrumb">
        <Link to="/databases">Бази даних</Link>
        <span> / </span>
        <Link to={`/databases/${databaseId}`}>{dBName}</Link>
        <span> / </span>
        <span>{tableName}</span>
      </div>

      <div className="page-header">
        <div>
          <h1>{tableName}</h1>
          <p className="table-info">
            Колонок: {schema.columns.length} | Записів: {records?.length || 0}
          </p>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => setIsEditSchemaModalOpen(true)}
          >
            ⚙️ Редагувати структуру
          </button>
          <button
            className="btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            + Додати запис
          </button>
        </div>
      </div>

      {!records || records.length === 0 ? (
        <div className="empty-state">
          <h3>У цій таблиці ще немає записів</h3>
          <p>Додайте перший запис для початку роботи</p>
          <button
            className="btn-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            Додати запис
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                {schema.columns.map((col) => (
                  <th key={col.name}>
                    <div className="column-header">
                      <span className="column-name">
                        {col.name}
                        {!!col.isPrimaryKey && (
                          <span className="pk-badge-small">PK</span>
                        )}
                      </span>
                      <span className="column-type">{col.type}</span>
                    </div>
                  </th>
                ))}
                <th>Дії</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id}>
                  {schema.columns.map((col) => (
                    <td key={col.name}>
                      {record.data[col.name] !== null &&
                      record.data[col.name] !== undefined
                        ? String(record.data[col.name])
                        : "—"}
                    </td>
                  ))}
                  <td className="actions-cell">
                    <button
                      className="btn-edit"
                      onClick={() => setEditingRecord(record)}
                    >
                      ✏️
                    </button>
                    <button
                      className="btn-delete-small"
                      onClick={() => handleDelete(record.id)}
                      disabled={deleteMutation.isPending}
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CreateRecordModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(data) =>
          createMutation.mutateAsync({
            dbId: databaseId!,
            tableName: tableName!,
            data,
          })
        }
        columns={schema.columns}
        isLoading={createMutation.isPending}
      />

      {editingRecord && (
        <EditRecordModal
          isOpen={true}
          onClose={() => setEditingRecord(null)}
          onUpdate={(data) =>
            updateMutation.mutateAsync({
              dbId: databaseId!,
              tableName: tableName!,
              id: editingRecord.id,
              data,
            })
          }
          record={editingRecord}
          columns={schema.columns}
          isLoading={updateMutation.isPending}
        />
      )}

      <EditSchemaModal
        isOpen={isEditSchemaModalOpen}
        onClose={() => setIsEditSchemaModalOpen(false)}
        onUpdate={(data) =>
          updateSchemaMutation.mutateAsync({
            dbId: databaseId!,
            tableName: tableName!,
            data,
          })
        }
        schema={schema}
        isLoading={updateSchemaMutation.isPending}
      />
    </div>
  );
};

export default TablePage;
