
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { functions } from "@/firebaseConfig";
import { httpsCallable } from "firebase/functions";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function LinkedInCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const processCallback = async () => {
            const code = searchParams.get("code");
            const error = searchParams.get("error");
            const errorDescription = searchParams.get("error_description");

            if (error) {
                setStatus("error");
                setErrorMsg(errorDescription || "LinkedIn access denied.");
                return;
            }

            if (!code) {
                setStatus("error");
                setErrorMsg("No authorization code received.");
                return;
            }

            try {
                const handleCallback = httpsCallable(functions, 'handleLinkedInCallback');

                // Pass the Current URL base as redirect URI context (must match exactly what was sent in step 1)
                // Usually, step 1 sends the configured redirect_uri. 
                // We will assume the strict redirect URI is `window.location.origin + "/auth/callback/linkedin"`
                const redirectUri = window.location.origin + "/auth/callback/linkedin";

                await handleCallback({ code, redirectUri });

                setStatus("success");
                toast.success("LinkedIn connected successfully!");

                // Redirect back after short delay
                setTimeout(() => {
                    const returnTo = sessionStorage.getItem('authrax_auth_redirect') || '/settings';
                    sessionStorage.removeItem('authrax_auth_redirect');
                    navigate(returnTo);
                }, 1500);

            } catch (err: any) {
                console.error("Callback processing failed:", err);
                setStatus("error");
                setErrorMsg(err.message || "Failed to complete connection.");
            }
        };

        processCallback();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="max-w-md w-full text-center space-y-4">

                {status === "processing" && (
                    <>
                        <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                        <h2 className="text-xl font-semibold">Connecting to LinkedIn...</h2>
                        <p className="text-muted-foreground">Please wait while we secure your connection.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                        <h2 className="text-xl font-semibold">Connected!</h2>
                        <p className="text-muted-foreground">Redirecting you back...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
                        <h2 className="text-xl font-semibold">Connection Failed</h2>
                        <p className="text-muted-foreground mb-4">{errorMsg}</p>
                        <button
                            onClick={() => navigate('/settings')}
                            className="text-primary hover:underline"
                        >
                            Return to Settings
                        </button>
                    </>
                )}

            </div>
        </div>
    );
}
