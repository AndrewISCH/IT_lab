import type {ReactNode} from "react";
import "./styles.css";

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({children}: AuthLayoutProps) => {
  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-header">
          <h1>Database Hotel</h1>
        </div>
        {children}
      </div>
    </div>
  );
};
