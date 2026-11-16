import { useCallback, useEffect, useState } from 'react';
import { listTasks } from '../services/taskApi';
import { getErrorMessage } from '../services/api';

/** Loads a page of tasks for the given query params and reloads when they change. */
export default function useTasks(params) {
  const [state, setState] = useState({ tasks: [], pagination: null, loading: true, error: null });
  const [reloadToken, setReloadToken] = useState(0);

  // Stable key so a new-but-equal params object does not trigger a refetch.
  const key = JSON.stringify(params);

  useEffect(() => {
    let cancelled = false; // ignore responses from outdated requests
    setState((current) => ({ ...current, loading: true, error: null }));

    listTasks(JSON.parse(key))
      .then(({ tasks, pagination }) => {
        if (!cancelled) setState({ tasks, pagination, loading: false, error: null });
      })
      .catch((error) => {
        if (!cancelled) setState((current) => ({ ...current, loading: false, error: getErrorMessage(error) }));
      });

    return () => {
      cancelled = true;
    };
  }, [key, reloadToken]);

  const refetch = useCallback(() => setReloadToken((token) => token + 1), []);

  return { ...state, refetch };
}
