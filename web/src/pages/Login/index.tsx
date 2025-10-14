import {useState, type FormEvent} from "react";
import {Link, useNavigate} from "react-router-dom";
import {useAuth} from "../../store/useAuth/AuthContext";
import "./styles.css";

const LoginPage = () => {
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const {login} = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login({usernameOrEmail, password});
      navigate("/databases");
    } catch {
      setError("Помилка входу. Перевірте дані.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-form">
      <h2>Вхід</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="usernameOrEmail">Email або Username</label>
          <input
            id="usernameOrEmail"
            type="text"
            value={usernameOrEmail}
            onChange={(e) => setUsernameOrEmail(e.target.value)}
            placeholder="Введіть email або username"
            required
            disabled={isLoading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Введіть пароль"
            required
            disabled={isLoading}
          />
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{width: "100%"}}
          disabled={isLoading}
        >
          {isLoading ? "Вхід..." : "Увійти"}
        </button>
      </form>

      <p className="auth-link">
        Немає акаунту? <Link to="/register">Зареєструватися</Link>
      </p>
    </div>
  );
};

export default LoginPage;
