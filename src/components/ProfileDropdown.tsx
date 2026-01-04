import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Animated, TouchableWithoutFeedback, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useThemeColors } from '../utils/theme';
import { useAuthStore } from '../store/authStore';
import { Avatar } from './Avatar';

const ProfileDropdown = () => {
  const colors = useThemeColors();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [visible, setVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const toggleDropdown = () => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 0.9, duration: 200, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    } else {
      setVisible(true);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  };

  const handleLogout = async () => {
    setVisible(false);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleProfile = () => {
    setVisible(false);
    router.push('/(drawer)/myProfile');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={toggleDropdown} style={styles.profileButton}>
        <Avatar size={32} source={user?.avatar} name={user?.name} />
      </TouchableOpacity>

      <Modal transparent visible={visible} onRequestClose={toggleDropdown}>
        <TouchableWithoutFeedback onPress={toggleDropdown}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View 
                style={[
                  styles.dropdown, 
                  { 
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: fadeAnim,
                    transform: [{ scale: scaleAnim }]
                  }
                ]}
              >
                <View style={[styles.header, { borderBottomColor: colors.border }]}>
                  <Avatar size={48} source={user?.avatar} name={user?.name} />
                  <View style={styles.userInfo}>
                    <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'User'}</Text>
                    <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email || 'user@example.com'}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.menuItem} onPress={handleProfile}>
                  <Ionicons name="person-outline" size={20} color={colors.foreground} style={styles.menuIcon} />
                  <Text style={[styles.menuText, { color: colors.foreground }]}>My Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                  <Ionicons name="log-out-outline" size={20} color={colors.destructive} style={styles.menuIcon} />
                  <Text style={[styles.menuText, { color: colors.destructive }]}>Logout</Text>
                </TouchableOpacity>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginRight: 16,
    zIndex: 1000,
  },
  profileButton: {
    padding: 2,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  dropdown: {
    position: 'absolute',
    right: 16,
    width: 280,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  userEmail: {
    fontSize: 12,
    marginTop: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

export default ProfileDropdown;
