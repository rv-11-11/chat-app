import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from "expo-router";
import DrawerToggle from "../../src/components/DrawerToggle";
import "../../global.css";

const TabRoot =() => {

    return (
        <Tabs
        >
            <Tabs.Screen 
                name="index"
                options={{
                    title: "Home",
                    headerLeft: () => <DrawerToggle />,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="home" size={24} color={color} />
                    ),
                }}
            />
            
            <Tabs.Screen 
                name="chat"
                options={{
                    title: "Chats",
                    headerLeft: () => <DrawerToggle />,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="commenting" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen 
                name="community"
                options={{
                    title: "Community",
                    headerLeft: () => <DrawerToggle />,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="users" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen 
                name="group"
                options={{
                    headerLeft: () => <DrawerToggle />,
                    title: "Groups",
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="object-group" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen 
                name="channel"
                options={{
                    headerLeft: () => <DrawerToggle />,
                    title: "Channels",
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="rss" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
};

export default TabRoot;
