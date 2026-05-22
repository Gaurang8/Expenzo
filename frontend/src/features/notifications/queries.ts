import { useInfiniteQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { PaginatedData } from "@/lib/types";
import type { Notification } from "./types";

export type { Notification };

export const notificationKeys = {
    all: ['notifications'] as const,
    lists: () => [...notificationKeys.all, 'list'] as const,
};

export const useNotifications = () => {
    return useInfiniteQuery({
        queryKey: notificationKeys.lists(),
        queryFn: async ({ pageParam = 1 }) => {
            return api.get<PaginatedData<Notification>>(`/notifications/?page=${pageParam}`);
        },
        getNextPageParam: (lastPage) => {
            return lastPage.data.has_next ? lastPage.data.page + 1 : undefined;
        },
        initialPageParam: 1,
    });
};
