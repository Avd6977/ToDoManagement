import { FormEvent, useEffect, useState } from "react";
import { searchUsers } from "../services/api";
import type { Task } from "../types/Task";
import type { UserOption } from "../types/User";

interface TaskFormProps {
  onSubmit: (task: Partial<Task>) => Promise<void>;
  initialValue?: Partial<Task>;
  submitLabel: string;
  onCancel?: () => void;
}

const toDateInputValue = (isoDate: string | null | undefined): string => {
  if (!isoDate) {
    return "";
  }

  return new Date(isoDate).toISOString().slice(0, 10);
};

export const TaskForm = ({
  onSubmit,
  initialValue,
  submitLabel,
  onCancel,
}: TaskFormProps): JSX.Element => {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(initialValue?.dueDate));
  const [assignedToId, setAssignedToId] = useState(initialValue?.assignedToId ?? "");
  const [assigneeQuery, setAssigneeQuery] = useState("");
  const [assigneeOptions, setAssigneeOptions] = useState<UserOption[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const runSearch = async () => {
      const query = assigneeQuery.trim();
      if (!query) {
        setAssigneeOptions([]);
        return;
      }

      try {
        const results = await searchUsers(query);
        if (!cancelled) {
          setAssigneeOptions(results);
        }
      } catch {
        if (!cancelled) {
          setAssigneeOptions([]);
        }
      }
    };

    const timeoutId = window.setTimeout(() => {
      void runSearch();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [assigneeQuery]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!description.trim()) {
      setError("Description is required.");
      return;
    }

    if (dueDate && Number.isNaN(new Date(dueDate).getTime())) {
      setError("Due date is invalid.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
        assignedToId: assignedToId.trim() || null,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setAssignedToId("");
      setAssigneeQuery("");
      setAssigneeOptions([]);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? "Task request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card task-form">
      <h3>{submitLabel}</h3>
      <label>
        Title
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>
      <label>
        Description
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
      </label>
      <label>
        Due Date
        <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
      </label>
      <label>
        Assigned User (optional)
        <input
          placeholder="Search by full name"
          value={assigneeQuery}
          onChange={(e) => setAssigneeQuery(e.target.value)}
        />
      </label>
      {!!assigneeOptions.length && (
        <ul className="assignee-results">
          {assigneeOptions.map((option) => (
            <li key={option.id}>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setAssignedToId(option.id);
                  setAssigneeQuery(option.fullName);
                  setAssigneeOptions([]);
                }}
              >
                {option.fullName} ({option.id})
              </button>
            </li>
          ))}
        </ul>
      )}
      {assignedToId && <p className="hint">Selected key: {assignedToId}</p>}
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};
