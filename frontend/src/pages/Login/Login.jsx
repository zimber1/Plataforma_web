import React, { useRef, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, User, Loader, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const validateEmail = (email) => {
  if (!email) return "El email es requerido.";
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return "Formato de email inválido.";
  return "";
};

const validatePassword = (password) => {
  if (!password) return "La contraseña es requerida.";
  return "";
};

export default function Login() {
  const navigate = useNavigate();
  const { loginUser, isLoggedIn } = useAuth();
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  // Redirigir si ya está logueado
  React.useEffect(() => {
    if (isLoggedIn) navigate("/");
  }, [isLoggedIn, navigate]);

  const runValidation = useCallback(() => {
    const e = {};
    const emailError = validateEmail(email.trim());
    if (emailError) e.email = emailError;
    const pwError = validatePassword(password);
    if (pwError) e.password = pwError;
    return e;
  }, [email, password]);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const eErrors = runValidation();
    setErrors((prev) => ({ ...prev, [field]: eErrors[field] || "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTouched({ email: true, password: true });
    const eErrors = runValidation();
    setErrors(eErrors);

    if (Object.keys(eErrors).length > 0) {
      if (eErrors.email) emailRef.current?.focus();
      else if (eErrors.password) passwordRef.current?.focus();
      return;
    }

    setLoading(true);
    setApiError(null);

    try {
      await loginUser(email.trim(), password);
      navigate("/");
    } catch (err) {
      setApiError(err.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  const formInvalid = () => {
    const eErrors = runValidation();
    return Object.keys(eErrors).length > 0;
  };

  const handleCapsLock = (e) => {
    setCapsLock(e.getModifierState("CapsLock"));
  };

  const toggleShowPassword = () => {
    setShowPassword((prev) => !prev);
    setTimeout(() => passwordRef.current?.focus(), 0);
  };

  return (
    <div className="auth-container">
      <header className="auth-header">
        <div className="logo">
          <img
            src="/juego-de-arcade.png"
            alt="Logo"
            style={{ height: "32px", width: "auto" }}
          />
        </div>
        <button
          className="back-button"
          onClick={() => navigate("/")}
          aria-label="Volver al inicio"
        >
          <ArrowLeft size={24} color="var(--primary-purple)" />
        </button>
      </header>

      <div className="auth-card">
        {/* Ícono + título de bienvenida */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              background: "rgba(var(--primary-purple-rgb, 99, 60, 180), 0.08)",
              borderRadius: "50%",
              padding: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <User size={48} strokeWidth={1.25} color="var(--primary-purple)" />
          </div>

          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                margin: "0 0 6px",
                fontSize: "22px",
                fontWeight: "600",
                color: "var(--text-primary, #b47dfc)",
                letterSpacing: "-0.3px",
              }}
            >
              Bienvenido de nuevo
            </h1>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                color: "var(--text-secondary, #6b7280)",
                lineHeight: "1.5",
              }}
            >
              Ingresa con tu cuenta para continuar
            </p>
          </div>
        </div>

        {/* Error de API */}
        <div role="status" aria-live="polite" aria-atomic="true">
          {apiError && (
            <div
              style={{
                padding: "12px",
                background: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "8px",
                color: "#ef4444",
                fontSize: "14px",
                textAlign: "center",
                marginBottom: "16px",
              }}
            >
              {apiError}
            </div>
          )}
        </div>

        <form
          className="auth-form"
          onSubmit={handleSubmit}
          noValidate
          role="form"
          aria-label="Formulario de inicio de sesión"
        >
          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              ref={emailRef}
              type="email"
              placeholder="ejemplo@correo.com"
              value={email}
              autoComplete="email"
              onChange={(ev) => {
                setEmail(ev.target.value);
                if (touched.email) {
                  const err = validateEmail(ev.target.value.trim());
                  setErrors((prev) => ({ ...prev, email: err }));
                }
              }}
              onBlur={() => handleBlur("email")}
              aria-required="true"
              aria-invalid={touched.email && errors.email ? "true" : "false"}
              aria-describedby={
                touched.email && errors.email ? "email-error" : undefined
              }
              disabled={loading}
            />
            {touched.email && errors.email && (
              <div
                id="email-error"
                role="alert"
                style={{
                  color: "var(--error, #ef4444)",
                  marginTop: "4px",
                  fontSize: "13px",
                }}
              >
                {errors.email}
              </div>
            )}
          </div>

          {/* Contraseña */}
          <div className="form-group">
            <label htmlFor="password">Contraseña</label>

            <div className="password-input-wrapper">
              <input
                id="password"
                ref={passwordRef}
                type={showPassword ? "text" : "password"}
                placeholder="Tu contraseña"
                value={password}
                autoComplete="current-password"
                onChange={(ev) => {
                  setPassword(ev.target.value);
                  if (touched.password) {
                    const err = validatePassword(ev.target.value);
                    setErrors((prev) => ({ ...prev, password: err }));
                  }
                }}
                onBlur={() => handleBlur("password")}
                onKeyUp={handleCapsLock}
                onKeyDown={handleCapsLock}
                aria-required="true"
                aria-invalid={
                  touched.password && errors.password ? "true" : "false"
                }
                aria-describedby={
                  [
                    touched.password && errors.password ? "password-error" : "",
                    capsLock ? "caps-lock-warning" : "",
                  ]
                    .filter(Boolean)
                    .join(" ") || undefined
                }
                disabled={loading}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={toggleShowPassword}
                aria-label={
                  showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                }
                aria-pressed={showPassword}
                tabIndex={0}
                disabled={loading}
                style={{
                  cursor: loading ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  color: "var(--primary-purple)",
                  opacity: loading ? 0.4 : 0.7,
                  border: "none",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.currentTarget.style.opacity = "0.7";
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.boxShadow =
                    "0 0 0 2px var(--primary-purple)")
                }
                onBlur={(e) => (e.currentTarget.style.boxShadow = "none")}
              >
                {showPassword ? (
                  <EyeOff size={18} aria-hidden="true" />
                ) : (
                  <Eye size={18} aria-hidden="true" />
                )}
              </button>
            </div>

            {capsLock && (
              <div
                id="caps-lock-warning"
                role="status"
                style={{
                  marginTop: "5px",
                  fontSize: "12px",
                  color: "var(--warning, #f59e0b)",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                ⚠ Bloq Mayús activado
              </div>
            )}

            {touched.password && errors.password && (
              <div
                id="password-error"
                role="alert"
                style={{
                  color: "var(--error, #ef4444)",
                  marginTop: "4px",
                  fontSize: "13px",
                }}
              >
                {errors.password}
              </div>
            )}
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={formInvalid() || loading}
            aria-disabled={formInvalid() || loading}
            aria-busy={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
            }}
          >
            {loading && (
              <Loader
                size={18}
                style={{ animation: "spin 1s linear infinite" }}
                aria-hidden="true"
              />
            )}
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>

          {submitted && Object.keys(errors).length > 0 && (
            <div
              role="alert"
              style={{
                marginTop: "8px",
                color: "var(--error, #ef4444)",
                fontSize: "13px",
                textAlign: "center",
              }}
            >
              Por favor corrige los errores en el formulario.
            </div>
          )}
        </form>

        {/* Divisor visual hacia el registro */}
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            margin: "20px 0 16px",
          }}
        >
          <div
            style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }}
          />
          <span
            style={{
              fontSize: "12px",
              color: "var(--text-secondary, #9ca3af)",
              whiteSpace: "nowrap",
            }}
          >
          </span>
          <div
            style={{ flex: 1, height: "1px", background: "rgba(0,0,0,0.08)" }}
          />
        </div>

        <p
          className="auth-footer"
          style={{ textAlign: "center", margin: 0, fontSize: "14px" }}
        >
          ¿No tienes cuenta? <Link to="/register">Regístrate gratis</Link>
        </p>
      </div>
    </div>
  );
}
