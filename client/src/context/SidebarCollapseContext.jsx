import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const SidebarCollapseContext = createContext(null);

export function SidebarCollapseProvider({ children }) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const value = useMemo(
    () => ({
      collapsed,
      setCollapsed,
      toggle,
    }),
    [collapsed, toggle]
  );

  return (
    <SidebarCollapseContext.Provider value={value}>
      {children}
    </SidebarCollapseContext.Provider>
  );
}

export function useSidebarCollapse() {
  const ctx = useContext(SidebarCollapseContext);
  if (!ctx) {
    throw new Error('useSidebarCollapse must be used within SidebarCollapseProvider');
  }
  return ctx;
}
