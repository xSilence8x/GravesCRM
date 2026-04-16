import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Flower2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

export default function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [registrationEnabled, setRegistrationEnabled] = useState(true);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  useEffect(() => {
    // Načíst konfiguraci registrace z backendu
    const fetchRegistrationState = async () => {
      try {
        const response = await fetch("/api/auth/config");
        const data = await response.json();
        setRegistrationEnabled(data.registration_enabled ?? true);
      } catch (error) {
        console.error("Chyba při načítání konfigurace:", error);
        // Výchozí stav je registrace povolena
        setRegistrationEnabled(true);
      }
    };

    fetchRegistrationState();
  }, []);
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = isLogin ? await signIn(email, password, rememberMe) : await signUp(email, password);
    setLoading(false);
    if (error) {
      toast({ title: "Chyba", description: error.message, variant: "destructive" });
    } else if (!isLogin) {
      toast({ title: "Účet vytvořen", description: "Zkontrolujte svůj e-mail pro potvrzení účtu." });
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotPasswordEmail) {
      toast({ title: "Chyba", description: "E-mail je povinný", variant: "destructive" });
      return;
    }
    setForgotPasswordLoading(true);
    try {
      await apiClient.post("/api/auth/forgot-password", { email: forgotPasswordEmail });
      toast({ 
        title: "Email odeslán", 
        description: "Zkontrolujte svůj e-mail pro instrukce na obnovení hesla." 
      });
      setShowForgotPasswordModal(false);
      setForgotPasswordEmail("");
    } catch (err: any) {
      toast({ 
        title: "Chyba", 
        description: err?.message || "Chyba při obnovení hesla", 
        variant: "destructive" 
      });
    }
    setForgotPasswordLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-2">
            <Flower2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">GraveCare</CardTitle>
          <CardDescription>{isLogin ? "Přihlaste se ke svému účtu" : "Vytvořit nový účet"}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Heslo</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {isLogin && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                  />
                  <Label htmlFor="remember-me" className="font-normal cursor-pointer">Zapamatovat si mě</Label>
                </div>
                <div className="text-right">
                  <button 
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)} 
                    className="text-sm text-primary hover:underline"
                  >
                    Zapomenuté heslo?
                  </button>
                </div>
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : isLogin ? "Přihlásit se" : "Vytvořit účet"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Nemáte účet?" : "Už máte účet?"}{" "}
            {isLogin || registrationEnabled ? (
              <button onClick={() => {
                if (!isLogin && !registrationEnabled) return;
                setIsLogin(!isLogin);
              }} className="text-primary hover:underline font-medium">
                {isLogin ? "Zaregistrujte se" : "Přihlaste se"}
              </button>
            ) : (
              <span className="text-muted-foreground">Registrace je momentálně vypnutá</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Jednoduchy modal bez Dialog komponentu */}
      {showForgotPasswordModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Obnova hesla</CardTitle>
              <CardDescription>Zadejte svůj e-mail a obdržíte instrukce na resetování hesla</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="forgot-email">E-mail</Label>
                  <Input 
                    id="forgot-email" 
                    type="email" 
                    value={forgotPasswordEmail} 
                    onChange={(e) => setForgotPasswordEmail(e.target.value)} 
                    required 
                  />
                </div>
                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    className="flex-1" 
                    disabled={forgotPasswordLoading}
                  >
                    {forgotPasswordLoading ? "..." : "Odeslat"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setShowForgotPasswordModal(false);
                      setForgotPasswordEmail("");
                    }}
                  >
                    Zrušit
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
