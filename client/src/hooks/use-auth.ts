/* eslint-disable @typescript-eslint/no-explicit-any */
import { API } from "@/lib/axios-client";
import type { LoginType, RegisterType, UserType } from "@/types/auth.type";
import { toast } from "sonner";
import { create } from "zustand";
//import { persist } from "zustand/middleware";
import { useSocket } from "./use-socket";

interface AuthState {
  user: UserType | null;
  isLoggingIn: boolean;
  isSigningUp: boolean;
  isAuthStatusLoading: boolean;

  register: (data: RegisterType) => void;
  login: (data: LoginType, onLoginSuccess?: (user: UserType) => void) => void;
  logout: () => void;
  isAuthStatus: () => void;
}

//Without Persist
export const useAuth = create<AuthState>()((set) => ({
  user: null,
  isSigningUp: false,
  isLoggingIn: false,
  isAuthStatusLoading: false,

  register: async (data: RegisterType) => {
    set({ isSigningUp: true });
    try {
      const response = await API.post("/auth/register", data);
      set({ user: response.data.user });
      useSocket.getState().connectSocket();
      toast.success("Register successfully");
      
      // Check if there's a post-signup redirect (e.g., from accept-invite)
      const postSignupRedirect = localStorage.getItem("postSignupRedirect");
      if (postSignupRedirect) {
        localStorage.removeItem("postSignupRedirect");
        // The redirect will be handled by the component using this hook
        // Store it for the component to pick up
        localStorage.setItem("pendingSignupRedirect", postSignupRedirect);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Register failed");
    } finally {
      set({ isSigningUp: false });
    }
  },
  login: async (data: LoginType, onLoginSuccess?: (user: UserType) => void) => {
    set({ isLoggingIn: true });
    try {
      const response = await API.post("/auth/login", data);
      set({ user: response.data.user });
      useSocket.getState().connectSocket();
      toast.success("Login successfully");

      // Call redirect callback if provided (e.g., for invite redirects)
      if (onLoginSuccess) {
        onLoginSuccess(response.data.user);
        // Return early to let callback handle navigation
        set({ isLoggingIn: false });
        return;
      }

      // Process pending invite after login (if any)
      try {
        // Ensure server-side session/cookies are established before making authenticated requests
        // Call auth status endpoint once to guarantee session; ignore failure as we just tried to login
        try {
          await API.get("/auth/status");
        } catch {
          // ignore - we'll still attempt invites, with retry logic below
        }

        const pending = localStorage.getItem("pendingInvite");
        if (pending) {
          const obj = JSON.parse(pending) as {
            type: "group" | "channel" | "community";
            id: string;
          };

          const attemptInvite = async () => {
            try {
              if (obj.type === "group") {
                await API.post(`/chat/${obj.id}/add-member`, { userId: response.data.user._id });
              } else if (obj.type === "channel") {
                await API.post(`/channel/${obj.id}/subscribe`);
              } else if (obj.type === "community") {
                await API.post(`/community/${obj.id}/join-by-invite`);
              }
              // success
              localStorage.removeItem("pendingInvite");
            } catch (err: any) {
              // If unauthorized, try one more time after a small delay (server may not have set cookie yet)
              if (err?.response?.status === 401) {
                await new Promise((r) => setTimeout(r, 500));
                try {
                  if (obj.type === "group") {
                    await API.post(`/chat/${obj.id}/add-member`, { userId: response.data.user._id });
                  } else if (obj.type === "channel") {
                    await API.post(`/channel/${obj.id}/subscribe`);
                  } else if (obj.type === "community") {
                    await API.post(`/community/${obj.id}/join-by-invite`);
                  }
                  localStorage.removeItem("pendingInvite");
                } catch (err2) {
                  console.warn("Failed to process pending invite after retry", err2);
                }
              } else {
                console.warn("Failed to process pending invite", err);
              }
            }
          };

          await attemptInvite();
        }
      } catch (err) {
        console.warn("Failed to process pending invite", err);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Register failed");
    } finally {
      set({ isLoggingIn: false });
    }
  },
  logout: async () => {
    try {
      await API.post("/auth/logout");
      set({ user: null });
      useSocket.getState().disconnectSocket();
      toast.success("Logout successfully");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Register failed");
    }
  },
  isAuthStatus: async () => {
    set({ isAuthStatusLoading: true });
    try {
      const response = await API.get("/auth/status");
      set({ user: response.data.user });
      useSocket.getState().connectSocket();
    } catch {
      // 401 is expected when user is not logged in - don't show error toast
      set({ user: null });
    } finally {
      set({ isAuthStatusLoading: false });
    }
  },
}));

//With Persist
// export const useAuth = create<AuthState>()(
//   persist(
//     (set) => ({
//       user: null,
//       isSigningUp: false,
//       isLoggingIn: false,
//       isAuthStatusLoading: false,

//       register: async (data: RegisterType) => {
//         set({ isSigningUp: true });
//         try {
//           const response = await API.post("/auth/register", data);
//           set({ user: response.data.user });
//           useSocket.getState().connectSocket();
//           toast.success("Register successfully");
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Register failed");
//         } finally {
//           set({ isSigningUp: false });
//         }
//       },
//       login: async (data: LoginType) => {
//         set({ isLoggingIn: true });
//         try {
//           const response = await API.post("/auth/login", data);
//           set({ user: response.data.user });
//           useSocket.getState().connectSocket();
//           toast.success("Login successfully");
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Register failed");
//         } finally {
//           set({ isLoggingIn: false });
//         }
//       },
//       logout: async () => {
//         try {
//           await API.post("/auth/logout");
//           set({ user: null });
//           useSocket.getState().disconnectSocket();
//           toast.success("Logout successfully");
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Register failed");
//         }
//       },
//       isAuthStatus: async () => {
//         set({ isAuthStatusLoading: true });
//         try {
//           const response = await API.get("/auth/status");
//           set({ user: response.data.user });
//           useSocket.getState().connectSocket();
//         } catch (err: any) {
//           toast.error(err.response?.data?.message || "Authentication failed");
//           //set({ user: null})
//         } finally {
//           set({ isAuthStatusLoading: false });
//         }
//       },
//     }),
//     {
//       name: "whop:root",
//     }
//   )
// );
