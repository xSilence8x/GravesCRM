import { useState, useEffect } from "react";
import { useSearchParams, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Flower2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/apiClient";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validatingToken, setValidatingToken] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    // Ověřit token při načtení stránky
    const validateToken = async () => {
      if (!token) {
        setValidatingToken(false);
        return;
      }

      try {
        await apiClient.post("/api/auth/verify-reset-token", { token });
        setTokenValid(true);
      } catch (err: any) {
        toast({ 
          title: "Chyba", 
          description: err?.message || "Token je neplatný nebo vypršel", 
          variant: "destructive" 
        });
        setTokenValid(false);
      } finally {
        setValidatingToken(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({ 
        title: "Chyba", 
        description: "Hesla se neshodují", 
        variant: "destructive" 
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({ 
        title: "Chyba", 
        description: "Heslo musí mít alespoň 6 znaků", 
        variant: "destructive" 
      });
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/api/auth/reset-password", { 
        token, 
        password: newPassword 
      });
      toast({ 
        title: "Úspěch", 
        description: "Heslo bylo úspěšně změněno. Nyní se můžete přihlásit novým heslem." 
      });
      setResetSuccess(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (err: any) {
      toast({ 
        title: "Chyba", 
        description: err?.message || "Chyba při resetování hesla", 
        variant: "destructive" 
      });
    }
    setLoading(false);
  };

  if (validatingToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">Ověřování tokenu...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!token || !tokenValid) {
    return <Navigate to="/auth" replace />;
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-green-600 font-medium">Heslo úspěšně resetováno!</p>
            <p className="text-sm text-muted-foreground mt-2">Budete přesměrováni na přihlášení...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary mb-2">
            <Flower2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-xl">Resetování hesla</CardTitle>
          <CardDescription>Zadejte nové heslo pro svůj účet</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nové heslo</Label>
              <Input 
                id="password" 
                type="password" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Potvrdit heslo</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                required 
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "..." : "Resetovat heslo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
