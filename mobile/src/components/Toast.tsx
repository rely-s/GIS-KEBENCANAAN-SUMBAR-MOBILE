import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { CheckCircle2, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

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
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
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
          { backgroundColor: isSuccess ? 'rgba(48, 209, 88, 0.15)' : 'rgba(10, 132, 255, 0.15)' },
        ]}
      >
        {isSuccess ? (
          <CheckCircle2 size={18} color={colors.status.safeText} />
        ) : (
          <AlertCircle size={18} color="#0A84FF" />
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

const createStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      position: 'absolute',
      top: 30,
      left: 16,
      right: 16,
      zIndex: 9999,
      backgroundColor: colors.surface.card,
      borderRadius: 14,
      padding: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderWidth: 0.5,
      borderColor: colors.surface.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.4 : 0.12,
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
      fontSize: 12.5,
      fontWeight: '600',
      color: colors.text.primary,
      marginBottom: 2,
    },
    message: {
      fontSize: 11,
      color: colors.text.secondary,
      lineHeight: 15,
    },
  });
