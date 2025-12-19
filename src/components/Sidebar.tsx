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
import { useAuthStore } from '../store/authStore';
import { useSocketStore } from '../store/socketStore';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
}

const menuItems: MenuItem[] = [
  { icon: 'user', label: 'My Profile', route: '/(drawer)/myProfile' },
  { icon: 'cog', label: 'Settings', route: '/(drawer)/setting' },
  { icon: 'user-plus', label: 'Invite Friends', route: '/(drawer)/inviteFriend' },
  { icon: 'globe', label: 'Website Features', route: '/(drawer)/webSiteFeature' },
  { icon: 'file-text', label: 'Terms & Privacy', route: '/(drawer)/terms' },
];

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
}

export default function Sidebar({ visible, onClose }: SidebarProps) {
  const { user, logout } = useAuthStore();
  const { onlineUsers } = useSocketStore();
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(colorScheme === 'dark');
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setIsDark(savedTheme === 'dark');
        }
      } catch (error) {
        console.error('Failed to load theme:', error);
      }
    };
    loadTheme();
  }, []);

  const isOnline = user?._id ? onlineUsers.includes(user._id) : false;

  const handleLogout = async () => {
    setShowLogoutModal(false);
    onClose();
    try {
      await logout();
      router.replace('/(auth)/sign-in');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleTheme = async () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    await AsyncStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleMenuItemPress = (route: string) => {
    router.push(route as any);
    onClose();
  };

  // Sidebar colors matching web app exactly
  const sidebarBg = isDark ? '#2a2a2a' : '#fafafa';
  const sidebarForeground = isDark ? '#fafafa' : '#1a1a1a';
  const sidebarBorder = isDark ? 'rgba(255, 255, 255, 0.1)' : '#e8e8e8';
  const sidebarAccent = isDark ? '#3a3a3a' : '#f5f5f5';

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        transparent={true}
        onRequestClose={onClose}
      >
        <Pressable style={styles.overlay} onPress={onClose}>
          <Pressable
            style={[styles.sidebar, { backgroundColor: sidebarBg }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.closeButtonContainer}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <FontAwesome name="times" size={20} color={sidebarForeground} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >

              {/* User Profile Section */}
              <Pressable
                onPress={() => setShowLogoutModal(true)}
                style={[styles.profileSection, { borderBottomColor: sidebarBorder }]}
              >
                <View style={styles.profilePressable}>
                  <View style={styles.avatarContainer}>
                    <View style={[styles.avatar, { backgroundColor: '#60a5fa' }]}>
                      <Text style={styles.avatarText}>
                        {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                      </Text>
                    </View>
                    {isOnline && <View style={styles.onlineBadge} />}
                  </View>
                  <View style={styles.profileInfo}>
                    <Text style={[styles.profileName, { color: sidebarForeground }]} numberOfLines={1}>
                      {user?.name || 'Unknown'}
                    </Text>
                    <Text style={[styles.profileEmail, { color: sidebarForeground + 'B3' }]} numberOfLines={1}>
                      {user?.email || '+91 XXXX XXXXX'}
                    </Text>
                  </View>
                </View>
              </Pressable>

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
            </ScrollView>

            {/* Theme Toggle */}
            <View style={[styles.themeSection, { borderTopColor: sidebarBorder, backgroundColor: sidebarBg }]}>
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
                {isDark ? (
                  <FontAwesome name="moon-o" size={18} color={sidebarForeground} />
                ) : (
                  <FontAwesome name="sun-o" size={18} color={sidebarForeground} />
                )}
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    flexDirection: 'row',
  },
  sidebar: {
    width: 320,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  closeButtonContainer: {
    alignItems: 'flex-end',
    paddingTop: 16,
    paddingRight: 16,
    paddingBottom: 8,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
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

