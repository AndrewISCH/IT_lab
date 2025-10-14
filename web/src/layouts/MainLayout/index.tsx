import {Outlet, Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../store/useAuth/AuthContext";
import "./styles.css";

export const MainLayout = () => {
  const {user, logout} = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="main-layout">
      <header className="header">
        <div className="header-content">
          <Link to="/databases" className="logo">
            DataBase Hotel
          </Link>
          <div className="header-right">
            <span className="user-info">👤 {user?.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Вийти
            </button>
          </div>
        </div>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};
