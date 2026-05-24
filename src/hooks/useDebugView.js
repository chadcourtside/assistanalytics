import { useCallback, useEffect, useState } from 'react';
import {
  isDebugAdmin,
  readStoredDebugView,
  writeStoredDebugView,
} from '../utils/debugAccess';

export function useDebugView(user) {
  const admin = isDebugAdmin(user);
  const [debugView, setDebugViewState] = useState(() => readStoredDebugView());

  useEffect(() => {
    if (!admin && debugView !== 'actual') {
      writeStoredDebugView('actual');
      setDebugViewState('actual');
    }
  }, [admin, debugView]);

  const setDebugView = useCallback(
    (view) => {
      if (!admin) return;
      const next = view || 'actual';
      writeStoredDebugView(next);
      setDebugViewState(next);
    },
    [admin]
  );

  return {
    isDebugAdmin: admin,
    debugView: admin ? debugView : 'actual',
    setDebugView,
  };
}
