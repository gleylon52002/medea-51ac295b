import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Loader2, Store } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import SellerApplicationForm from "@/components/seller/SellerApplicationForm";
import { cn } from "@/lib/utils";

const Auth = () => {
  const navigate = useNavigate();
  const { user, isLoading: authLoading, signIn, signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [registerData, setRegisterData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  // Get query params to check for tab selection
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultTab = searchParams.get("tab") || "login";

  // Redirect if already logged in, UNLESS on seller tab
  useEffect(() => {
    if (user && !authLoading) {
      if (defaultTab !== "seller") {
        navigate("/");
      }
    }
  }, [user, authLoading, navigate, defaultTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(loginData.email, loginData.password);

    if (error) {
      toast.error(error.message === "Invalid login credentials"
        ? "E-posta veya şifre hatalı"
        : error.message);
    } else {
      toast.success("Giriş başarılı!");
      navigate("/");
    }

    setIsLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Şifreler eşleşmiyor");
      return;
    }

    if (registerData.password.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setIsLoading(true);

    const fullName = `${registerData.firstName} ${registerData.lastName}`.trim();
    const { error } = await signUp(registerData.email, registerData.password, fullName, registerData.phone);

    if (error) {
      if (error.message.includes("already registered")) {
        toast.error("Bu e-posta adresi zaten kayıtlı");
      } else {
        toast.error(error.message);
      }
    } else {
      toast.success("Kayıt başarılı! Giriş yapabilirsiniz.");
      navigate("/");
    }

    setIsLoading(false);
  };

  if (authLoading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-12 lg:py-20">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="font-serif text-3xl font-medium text-foreground mb-2">
              Hoş Geldiniz
            </h1>
            <p className="text-muted-foreground">
              Hesabınıza giriş yapın veya yeni hesap oluşturun
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 lg:p-8">
            <Tabs
              value={searchParams.get("tab") || "login"}
              onValueChange={(val) => setSearchParams({ tab: val })}
              className="w-full"
            >
              <TabsList className={cn("grid w-full mb-6", user ? "grid-cols-1" : "grid-cols-3")}>
                {!user && <TabsTrigger value="login">Giriş Yap</TabsTrigger>}
                {!user && <TabsTrigger value="register">Kayıt Ol</TabsTrigger>}
                <TabsTrigger value="seller" className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  Satıcı Ol
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-10"
                        value={loginData.email}
                        onChange={(e) =>
                          setLoginData({ ...loginData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="login-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={loginData.password}
                        onChange={(e) =>
                          setLoginData({ ...loginData, password: e.target.value })
                        }
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2">
                      <input type="checkbox" className="rounded" />
                      <span className="text-muted-foreground">Beni hatırla</span>
                    </label>
                    <Link
                      to="/sifremi-unuttum"
                      className="text-primary hover:underline"
                    >
                      Şifremi unuttum
                    </Link>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Giriş yapılıyor...
                      </>
                    ) : (
                      "Giriş Yap"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Ad</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="firstName"
                          placeholder="Adınız"
                          className="pl-10"
                          value={registerData.firstName}
                          onChange={(e) =>
                            setRegisterData({ ...registerData, firstName: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Soyad</Label>
                      <Input
                        id="lastName"
                        placeholder="Soyadınız"
                        value={registerData.lastName}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, lastName: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">E-posta</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="ornek@email.com"
                        className="pl-10"
                        value={registerData.email}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, email: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-phone">Telefon</Label>
                    <Input
                      id="register-phone"
                      type="tel"
                      placeholder="0532 123 45 67"
                      value={registerData.phone}
                      onChange={(e) =>
                        setRegisterData({ ...registerData, phone: e.target.value })
                      }
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Şifre</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="register-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={registerData.password}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, password: e.target.value })
                        }
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Şifre Tekrar</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        className="pl-10"
                        value={registerData.confirmPassword}
                        onChange={(e) =>
                          setRegisterData({ ...registerData, confirmPassword: e.target.value })
                        }
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div className="text-sm">
                    <label className="flex items-start gap-2">
                      <input type="checkbox" className="rounded mt-1" required />
                      <span className="text-muted-foreground">
                        <Link to="/kvkk" className="text-primary hover:underline">
                          KVKK Aydınlatma Metni
                        </Link>
                        'ni ve{" "}
                        <Link to="/gizlilik-politikasi" className="text-primary hover:underline">
                          Gizlilik Politikası
                        </Link>
                        'nı okudum, kabul ediyorum.
                      </span>
                    </label>
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Kayıt yapılıyor...
                      </>
                    ) : (
                      "Kayıt Ol"
                    )}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="seller">
                <SellerApplicationForm />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
