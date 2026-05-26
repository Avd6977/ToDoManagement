import { FormEvent, useState } from "react";
import type { Task } from "../types/Task";

interface TaskFormProps {
  onSubmit: (task: Partial<Task>) => Promise<void>;
  initialValue?: Partial<Task>;
  submitLabel: string;
  onCancel?: () => void;
  minDueDate?: string;
  enforceNoPastDueDateChanges?: boolean;
}

const toDateInputValue = (isoDate: string | null | undefined): string => {
  if (!isoDate) {
    return "";
  }

  return new Date(isoDate).toISOString().slice(0, 10);
};

const toLocalDateInputValue = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const TaskForm = ({
  onSubmit,
  initialValue,
  submitLabel,
  onCancel,
  minDueDate,
  enforceNoPastDueDateChanges = false,
}: TaskFormProps): JSX.Element => {
  const [title, setTitle] = useState(initialValue?.title ?? "");
  const [description, setDescription] = useState(initialValue?.description ?? "");
  const [dueDate, setDueDate] = useState(toDateInputValue(initialValue?.dueDate));
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    title: false,
    description: false,
    dueDate: false,
  });

  const todayDateValue = toLocalDateInputValue(new Date());
  const initialDueDateValue = toDateInputValue(initialValue?.dueDate);
  const titleError = touched.title && !title.trim() ? "Title is required." : "";
  const descriptionError = touched.description && !description.trim() ? "Description is required." : "";

  const dueDateError = touched.dueDate
    ? dueDate && Number.isNaN(new Date(dueDate).getTime())
      ? "Due date is invalid."
      : minDueDate && dueDate && dueDate < minDueDate
        ? "Due date cannot be in the past."
        : enforceNoPastDueDateChanges
            && dueDate !== initialDueDateValue
            && dueDate
            && dueDate < todayDateValue
          ? "Due date cannot be changed to a past date."
          : ""
    : "";

  const hasInvalidDueDate = !!(
    (dueDate && Number.isNaN(new Date(dueDate).getTime()))
    || (minDueDate && dueDate && dueDate < minDueDate)
    || (
      enforceNoPastDueDateChanges
      && dueDate !== initialDueDateValue
      && dueDate
      && dueDate < todayDateValue
    )
  );

  const isFormValid = !!title.trim() && !!description.trim() && !hasInvalidDueDate;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitError("");

    if (!isFormValid) {
      setTouched({ title: true, description: true, dueDate: true });
      return;
    }

    try {
      setLoading(true);
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        dueDate: dueDate ? new Date(`${dueDate}T00:00:00`).toISOString() : null,
      });
      setTitle("");
      setDescription("");
      setDueDate("");
      setTouched({ title: false, description: false, dueDate: false });
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Task request failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card task-form">
      <h3>{submitLabel}</h3>
      <label>
        Title
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, title: true }))}
          required
        />
      </label>
      {titleError && <p className="error">{titleError}</p>}
      <label>
        Description
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, description: true }))}
          required
        />
      </label>
      {descriptionError && <p className="error">{descriptionError}</p>}
      <label>
        Due Date
        <input
          type="date"
          value={dueDate}
          min={minDueDate}
          onChange={(e) => {
            setDueDate(e.target.value);
            setSubmitError("");
          }}
          onBlur={() => setTouched((previous) => ({ ...previous, dueDate: true }))}
        />
      </label>
      {dueDateError && <p className="error">{dueDateError}</p>}
      {submitError && <p className="error">{submitError}</p>}
      <div className="actions">
        <button
          type="submit"
          disabled={loading || !isFormValid}
        >
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
