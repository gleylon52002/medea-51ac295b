import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ParticipantProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
  is_seller?: boolean;
  company_name?: string;
}

export const useParticipantProfiles = (participantIds: string[]) => {
  return useQuery({
    queryKey: ["participant-profiles", ...participantIds.sort()],
    queryFn: async () => {
      if (!participantIds.length) return {};

      // Fetch profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", participantIds);

      // Fetch seller info for participants who are sellers
      const { data: sellers } = await supabase
        .from("sellers")
        .select("user_id, company_name, logo_url")
        .in("user_id", participantIds);

      // Fetch admin roles
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", participantIds)
        .eq("role", "admin");

      const profileMap: Record<string, ParticipantProfile & { is_admin?: boolean }> = {};

      for (const id of participantIds) {
        const profile = profiles?.find(p => p.id === id);
        const seller = sellers?.find(s => s.user_id === id);
        const isAdmin = adminRoles?.some(r => r.user_id === id);

        profileMap[id] = {
          id,
          full_name: seller?.company_name || profile?.full_name || "Bilinmeyen Kullanıcı",
          avatar_url: seller?.logo_url || profile?.avatar_url || null,
          is_seller: !!seller,
          company_name: seller?.company_name,
          is_admin: !!isAdmin,
        };
      }

      return profileMap;
    },
    enabled: participantIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });
};
