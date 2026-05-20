import React, { createContext, useContext } from 'react';
import { useLAGNodeLink } from '../hooks/useLAGNodeLink';
import { useAudio } from './AudioContext';

const LAGNodeContext = createContext();

export function LAGNodeProvider({ children }) {
  const { t } = useAudio();
  const lagnodeData = useLAGNodeLink(t);

  return (
    <LAGNodeContext.Provider value={lagnodeData}>
      {children}
    </LAGNodeContext.Provider>
  );
}

export function useLAGNode() {
  const context = useContext(LAGNodeContext);
  if (!context) throw new Error('useLAGNode must be used within a LAGNodeProvider');
  return context;
}
