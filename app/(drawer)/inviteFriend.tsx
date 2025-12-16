import { useState } from 'react';
import { Share, Text, TextInput, TouchableOpacity, View } from 'react-native';
import "../../global.css";

export default function InviteFriendScreen() {
  const [email, setEmail] = useState('');

  const handleInvite = () => {
    console.log('Inviting:', email);
    // Add your invite logic here
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: 'Join me on ChatApp! Download the app and lets connect.',
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View className="flex-1 p-5 bg-white">
      <Text className="text-2xl font-bold mb-3">Invite Friends</Text>
      <Text className="text-base text-gray-600 mb-8">
        Invite your friends to join ChatApp and start chatting!
      </Text>

      <View className="mb-5">
        <Text className="text-base font-semibold mb-2">Email Address</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-base"
          placeholder="friend@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <TouchableOpacity className="bg-blue-500 p-4 rounded-lg items-center" onPress={handleInvite}>
        <Text className="text-white text-base font-semibold">Send Invitation</Text>
      </TouchableOpacity>

      <View className="flex-row items-center my-8">
        <View className="flex-1 h-[1px] bg-gray-300" />
        <Text className="mx-3 text-gray-600">OR</Text>
        <View className="flex-1 h-[1px] bg-gray-300" />
      </View>

      <TouchableOpacity 
        className="bg-white p-4 rounded-lg items-center border border-blue-500" 
        onPress={handleShare}
      >
        <Text className="text-blue-500 text-base font-semibold">Share Invite Link</Text>
      </TouchableOpacity>
    </View>
  );
}