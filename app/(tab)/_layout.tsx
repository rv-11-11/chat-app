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
                    headerTitle: () => null,
                    headerLeft: () => <DrawerToggle />,
                    headerRight: () => null,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="home" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen 
                name="chat"
                options={{
                    title: "Chats",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="comment" size={24} color={color} />
                        
                    ),
                }}
            />

            

            <Tabs.Screen 
                name="group"
                options={{
                    title: "Groups",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="group" size={24} color={color} />
                    ),
                }}
            />

            <Tabs.Screen 
                name="channel"
                options={{
                    title: "Channels",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="bullhorn" size={24} color={color} />
                    ),
                }}
            />
            <Tabs.Screen 
                name="community"
                options={{
                    title: "Community",
                    headerShown: false,
                    tabBarIcon: ({ color }) => (
                        <FontAwesome name="globe" size={24} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
};

export default TabRoot;
