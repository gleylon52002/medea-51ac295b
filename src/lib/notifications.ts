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

export const notifyNewSignup = async ({ email, fullName, phone }: SignupNotificationParams) => {
  const tasks: Promise<unknown>[] = [
    supabase.functions.invoke("send-email", {
      body: {
        type: "welcome_user",
        to: email,
        data: {
          customerName: fullName,
          email,
          phone: phone || "",
        },
      },
    }),
    supabase.functions.invoke("send-email", {
      body: {
        type: "admin_new_signup",
        data: {
          customerName: fullName,
          email,
          phone: phone || "",
        },
      },
    }),
  ];

  if (phone) {
    tasks.push(
      supabase.functions.invoke("auto-sms", {
        body: {
          type: "welcome",
          phone,
          variables: { name: fullName },
        },
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
    supabase.functions.invoke("send-email", {
      body: {
        type: "order_confirmation",
        to: email,
        orderId,
      },
    }),
    supabase.functions.invoke("send-email", {
      body: {
        type: "admin_new_order",
        orderId,
        data: {
          orderNumber,
          customerName,
          email,
          phone: phone || "",
          total: total.toFixed(2),
        },
      },
    }),
  ];

  if (phone) {
    tasks.push(
      supabase.functions.invoke("auto-sms", {
        body: {
          type: "order_confirmed",
          phone,
          variables: {
            order_number: orderNumber,
            total: total.toFixed(2),
            name: customerName,
          },
        },
      })
    );
  }

  const results = await Promise.allSettled(tasks);
  results.forEach((result, index) => logFailedResult(`order-${index + 1}`, result));
};
