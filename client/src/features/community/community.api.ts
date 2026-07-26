import { api } from "@/lib/api";

export type CommunitySummary = {
  id: string;
  name: string;
  description: string;
  topic: string;
  city: string;
  memberCount: number;
  joined: boolean;
};

export type CommunityEvent = {
  id: string;
  communityId?: string;
  communityName?: string;
  title: string;
  description: string;
  startsAt: string;
  location: string;
  capacity: number;
  goingCount: number;
  myRsvp: "going" | "interested" | "not-going" | null;
};

export type CommunityDetail = CommunitySummary & {
  isHost: boolean;
  members: { userId: string; displayName: string; verified: boolean; role: string }[];
  events: CommunityEvent[];
};

export const getTopics = () => api<{ topics: string[] }>("/communities/topics");

export const getCommunities = (params?: { topic?: string; q?: string; mine?: boolean }) => {
  const search = new URLSearchParams();
  if (params?.topic) search.set("topic", params.topic);
  if (params?.q) search.set("q", params.q);
  if (params?.mine) search.set("mine", "true");
  const qs = search.toString();
  return api<{ communities: CommunitySummary[] }>(`/communities${qs ? `?${qs}` : ""}`);
};

export const getCommunity = (id: string) => api<{ community: CommunityDetail }>(`/communities/${id}`);

export const createCommunity = (input: { name: string; description: string; topic: string; city?: string }) =>
  api<{ id: string }>("/communities", { method: "POST", body: JSON.stringify(input) });

export const joinCommunity = (id: string) => api<{ ok: boolean }>(`/communities/${id}/join`, { method: "POST" });
export const leaveCommunity = (id: string) => api<{ ok: boolean }>(`/communities/${id}/leave`, { method: "DELETE" });

export const createEvent = (
  communityId: string,
  input: { title: string; description: string; startsAt: string; location: string; capacity?: number },
) => api<{ id: string }>(`/communities/${communityId}/events`, { method: "POST", body: JSON.stringify(input) });

export const getEvents = (scope: "mine" | "all" = "mine") =>
  api<{ events: CommunityEvent[] }>(`/events?scope=${scope}`);

export const rsvp = (eventId: string, status: "going" | "interested" | "not-going") =>
  api<{ ok: boolean; status: string; goingCount: number }>(`/events/${eventId}/rsvp`, {
    method: "POST",
    body: JSON.stringify({ status }),
  });
