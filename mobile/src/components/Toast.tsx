import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { colors } from '../theme/colors';

interface ToastProps {
  visible: boolean;
  title: string;
  message: string;
  type?: 'success' | 'info';
  onHide: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  visible,
  title,
  message,
  type = 'success',
  onHide,
}) => {
  const translateY = React.useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 20,
        duration: 250,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        Animated.timing(translateY, {
          toValue: -100,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 3200);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  if (!visible) return null;

  const isSuccess = type === 'success';

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }] }]}>
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isSuccess ? 'rgba(16, 185, 129, 0.2)' : 'rgba(56, 189, 248, 0.2)' },
        ]}
      >
        {isSuccess ? (
          <CheckCircle2 size={18} color={colors.status.safeText} />
        ) : (
          <AlertCircle size={18} color="#38bdf8" />
        )}
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 30,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  message: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 1,
  },
});
