import { StyleSheet, Text, View } from 'react-native';
import "../../global.css";
import { useThemeColors } from '../../src/utils/theme';

const Community = () => {
  const colors = useThemeColors();
  const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }, title: { fontSize: 22, fontWeight: '700', color: colors.foreground } });
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Community Screen</Text>
    </View>
  );
}
export default Community;