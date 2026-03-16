import { supabase } from "@/integrations/supabase/client";

interface SignupNotificationParams {
  email: string;
  fullName: string;
  phone?: string;
}

interface OrderNotificationParams {
  orderId: string;
  orderNumber: string;
  email: string;
  phone?: string;
  customerName: string;
  total: number;
}

const logFailedResult = (label: string, result: PromiseSettledResult<unknown>) => {
  if (result.status === "rejected") {
    console.error(`${label} notification failed:`, result.reason);
  }
};

const invokeNotification = async (functionName: "send-email" | "auto-sms", body: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke(functionName, { body });

  if (error) {
    throw error;
  }

  if (data && typeof data === "object" && "success" in data && data.success === false) {
    throw new Error(typeof data.message === "string" ? data.message : typeof data.error === "string" ? data.error : `${functionName} failed`);
  }

  return data;
};

export const notifyNewSignup = async ({ email, fullName, phone }: SignupNotificationParams) => {
  const tasks: Promise<unknown>[] = [
    invokeNotification("send-email", {
      type: "welcome_user",
      to: email,
      data: {
        customerName: fullName,
        email,
        phone: phone || "",
      },
    }),
    invokeNotification("send-email", {
      type: "admin_new_signup",
      data: {
        customerName: fullName,
        email,
        phone: phone || "",
      },
    }),
  ];

  if (phone) {
    tasks.push(
      invokeNotification("auto-sms", {
        type: "welcome",
        phone,
        variables: { name: fullName },
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((result, index) => logFailedResult(`signup-${index + 1}`, result));
};

export const notifyOrderCreated = async ({
  orderId,
  orderNumber,
  email,
  phone,
  customerName,
  total,
}: OrderNotificationParams) => {
  const tasks: Promise<unknown>[] = [
    invokeNotification("send-email", {
      type: "order_confirmation",
      to: email,
      orderId,
    }),
    invokeNotification("send-email", {
      type: "admin_new_order",
      orderId,
      data: {
        orderNumber,
        customerName,
        email,
        phone: phone || "",
        total: total.toFixed(2),
      },
    }),
  ];

  if (phone) {
    tasks.push(
      invokeNotification("auto-sms", {
        type: "order_confirmed",
        phone,
        variables: {
          order_number: orderNumber,
          total: total.toFixed(2),
          name: customerName,
        },
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((result, index) => logFailedResult(`order-${index + 1}`, result));
};
