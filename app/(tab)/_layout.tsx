import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from "expo-router";
import DrawerToggle from "../../src/components/DrawerToggle";
import "../../global.css";
import { View } from 'react-native';

import { useThemeColors } from '../../src/utils/theme';
import NotificationDropdown from '../../src/components/NotificationDropdown';
import ProfileDropdown from '../../src/components/ProfileDropdown';

const TabRoot = () => {
    const colors = useThemeColors();

    return (
        <Tabs
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background,
                    elevation: 0, // Remove shadow on Android
                    shadowOpacity: 0, // Remove shadow on iOS
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                },
                headerTitleStyle: {
                    fontWeight: 'bold',
                    fontSize: 20,
                    color: colors.foreground,
                },
                tabBarStyle: {
                    backgroundColor: '#0f172a', // Dark background for footer
                    borderTopColor: '#1e293b',
                    height: 95, // Increased height for better visibility
                    paddingBottom: 30, // Adjusted padding
                    paddingTop: 10,
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    elevation: 0,
                    borderTopWidth: 1,
                },
                tabBarActiveTintColor: '#8b5cf6', // Primary color
                tabBarInactiveTintColor: '#64748b', // Muted color
                tabBarShowLabel: true,
                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                    marginBottom: 4,
                },
            }}
        >
            <Tabs.Screen 
                name="index"
                options={{
                    title: "Home",
                    headerLeft: () => (
                        <View style={{ marginLeft: 16 }}>
                            <DrawerToggle />
                        </View>
                    ),
                    headerRight: () => (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <NotificationDropdown />
                            <ProfileDropdown />
                        </View>
                    ),
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="home-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen 
                name="chat"
                options={{
                    title: "Chats",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="chatbubbles-outline" size={24} color={color} />
                    ),
                }}
            />

            

            <Tabs.Screen 
                name="group"
                options={{
                    title: "Groups",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="people-outline" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen 
                name="channel"
                options={{
                    title: "Channels",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="megaphone-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen 
                name="community"
                options={{
                    title: "Community",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <Ionicons name="planet-outline" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
};

export default TabRoot;
