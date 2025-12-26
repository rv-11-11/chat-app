import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  Pressable,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import { useThemeStore } from '../store/themeStore';
import { useThemeColors } from '../utils/theme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Avatar } from './Avatar';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const menuItems: MenuItem[] = [
  { icon: 'user', label: 'My Profile', route: '/(drawer)/myProfile' },
  { icon: 'plus-circle', label: 'New Group', route: '/(drawer)/newGroup' },
  { icon: 'cog', label: 'Settings', route: '/(drawer)/setting' },
  { icon: 'user-plus', label: 'Invite Friends', route: '/(drawer)/inviteFriend' },
  { icon: 'globe', label: 'Website Features', route: '/(drawer)/webSiteFeature' },
  { icon: 'file-text', label: 'Terms & Privacy', route: '/(drawer)/terms' },
];

export default function CustomDrawerContent(props: any) {
  const { user, logout } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const { theme, setTheme } = useThemeStore();
  const colors = useThemeColors();
  const router = useRouter();
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const isOnline = user?._id ? onlineUsers.includes(user._id) : false;

  const handleLogout = async () => {
    setShowLogoutModal(false);
    try {
      await logout();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleTheme = () => {
    // Cycle through themes: light -> dark -> cupcake -> forest -> light
    const themes: Array<'light' | 'dark' | 'cupcake' | 'forest'> = ['light', 'dark', 'cupcake', 'forest'];
    const currentIndex = themes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const handleMenuItemPress = (route: string) => {
    router.push(route as any);
    props.navigation.closeDrawer();
  };

  // Use theme colors from store
  const sidebarBg = colors.sidebar;
  const sidebarForeground = colors.sidebarForeground;
  const sidebarBorder = colors.sidebarBorder;
  const sidebarAccent = colors.sidebarAccent;

  return (
    <View style={[styles.container, { backgroundColor: sidebarBg }]}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Profile Section */}
        <View style={[styles.profileSection, { borderBottomColor: sidebarBorder }]}>
          <Pressable
            onPress={() => setShowLogoutModal(true)}
            style={styles.profilePressable}
          >
            <View style={styles.avatarContainer}>
              <Avatar
                key={user?.avatar} // Force re-render on avatar change
                uri={user?.avatar}
                name={user?.name || 'U'}
                size={50}
                isOnline={isOnline}
                showStatus={true}
                showLoading={true}
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: sidebarForeground }]} numberOfLines={1}>
                {user?.name || 'Unknown'}
              </Text>
              <Text style={[styles.profileEmail, { color: sidebarForeground + 'B3' }]} numberOfLines={1}>
                {user?.email || '+91 XXXX XXXXX'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => {
            const isActive = pathname === item.route;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.menuItem,
                  isActive && { backgroundColor: sidebarAccent },
                ]}
                onPress={() => handleMenuItemPress(item.route)}
                activeOpacity={0.7}
              >
                <FontAwesome
                  name={item.icon as any}
                  size={24}
                  color={isActive ? sidebarForeground : sidebarForeground + 'CC'}
                  style={styles.menuIcon}
                />
                <Text
                  style={[
                    styles.menuLabel,
                    { color: isActive ? sidebarForeground : sidebarForeground + 'CC' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Theme Toggle */}
      <View style={[styles.themeSection, { borderTopColor: sidebarBorder }]}>
        <Text style={[styles.themeLabel, { color: sidebarForeground + 'B3' }]}>
          Theme
        </Text>
        <TouchableOpacity
          style={[
            styles.themeButton,
            {
              backgroundColor: sidebarAccent,
              borderColor: sidebarBorder,
            },
          ]}
          onPress={toggleTheme}
          activeOpacity={0.7}
        >
          <FontAwesome name="tint" size={18} color={sidebarForeground} />
        </TouchableOpacity>
      </View>

      {/* Logout Modal */}
      <Modal
        visible={showLogoutModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowLogoutModal(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to logout?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonLogout]}
                onPress={handleLogout}
              >
                <Text style={styles.modalButtonLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: 320, // w-80 = 320px
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  profileSection: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  profilePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileInfo: {
    flex: 1,
    minWidth: 0,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  menuContainer: {
    flex: 1,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  menuIcon: {
    width: 24,
    height: 24,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  themeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  themeLabel: {
    fontSize: 14,
  },
  themeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalButtonCancel: {
    backgroundColor: '#f0f0f0',
  },
  modalButtonCancelText: {
    color: '#666',
    fontWeight: '500',
  },
  modalButtonLogout: {
    backgroundColor: '#dc2626',
  },
  modalButtonLogoutText: {
    color: '#fff',
    fontWeight: '600',
  },
});

