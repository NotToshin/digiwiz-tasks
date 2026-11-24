import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

export function useTaskDrawer() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  function openTask(taskId: string) {
    const next = new URLSearchParams(params);
    next.set('task', taskId);
    const alreadyOpen = params.has('task');

    setParams(next, {
      replace: alreadyOpen,
      state: { taskOpenedHere: !alreadyOpen || location.state?.taskOpenedHere === true },
    });
  }

  function closeTask() {
    if (location.state?.taskOpenedHere === true) {
      navigate(-1);
      return;
    }

    const next = new URLSearchParams(params);
    next.delete('task');
    setParams(next, { replace: true });
  }

  return { openTask, closeTask };
}
