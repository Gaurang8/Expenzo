import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";

import { notificationKeys } from "./queries";

export const useNotificationMutations = () => {
    const queryClient = useQueryClient();

    const markAsRead = useMutation({
        mutationFn: async (id: number) => {
            const { data } = await api.post(`/notifications/${id}/mark_as_read/`, {});
            return data;
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });

    const markAllAsRead = useMutation({
        mutationFn: async () => {
            const { data } = await api.post("/notifications/mark_all_as_read/", {});
            return data;
        },

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: notificationKeys.all });
        },
    });

    return { markAsRead, markAllAsRead };
};
