import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import "../../global.css";

export default function NewGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreateGroup = () => {
    console.log('Creating group:', groupName);
    // Add your group creation logic here
  };

  return (
    <View className="flex-1 p-5 bg-white">
      <Text className="text-2xl font-bold mb-8">Create New Group</Text>
      
      <View className="mb-5">
        <Text className="text-base font-semibold mb-2">Group Name</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-base"
          placeholder="Enter group name"
          value={groupName}
          onChangeText={setGroupName}
        />
      </View>

      <View className="mb-5">
        <Text className="text-base font-semibold mb-2">Description</Text>
        <TextInput
          className="border border-gray-300 rounded-lg p-3 text-base h-24"
          placeholder="Enter group description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          style={{ textAlignVertical: 'top' }}
        />
      </View>

      <TouchableOpacity className="bg-blue-500 p-4 rounded-lg items-center mt-5" onPress={handleCreateGroup}>
        <Text className="text-white text-base font-semibold">Create Group</Text>
      </TouchableOpacity>
    </View>
  );
}