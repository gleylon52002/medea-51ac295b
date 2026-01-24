import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    toast.success("Bültene başarıyla kayıt oldunuz!");
    setEmail("");
  };

  return (
    <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
      <div className="container-main">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-medium mb-4">
            Bültene Katılın
          </h2>
          <p className="text-primary-foreground/80 mb-8">
            Yeni ürünler, özel indirimler ve doğal bakım ipuçlarından haberdar olun.
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/50 focus-visible:ring-primary-foreground/50"
            />
            <Button 
              type="submit" 
              variant="secondary"
              className="gap-2 shrink-0"
            >
              <Send className="h-4 w-4" />
              Abone Ol
            </Button>
          </form>

          <p className="mt-4 text-xs text-primary-foreground/60">
            Abone olarak gizlilik politikamızı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
