import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErrorMsg(null);

        try {
            await login(email, password);
            navigate("/"); // na succesvolle login naar dashboard
        } catch (err: any) {
            setErrorMsg(err.message ?? "Inloggen mislukt");
        }
    }

    return (
        <div className="login-container">
            <form className="login-form" onSubmit={handleSubmit}>
                <h2>Log in</h2>

                <label>Email</label>
                <input
                    type="email"
                    placeholder="jij@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />

                <label>Wachtwoord</label>
                <input
                    type="password"
                    placeholder="••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {errorMsg && (
                    <p style={{ color: "#f97373", marginBottom: 8 }}>{errorMsg}</p>
                )}

                <button className="login-button" type="submit">
                    Inloggen
                </button>

                <div className="login-small">
                    Nog geen account?{" "}
                    <Link to="/signup" className="login-link">
                        Maak er een
                    </Link>
                </div>
            </form>
        </div>
    );
}
