import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Send, History, Zap } from "lucide-react";
import SmsSettings from "@/components/admin/sms/SmsSettings";
import SmsSend from "@/components/admin/sms/SmsSend";
import SmsHistory from "@/components/admin/sms/SmsHistory";
import SmsAutomation from "@/components/admin/sms/SmsAutomation";

const AdminSMS = () => {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">SMS Yönetimi</h1>
        <p className="text-muted-foreground">SMS gönderimi, otomasyon ve yönetim</p>
      </div>

      <Tabs defaultValue="send">
        <TabsList>
          <TabsTrigger value="send" className="gap-2">
            <Send className="h-4 w-4" />
            SMS Gönder
          </TabsTrigger>
          <TabsTrigger value="automation" className="gap-2">
            <Zap className="h-4 w-4" />
            Otomatik SMS
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="h-4 w-4" />
            Geçmiş
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Ayarlar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="send" className="space-y-4 mt-4">
          <SmsSend />
        </TabsContent>

        <TabsContent value="automation" className="space-y-4 mt-4">
          <SmsAutomation />
        </TabsContent>

        <TabsContent value="history" className="space-y-4 mt-4">
          <SmsHistory />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4 mt-4">
          <SmsSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSMS;
