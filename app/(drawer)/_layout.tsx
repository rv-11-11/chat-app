import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Drawer } from 'expo-router/drawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import CustomDrawerContent from '../../src/components/CustomDrawerContent';
import "../../global.css";

const DrawerRoot = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          drawerType: 'slide',
          drawerStyle: {
            width: 320,
          },
          overlayColor: 'rgba(0, 0, 0, 0.3)',
          headerShown: false,
          swipeEnabled: true,
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Home',
            title: 'Home',
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="(tab)"
          options={{
            drawerItemStyle: { display: 'none' },
            headerShown: false,
          }}
        />
        <Drawer.Screen
          name="myProfile"
          options={{
            drawerLabel: 'My Profile',
            title: 'My Profile',
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="user" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="newGroup"
          options={{
            drawerLabel: 'New Group',
            title: 'New Group',
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="plus-circle" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="inviteFriend"
          options={{
            drawerLabel: 'Invite Friends',
            title: 'Invite Friends',
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="user-plus" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="setting"
          options={{
            drawerLabel: 'Settings',
            title: 'Settings',
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="cog" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="webSiteFeature"
          options={{
            drawerLabel: 'Website Features',
            title: 'Website Features',
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="globe" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="terms"
          options={{
            drawerLabel: 'Terms & Privacy',
            title: 'Terms & Privacy',
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="file-text" size={size} color={color} />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
};

export default DrawerRoot;
