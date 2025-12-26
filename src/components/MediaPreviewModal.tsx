import React, { useState } from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Text, TextInput, ActivityIndicator, Platform, KeyboardAvoidingView } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors } from '../utils/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SmartImage } from './SmartImage';

interface MediaPreviewModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (caption: string) => void;
  media: {
    type: 'image' | 'video';
    uri: string;
    mimeType?: string; // Optional, useful for video
  } | null;
  isSending?: boolean;
}

export default function MediaPreviewModal({ visible, onClose, onSend, media, isSending }: MediaPreviewModalProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState('');

  if (!media) return null;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#000',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingTop: insets.top + 10,
      zIndex: 10,
    },
    closeButton: {
      padding: 8,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    media: {
      width: '100%',
      height: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: 16,
      paddingVertical: 12,
      paddingBottom: Platform.OS === 'ios' ? insets.bottom + 10 : 20,
      backgroundColor: 'rgba(0,0,0,0.8)',
      gap: 12,
    },
    input: {
      flex: 1,
      minHeight: 40,
      maxHeight: 100,
      backgroundColor: '#333',
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 10,
      color: '#fff',
      fontSize: 16,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: '#555',
    },
  });

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.contentContainer}>
          {media.type === 'image' ? (
            <SmartImage 
              source={media.uri} 
              style={styles.media} 
              contentFit="contain" 
            />
          ) : (
            <Video
              source={{ uri: media.uri }}
              style={styles.media}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />
          )}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a caption..."
            placeholderTextColor="#aaa"
            value={caption}
            onChangeText={setCaption}
            multiline
            maxLength={1000}
            editable={!isSending}
          />
          <TouchableOpacity 
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]} 
            onPress={() => onSend(caption)}
            disabled={isSending}
          >
            {isSending ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
