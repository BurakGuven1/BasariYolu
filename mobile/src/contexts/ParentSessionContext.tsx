import React, { createContext, useContext, useMemo, useState } from 'react';

export interface ParentUser {
  id: string;
  email: string;
  profile: {
    full_name: string;
    user_type: 'parent';
  };
  isParentLogin: true;
  connectedStudents: any[];
}

interface ParentSessionContextValue {
  parentUser: ParentUser | null;
  setParentUser: (parentUser: ParentUser | null) => void;
}

const ParentSessionContext = createContext<ParentSessionContextValue | undefined>(undefined);

export function ParentSessionProvider({ children }: { children: React.ReactNode }) {
  const [parentUser, setParentUser] = useState<ParentUser | null>(null);
  const value = useMemo(() => ({ parentUser, setParentUser }), [parentUser]);
  return <ParentSessionContext.Provider value={value}>{children}</ParentSessionContext.Provider>;
}

export function useParentSession() {
  const context = useContext(ParentSessionContext);
  if (!context) {
    throw new Error('useParentSession must be used within ParentSessionProvider');
  }
  return context;
}
