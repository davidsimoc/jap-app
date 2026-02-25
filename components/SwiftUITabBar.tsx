import React, { useCallback, useMemo, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, {
    useAnimatedStyle,
    withSpring,
    useSharedValue,
    withTiming,
    runOnJS,
    useDerivedValue,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_MARGIN = 20;
const TAB_BAR_WIDTH = SCREEN_WIDTH - (BAR_MARGIN * 2);

const TAB_ITEMS = [
    { id: 0, name: 'Home', route: 'home', icon: 'home-outline', iconActive: 'home' },
    { id: 1, name: 'Kana', route: 'kanji/kana', icon: 'book-outline', iconActive: 'book' },
    { id: 2, name: 'Chat', route: 'chatbot', icon: 'chatbox-outline', iconActive: 'chatbox' },
    { id: 3, name: 'Profile', route: 'profile', icon: 'person-outline', iconActive: 'person' },
];

const TAB_WIDTH = TAB_BAR_WIDTH / TAB_ITEMS.length;

export default function SwiftUITabBarWrapper({ state, navigation }: any) {
    const router = useRouter();
    const { theme } = useTheme();
    const insets = useSafeAreaInsets();
    const currentTheme = theme === 'light' ? lightTheme : darkTheme;
    const isDark = theme === 'dark';

    const currentRoute = state.routes[state.index].name;

    // --- PASUL A: GARDERIANUL DE RUTE ---
    const isTabRoute = TAB_ITEMS.some(item => currentRoute.includes(item.route));
    if (!isTabRoute) return null;

    const activeIndex = useMemo(() => {
        const idx = TAB_ITEMS.findIndex(item => currentRoute.includes(item.route));
        return idx === -1 ? state.index : idx;
    }, [currentRoute, state.index]);

    const translateX = useSharedValue(activeIndex * TAB_WIDTH);
    const contextX = useSharedValue(0);
    const bubbleScaleX = useSharedValue(1);
    const bubbleScaleY = useSharedValue(1);

    const derivedActiveIndex = useDerivedValue(() => {
        return Math.round(translateX.value / TAB_WIDTH);
    });

    useEffect(() => {
        translateX.value = withSpring(activeIndex * TAB_WIDTH, { damping: 25, stiffness: 90, mass: 1 });
    }, [activeIndex]);

    const navigateToTab = (id: number) => {
        router.navigate(TAB_ITEMS[id].route as any);
    };

    const panGesture = Gesture.Pan()
        .onStart(() => {
            contextX.value = translateX.value;
        })
        .onUpdate((event) => {
            const newPos = contextX.value + event.translationX;
            translateX.value = Math.max(0, Math.min(newPos, TAB_BAR_WIDTH - TAB_WIDTH));
            bubbleScaleX.value = 1 + Math.abs(event.velocityX) / 2500;
            bubbleScaleY.value = 1 - Math.abs(event.velocityX) / 5000;
        })
        .onEnd(() => {
            const nearestTab = Math.round(translateX.value / TAB_WIDTH);
            translateX.value = withSpring(nearestTab * TAB_WIDTH, { damping: 12, stiffness: 100 });
            bubbleScaleX.value = withSpring(1);
            bubbleScaleY.value = withSpring(1);
            runOnJS(navigateToTab)(nearestTab);
        });

    const animatedBubbleStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: translateX.value },
            { scaleX: bubbleScaleX.value },
            { scaleY: bubbleScaleY.value }
        ],
    }));

    return (
        <GestureHandlerRootView style={[styles.container, { bottom: Platform.OS === 'ios' ? Math.max(10, insets.bottom - 15) : 20 }]}>
            <GestureDetector gesture={panGesture}>
                <Animated.View style={{ flex: 1 }}>
                    <BlurView
                        intensity={isDark ? 85 : 95}
                        tint={isDark ? 'dark' : 'light'}
                        style={styles.blurContainer}
                    >
                        <Animated.View
                            style={[
                                styles.selector,
                                {
                                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.08)',
                                    borderColor: isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.1)',
                                },
                                animatedBubbleStyle
                            ]}
                        />

                        <View style={styles.tabContent}>
                            {TAB_ITEMS.map((item) => (
                                <TabItem
                                    key={item.id}
                                    item={item}
                                    id={item.id}
                                    derivedActiveIndex={derivedActiveIndex}
                                    onPress={() => navigateToTab(item.id)}
                                    isDark={isDark}
                                    accentColor={currentTheme.primary}
                                    realActiveIndex={activeIndex}
                                />
                            ))}
                        </View>
                    </BlurView>
                </Animated.View>
            </GestureDetector>
        </GestureHandlerRootView>
    );
}

function TabItem({ item, id, derivedActiveIndex, onPress, isDark, accentColor }: any) {

    const animatedIconContainerStyle = useAnimatedStyle(() => {
        const isSelected = derivedActiveIndex.value === id;
        return {
            opacity: withTiming(isSelected ? 1 : 0.4, { duration: 150 }),
        };
    });

    const animatedTextStyle = useAnimatedStyle(() => {
        const isSelected = derivedActiveIndex.value === id;
        return {
            color: isSelected
                ? (isDark ? '#fff' : accentColor)
                : (isDark ? 'rgba(255,255,255,0.4)' : '#888'),
        };
    });

    return (
        <TouchableOpacity onPress={onPress} style={styles.tabItem} activeOpacity={1}>
            <Animated.View style={[animatedIconContainerStyle, { alignItems: 'center' }]}>
                <View style={styles.iconStack}>
                    <Animated.View style={useAnimatedStyle(() => ({
                        opacity: withTiming(derivedActiveIndex.value === id ? 1 : 0, { duration: 100 })
                    }))}>
                        <Ionicons name={item.iconActive as any} size={23} color={isDark ? '#fff' : '#000'} />
                    </Animated.View>

                    <Animated.View style={[StyleSheet.absoluteFill, useAnimatedStyle(() => ({
                        opacity: withTiming(derivedActiveIndex.value === id ? 0 : 1, { duration: 100 })
                    }))]}>
                        <Ionicons name={item.icon as any} size={23} color={isDark ? '#fff' : '#000'} />
                    </Animated.View>
                </View>

                <Animated.Text style={[styles.tabLabel, animatedTextStyle]}>
                    {item.name}
                </Animated.Text>
            </Animated.View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        left: BAR_MARGIN,
        right: BAR_MARGIN,
        height: 72,
        borderRadius: 36,
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.1,
        shadowRadius: 25,
    },
    blurContainer: { flex: 1, flexDirection: 'row', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)', borderRadius: 36 },
    selector: { position: 'absolute', top: 6, left: 6, width: TAB_WIDTH - 12, height: 60, borderRadius: 30, borderWidth: 0.5 },
    tabContent: { flex: 1, flexDirection: 'row', alignItems: 'center', zIndex: 1 },
    tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%' },
    tabLabel: { fontSize: 10, fontWeight: 'bold', marginTop: 4, letterSpacing: 0.2 },
    iconStack: { width: 23, height: 23, justifyContent: 'center', alignItems: 'center' }
});