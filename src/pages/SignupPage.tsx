import { FormEvent, useState } from "react"; // P: dit vertelt Typescript wat voor functie handleSubmit krijgt.
import { useNavigate, Link } from "react-router-dom"; //P:  useNavigate --> "ga nu naar login"
import { supabase } from "../lib/SupabaseClients"; //
import "./SignupPage.css"; // Styling voor de pagina


export function SignupPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [infoMsg, setInfoMsg] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setErrorMsg(null);
        setInfoMsg(null);
        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        setLoading(false);

        if (error) {
            setErrorMsg(error.message);
            return;
        }

        // Optioneel: profiel aanmaken in user_profiles
        if (data.user) {
            const { error: profileError } = await supabase
                .from("user_profiles")
                .insert({
                    supabase_user_id: data.user.id,
                    email: data.user.email,
                    display_name: data.user.email?.split("@")[0] ?? null,
                });

            if (profileError) {
                console.error("Profile insert error:", profileError);
                setErrorMsg("Profiel kon niet worden aangemaakt: " + profileError.message);
                return; // evt. niet meteen navigeren
            }
        }


        // Afhankelijk van je Supabase-instelling:
        // - met email-confirmation UIT: direct ingelogd → naar dashboard
        // - met email-confirmation AAN: mail verstuurd → naar login
        setInfoMsg("Account aangemaakt. Je kunt nu inloggen.");
        navigate("/login");
    }

    return (
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSubmit}>
                <h2>Account aanmaken</h2>

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
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />

                {errorMsg && (
                    <p className="error-message">
                        {errorMsg}
                    </p>
                )}

                {infoMsg && (
                    <p className="info-message">
                        {infoMsg}
                    </p>
                )}

                <button type="submit" disabled={loading}>
                    {loading ? "Bezig..." : "Registreren"}
                </button>

                <p style={{ marginTop: "1rem", color: "#d1d5db" }}>
                    Al een account? <Link to="/login" className="login-link">Log in</Link>
                </p>
            </form>
        </div>
    );

}
