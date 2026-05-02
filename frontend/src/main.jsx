import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { GoogleOAuthProvider } from "@react-oauth/google";
import App from "./App";
import "./index.css";
import ShopContextProvider from "./context/ShopContext";
import store from "./store/store";
import AuthInitializer from "./components/AuthInitializer";

// Google OAuth Client ID
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "1008038534120-0in7klvp5sk298nj118f2v7hcrqcd90n.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <BrowserRouter>
        <AuthInitializer>
          <ShopContextProvider>
            <App />
          </ShopContextProvider>
        </AuthInitializer>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </Provider>
);
