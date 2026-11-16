import { useState } from 'react';
import Button from '../ui/Button';
import { Input, Select, Textarea } from '../ui/FormFields';
import { PRIORITY_OPTIONS, STATUS_OPTIONS } from '../../utils/constants';
import { toDateInputValue } from '../../utils/format';
import { validateTask } from '../../utils/validators';

export default function TaskForm({ initial, onSubmit, onCancel, submitting, serverErrors = {}, formError = '' }) {
  const [values, setValues] = useState({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    status: initial?.status ?? 'pending',
    priority: initial?.priority ?? 'medium',
    dueDate: toDateInputValue(initial?.dueDate),
  });
  const [errors, setErrors] = useState({});

  const setField = (name) => (event) => {
    setValues((current) => ({ ...current, [name]: event.target.value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const fieldError = (name) => errors[name] || serverErrors[name];

  const handleSubmit = (event) => {
    event.preventDefault();
    const found = validateTask(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      title: values.title.trim(),
      description: values.description.trim(),
      status: values.status,
      priority: values.priority,
      dueDate: values.dueDate || null,
    });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4">
      {formError && !Object.keys(serverErrors).length && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
          {formError}
        </p>
      )}

      <Input
        id="task-title"
        label="Title"
        value={values.title}
        onChange={setField('title')}
        error={fieldError('title')}
        maxLength={120}
        placeholder="What needs to be done?"
        autoFocus
      />
      <Textarea
        id="task-description"
        label="Description"
        rows={3}
        value={values.description}
        onChange={setField('description')}
        error={fieldError('description')}
        maxLength={2000}
        placeholder="Optional details"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          id="task-status"
          label="Status"
          options={STATUS_OPTIONS}
          value={values.status}
          onChange={setField('status')}
          error={fieldError('status')}
        />
        <Select
          id="task-priority"
          label="Priority"
          options={PRIORITY_OPTIONS}
          value={values.priority}
          onChange={setField('priority')}
          error={fieldError('priority')}
        />
      </div>
      <Input
        id="task-due"
        type="date"
        label="Due date"
        value={values.dueDate}
        onChange={setField('dueDate')}
        error={fieldError('dueDate')}
        hint="Optional"
      />

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {initial ? 'Save changes' : 'Create task'}
        </Button>
      </div>
    </form>
  );
}
