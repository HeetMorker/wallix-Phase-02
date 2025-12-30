import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch } from "react-redux";
import AppLogo from "./Common/AppLogo";

const Login = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      const response = await axios.post("/api/auth/login", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      localStorage.setItem("token", response.data.token);
      setMessage("Login successful");

      // Optional: Save user info using dispatch
      // dispatch(setUserInfo(...));

      navigate("/");
    } catch (error) {
      if (error.response) {
        setError(error.response.data.message || "Invalid username or password");
      } else {
        setError("Login failed due to a network or server error.");
      }
    }
  };

  return (
    <div className="container-xxl">
      <div className="authentication-wrapper authentication-basic container-p-y">
        <div className="authentication-inner">
          <div className="card">
            <div className="card-body">
              <div className="app-brand justify-content-center">
                <a href="login" className="app-brand-link gap-2">
                  <span className="app-brand-logo demo py-4">
                    <AppLogo />
                  </span>
                </a>
              </div>

              <form
                id="formAuthentication"
                className="mb-3"
                onSubmit={handleSubmit}
              >
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Enter your Username"
                    autoFocus
                    required
                  />
                  {error && <p style={{ color: "red" }}>{error}</p>}
                </div>

                <div className="mb-3 form-password-toggle">
                  <div className="d-flex justify-content-between">
                    <label className="form-label" htmlFor="password">
                      Password
                    </label>
                  </div>
                  <div className="input-group input-group-merge">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      className="form-control"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••••"
                      aria-describedby="toggle-password"
                      required
                    />
                    <span
                      className="input-group-text cursor-pointer"
                      onClick={() => setShowPassword((prev) => !prev)}
                    >
                      <i
                        className={`bx ${showPassword ? "bx-show" : "bx-hide"}`}
                      ></i>
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <button
                    className="btn btn-primary d-grid w-100"
                    type="submit"
                  >
                    Sign in
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
