import { createContext, useContext, useState, useCallback, ReactNode, useRef } from "react";

interface AuthModalContextType {
  /** Open the auth modal. After successful auth, `pendingAction` will be called. */
  requireAuth: (pendingAction?: () => void) => void;
  closeAuthModal: () => void;
  isOpen: boolean;
  executePendingAction: () => void;
}

const AuthModalContext = createContext<AuthModalContextType>({
  requireAuth: () => {},
  closeAuthModal: () => {},
  isOpen: false,
  executePendingAction: () => {},
});

export const useAuthModal = () => useContext(AuthModalContext);

export const AuthModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pendingActionRef = useRef<(() => void) | null>(null);

  const requireAuth = useCallback((pendingAction?: () => void) => {
    pendingActionRef.current = pendingAction ?? null;
    setIsOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);
    pendingActionRef.current = null;
  }, []);

  const executePendingAction = useCallback(() => {
    setIsOpen(false);
    if (pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      // Delay slightly so auth state propagates
      setTimeout(action, 300);
    }
  }, []);

  return (
    <AuthModalContext.Provider value={{ requireAuth, closeAuthModal, isOpen, executePendingAction }}>
      {children}
    </AuthModalContext.Provider>
  );
};
