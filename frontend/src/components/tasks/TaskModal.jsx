import { useState } from 'react';
import Modal from '../ui/Modal';
import TaskForm from './TaskForm';
import { useToast } from '../../context/ToastContext';
import { createTask, updateTask } from '../../services/taskApi';
import { getErrorMessage, getFieldErrors } from '../../services/api';

/** Create (task = null) or edit (task = existing) in one modal. */
export default function TaskModal({ open, task, onClose, onSaved }) {
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [serverErrors, setServerErrors] = useState({});
  const [formError, setFormError] = useState('');
  const isEdit = Boolean(task);

  const close = () => {
    setServerErrors({});
    setFormError('');
    onClose();
  };

  const handleSubmit = async (payload) => {
    setSubmitting(true);
    setServerErrors({});
    setFormError('');
    try {
      if (isEdit) await updateTask(task.id, payload);
      else await createTask(payload);
      toast.success(isEdit ? 'Task updated.' : 'Task created.');
      onSaved();
      close();
    } catch (error) {
      setServerErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title={isEdit ? 'Edit task' : 'New task'}>
      <TaskForm
        key={task?.id || 'new'}
        initial={task}
        onSubmit={handleSubmit}
        onCancel={close}
        submitting={submitting}
        serverErrors={serverErrors}
        formError={formError}
      />
    </Modal>
  );
}
