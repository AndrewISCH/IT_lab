import {RouterProvider} from "react-router-dom";
import {QueryProvider} from "./providers/QueryProvider";
import {AuthProvider} from "./store/useAuth/AuthProvider";
import {router} from "./router";
import "./App.css";
import {ErrorMessage} from "./components/core/ErrorModal";

function App() {
  return (
    <QueryProvider>
      <AuthProvider>
        <RouterProvider router={router} />
        <ErrorMessage />
      </AuthProvider>
    </QueryProvider>
  );
}

export default App;
