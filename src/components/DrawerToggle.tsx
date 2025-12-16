import { TouchableOpacity } from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useSidebarStore } from '../store/sidebarStore';

export default function DrawerToggle() {
  const { openSidebar } = useSidebarStore();

  return (
    <TouchableOpacity onPress={openSidebar} className="ml-4">
      <FontAwesome name="bars" size={24} color="#007AFF" />
    </TouchableOpacity>
  );
}

