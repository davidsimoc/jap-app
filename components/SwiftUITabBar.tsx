import { Host, HStack, GlassEffectContainer, Image, Text, Button, VStack } from '@expo/ui/swift-ui';
import { padding, glassEffect, animation, Animation, glassEffectId, background, cornerRadius, frame, scaleEffect } from '@expo/ui/swift-ui/modifiers';import { useTheme } from '@/components/ThemeContext';
import { lightTheme, darkTheme } from '@/constants/Colors';
import { useRouter } from 'expo-router';
import { View, StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

const TAB_ITEMS = [
    { name: 'Home', route: 'home', icon: 'home-fill' },
    { name: 'Kana', route: 'kanji/kana', icon: 'book.fill' },
    { name: 'Chatbot', route: 'chatbot', icon: 'message.fill' },
    { name: 'Profile', route: 'profile', icon: 'person.fill' },
];

interface SwiftUITabBarProps {
    currentRoute: string;
}

function SwiftUITabBarContent({ currentRoute }: SwiftUITabBarProps) {
    const router = useRouter();
    const { theme } = useTheme();

    const scheme = theme === 'light' ? 'light' : 'dark';

    const handlePress = (route: string) => {
        router.navigate(route as any);
    };

    return (
        <Host style={styles.hostContainer} colorScheme={scheme}>
            <GlassEffectContainer 
                spacing={0}
                modifiers={[
                    padding({horizontal: 20, vertical: 10}),
                    cornerRadius(15),
                    glassEffect({
                        glass: {
                            variant: 'clear'
                        }
                    })
                ]}
            >
                <HStack spacing={30} modifiers={[frame({ maxHeight: 40 })]}>
                    {TAB_ITEMS.map((item, index) => {
                        const isSelected = currentRoute.includes(item.route);
                        const accentColor = isSelected ? 'blue' : (scheme === 'dark' ? 'white' : 'black');
                        
                        return (
                            // Button SwiftUI
                            <Button
                                key={index}
                                onPress={() => handlePress(item.route)}
                                modifiers={[
                                    frame({ minWidth: 40, minHeight: 40 }),
                                    scaleEffect({ 
                                        scale: isSelected ? 1.1 : 1.0,
                                        pressScale: 0.95, 
                                    } as any),
                                    animation(Animation.spring({ duration: 0.3 }), isSelected)
                                ]} // Butonul ocupă spațiul
                            >
                                <VStack spacing={4}>
                                    {/* Image SwiftUI cu iconiță SF Symbols */}
                                    <Image
                                        systemName={item.icon as any}
                                        size={20}
                                        modifiers={[frame({ width: 20, height: 20 }), glassEffect({ glass: { variant: 'clear' } })]}
                                        color={accentColor}
                                    />
                                    {/* Text SwiftUI */}
                                    <Text color={accentColor}
                                    >{item.name}</Text>
                                </VStack>
                            </Button>
                        );
                    })}
                </HStack> 
            </GlassEffectContainer>
        </Host>
    );
}

export default function SwiftUITabBarWrapper({ state }: any) {
    // Extrage numele rutei curente pentru a determina ce tab este activ
    const currentRoute = state.routes[state.index].name;

    return (
        <View style={styles.nativeContainer}>
            <SwiftUITabBarContent currentRoute={currentRoute} />
        </View>
    );
}

const styles = StyleSheet.create({
    nativeContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    hostContainer: {
        width: '90%', 
        height: 70, 
    },
});