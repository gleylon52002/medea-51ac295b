import { Bell, CheckCircle, Star, AlertTriangle, ShoppingCart, MessageSquare, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSellerNotifications, useMarkNotificationRead } from "@/hooks/useSeller";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const notificationIcons = {
  points: Star,
  order: ShoppingCart,
  review: MessageSquare,
  system: Info,
  warning: AlertTriangle,
  suspension: AlertTriangle,
};

const notificationColors = {
  points: "text-yellow-500 bg-yellow-50",
  order: "text-blue-500 bg-blue-50",
  review: "text-green-500 bg-green-50",
  system: "text-gray-500 bg-gray-50",
  warning: "text-orange-500 bg-orange-50",
  suspension: "text-red-500 bg-red-50",
};

const SellerNotifications = () => {
  const { data: notifications, isLoading } = useSellerNotifications();
  const markAsRead = useMarkNotificationRead();

  const handleMarkAsRead = (id: string) => {
    markAsRead.mutate(id);
  };

  const handleMarkAllAsRead = () => {
    notifications?.filter(n => !n.is_read).forEach(n => {
      markAsRead.mutate(n.id);
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bildirimler</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `${unreadCount} okunmamış bildirim` 
              : "Tüm bildirimler okundu"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllAsRead}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Tümünü Okundu İşaretle
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Bildirimler
          </CardTitle>
        </CardHeader>
        <CardContent>
          {notifications?.length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Henüz bildirim yok</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications?.map((notification) => {
                const Icon = notificationIcons[notification.notification_type as keyof typeof notificationIcons] || Info;
                const colorClass = notificationColors[notification.notification_type as keyof typeof notificationColors] || "text-gray-500 bg-gray-50";

                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 rounded-lg border transition-colors",
                      notification.is_read 
                        ? "bg-background" 
                        : "bg-muted/50 border-primary/20"
                    )}
                  >
                    <div className="flex gap-4">
                      <div className={cn("p-2 rounded-lg shrink-0", colorClass)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium">{notification.title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {notification.message}
                            </p>
                          </div>
                          {!notification.is_read && (
                            <Badge variant="default" className="shrink-0">Yeni</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(notification.created_at).toLocaleString("tr-TR")}
                          </span>
                          {!notification.is_read && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleMarkAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Okundu
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SellerNotifications;
