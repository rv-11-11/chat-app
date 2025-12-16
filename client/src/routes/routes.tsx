import SignIn from "@/pages/auth/sign-in";
import SignUp from "@/pages/auth/sign-up";
import Chat from "@/pages/chat";
import SingleChat from "@/pages/chat/chatId";
import Home from "@/pages/home";
import Channel from "@/pages/channel";
import SingleChannel from "@/pages/channel/channelId";
import Community from "@/pages/community";
import SingleCommunity from "@/pages/community/communityId";
import Groups from "@/pages/groups";
import SingleGroup from "@/pages/groups/groupId";
import Profile from "@/pages/profile";
import Settings from "@/pages/settings";
import InvitePage from "@/pages/invite";
import FeaturesPage from "@/pages/features";
import LegalPage from "@/pages/legal";

export const AUTH_ROUTES = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
};

export const PROTECTED_ROUTES = {
  HOME: "/",
  CHAT: "/chat",
  SINGLE_CHAT: "/chat/:chatId",
  CHANNEL: "/channel",
  SINGLE_CHANNEL: "/channel/:channelId",
  COMMUNITY: "/community",
  SINGLE_COMMUNITY: "/community/:communityId",
  GROUPS: "/groups",
  SINGLE_GROUP: "/groups/:groupId",
  PROFILE: "/profile",
  SETTINGS: "/settings",
  INVITE: "/invite",
  ACCEPT_INVITE: "/accept-invite",
  JOIN: "/join/:username",
  FEATURES: "/features",
  LEGAL: "/legal",
};

export const authRoutesPaths = [
  {
    path: AUTH_ROUTES.SIGN_IN,
    element: <SignIn />,
  },
  {
    path: AUTH_ROUTES.SIGN_UP,
    element: <SignUp />,
  },
];

export const protectedRoutesPaths = [
  {
    path: PROTECTED_ROUTES.HOME,
    element: <Home />,
  },
  {
    path: PROTECTED_ROUTES.CHAT,
    element: <Chat />,
  },
  {
    path: PROTECTED_ROUTES.SINGLE_CHAT,
    element: <SingleChat />,
  },
  {
    path: PROTECTED_ROUTES.CHANNEL,
    element: <Channel />,
  },
  {
    path: PROTECTED_ROUTES.SINGLE_CHANNEL,
    element: <SingleChannel />,
  },
  {
    path: PROTECTED_ROUTES.COMMUNITY,
    element: <Community />,
  },
  {
    path: PROTECTED_ROUTES.SINGLE_COMMUNITY,
    element: <SingleCommunity />,
  },
  {
    path: PROTECTED_ROUTES.GROUPS,
    element: <Groups />,
  },
  {
    path: PROTECTED_ROUTES.SINGLE_GROUP,
    element: <SingleGroup />,
  },
  {
    path: PROTECTED_ROUTES.PROFILE,
    element: <Profile />,
  },
  {
    path: PROTECTED_ROUTES.INVITE,
    element: <InvitePage />,
  },
  {
    path: PROTECTED_ROUTES.FEATURES,
    element: <FeaturesPage />,
  },
  {
    path: PROTECTED_ROUTES.LEGAL,
    element: <LegalPage />,
  },
  {
    path: PROTECTED_ROUTES.SETTINGS,
    element: <Settings />,
  },
];

export const isAuthRoute = (pathname: string) => {
  return Object.values(AUTH_ROUTES).includes(pathname);
};
