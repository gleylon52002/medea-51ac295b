import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Mail, Phone, MapPin, Clock, Send } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Mesajınız Gönderildi",
      description: "En kısa sürede size dönüş yapacağız.",
    });
    setFormData({ name: "", email: "", subject: "", message: "" });
  };

  return (
    <Layout>
      <div className="container-main py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-foreground transition-colors">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">İletişim</span>
        </nav>

        <div className="text-center max-w-2xl mx-auto mb-12">
          <h1 className="font-serif text-3xl lg:text-4xl font-medium text-foreground mb-4">
            Bizimle İletişime Geçin
          </h1>
          <p className="text-muted-foreground">
            Sorularınız, önerileriniz veya işbirliği talepleriniz için bize ulaşabilirsiniz.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Contact Info */}
          <div className="space-y-6">
            <div className="bg-secondary/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Adres</h3>
                  <p className="text-sm text-muted-foreground">
                    Caferağa Mah. Moda Cad. No: 123<br />
                    Kadıköy, İstanbul 34710
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Telefon</h3>
                  <p className="text-sm text-muted-foreground">
                    +90 (212) 123 45 67<br />
                    +90 (532) 123 45 67 (WhatsApp)
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">E-posta</h3>
                  <p className="text-sm text-muted-foreground">
                    info@medea.com.tr<br />
                    destek@medea.com.tr
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-secondary/30 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Çalışma Saatleri</h3>
                  <p className="text-sm text-muted-foreground">
                    Pazartesi - Cuma: 09:00 - 18:00<br />
                    Cumartesi: 10:00 - 14:00<br />
                    Pazar: Kapalı
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Adınız Soyadınız</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Adınız Soyadınız"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">E-posta Adresiniz</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="ornek@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject">Konu</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder="Mesajınızın konusu"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Mesajınız</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Mesajınızı buraya yazın..."
                  rows={6}
                  required
                />
              </div>

              <Button type="submit" size="lg">
                <Send className="h-4 w-4 mr-2" />
                Mesaj Gönder
              </Button>
            </form>
          </div>
        </div>

        {/* Map */}
        <div className="mt-12">
          <div className="rounded-xl overflow-hidden h-[400px] bg-muted">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3011.6504900473437!2d29.02464931537371!3d40.98760997930261!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14cab8679bfb3d31%3A0x7d75715c0f5e9d6c!2sModa%2C%20Kad%C4%B1k%C3%B6y%2F%C4%B0stanbul!5e0!3m2!1str!2str!4v1640000000000!5m2!1str!2str"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="MEDEA Konum"
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Contact;
