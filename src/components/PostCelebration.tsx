import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Animated, Dimensions, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

type Props = {
  category: string;
  drinkName: string;
  onDone: () => void;
};

const CATEGORY_CONFIG: Record<string, { emojis: string[]; messages: string[]; color: string; bg: string }> = {
  energy_drink: {
    emojis: ['⚡', '🔋', '💥', '⚡', '🔥', '⚡', '💥', '🔋', '⚡', '💥', '⚡', '🔋'],
    messages: ['WIRED UP ⚡', 'MAXIMUM VOLTAGE', 'FULLY CHARGED 🔋', 'ENERGY OVERLOAD', 'AMPED UP ⚡', 'UNSTOPPABLE', 'LIGHTNING MODE ⚡', 'POWER SURGE 💥'],
    color: '#00ff41',
    bg: '#0a1a0a',
  },
  protein_shake: {
    emojis: ['💪', '🏋️', '💪', '🥛', '💪', '🏆', '💪', '🥛', '💪', '🏋️', '💪', '🏆'],
    messages: ['GAINS INCOMING 💪', 'PROTEIN LOADED', 'BEAST MODE 🏋️', 'SWOLE PATROL', 'MUSCLE FUEL 💪', 'GET SHREDDED', 'PUMP IT UP 🏋️', 'RECOVERY MODE'],
    color: '#ff6b6b',
    bg: '#1a0a0a',
  },
  coffee: {
    emojis: ['☕', '🫘', '☕', '✨', '☕', '🫘', '☕', '✨', '☕', '🫘', '☕', '✨'],
    messages: ['CAFFEINATED ☕', 'BREW CREW', 'ESPRESSO YOURSELF', 'DRIP DRIP 💧', 'BEAN THERE ☕', 'LATTE LIFE', 'GRIND MODE ☕', 'SIP SIP HOORAY'],
    color: '#c4a882',
    bg: '#1a150e',
  },
  pre_workout: {
    emojis: ['🔥', '💥', '🔥', '⚡', '🔥', '💥', '🔥', '⚡', '🔥', '💥', '🔥', '⚡'],
    messages: ['LETS GOOO 🔥', 'PUMP ACTIVATED', 'NO LIMITS 💥', 'SEND IT', 'FULL SEND 🔥', 'GAME TIME', 'LOCKED IN 🎯', 'ABSOLUTE UNIT'],
    color: '#ff4444',
    bg: '#1a0505',
  },
  supplements: {
    emojis: ['🧬', '💊', '🧬', '✨', '🧬', '💊', '🧬', '✨', '🧬', '💊', '🧬', '✨'],
    messages: ['OPTIMIZED 🧬', 'SCIENCE MODE', 'LEVEL UP ✨', 'BIO-HACKED', 'STACKED UP 💊', 'DIALED IN', 'PEAK PERFORMANCE', 'NUTRIENT LOADED'],
    color: '#a78bfa',
    bg: '#0f0a1a',
  },
  electrolytes: {
    emojis: ['💧', '🌊', '💧', '💦', '💧', '🌊', '💧', '💦', '💧', '🌊', '💧', '💦'],
    messages: ['HYDRATED AF 💧', 'SPLASH ZONE 🌊', 'WATER GANG', 'REPLENISHED 💦', 'FLOW STATE 💧', 'CRISPY CLEAN', 'AQUA VITA 🌊', 'DRIP CHECK 💧'],
    color: '#60a5fa',
    bg: '#050a1a',
  },
  other: {
    emojis: ['🥤', '✨', '🥤', '🎉', '🥤', '✨', '🥤', '🎉', '🥤', '✨', '🥤', '🎉'],
    messages: ['CHECKED IN 🥤', 'REFRESHED ✨', 'SIPPIN GOOD', 'VIBES 🎉', 'THIRST QUENCHED', 'FLAVOR TOWN 🎯'],
    color: '#34d399',
    bg: '#051a10',
  },
};

type Particle = {
  emoji: string;
  x: number;
  startY: number;
  anim: Animated.Value;
  wobble: Animated.Value;
  scale: number;
  delay: number;
};

export default function PostCelebration({ category, drinkName, onDone }: Props) {
  const { colors } = useTheme();
  const config = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.other;
  const [message] = useState(() => config.messages[Math.floor(Math.random() * config.messages.length)]);
  
  // Main animations
  const fadeIn = useRef(new Animated.Value(0)).current;
  const messageScale = useRef(new Animated.Value(0.3)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const drinkOpacity = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const flashOpacity = useRef(new Animated.Value(0)).current;
  
  // Particles
  const [particles] = useState<Particle[]>(() => {
    return Array.from({ length: 16 }, (_, i) => ({
      emoji: config.emojis[i % config.emojis.length],
      x: Math.random() * (width - 40),
      startY: height + 20,
      anim: new Animated.Value(0),
      wobble: new Animated.Value(0),
      scale: 0.6 + Math.random() * 0.8,
      delay: Math.random() * 800,
    }));
  });

  useEffect(() => {
    // Screen flash
    Animated.sequence([
      Animated.timing(flashOpacity, { toValue: 0.8, duration: 100, useNativeDriver: true }),
      Animated.timing(flashOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();

    // Fade in background
    Animated.timing(fadeIn, { toValue: 1, duration: 200, useNativeDriver: true }).start();

    // Message slam in
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.spring(messageScale, { toValue: 1, friction: 4, tension: 120, useNativeDriver: true }),
        Animated.timing(messageOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();

    // Drink name fade in
    Animated.sequence([
      Animated.delay(600),
      Animated.timing(drinkOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    ).start();

    // Emoji particles floating up
    particles.forEach(p => {
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.anim, { toValue: 1, duration: 2000 + Math.random() * 1000, useNativeDriver: true }),
          Animated.loop(
            Animated.sequence([
              Animated.timing(p.wobble, { toValue: 1, duration: 300 + Math.random() * 400, useNativeDriver: true }),
              Animated.timing(p.wobble, { toValue: -1, duration: 300 + Math.random() * 400, useNativeDriver: true }),
            ])
          ),
        ]),
      ]).start();
    });

    // Auto-dismiss
    const timer = setTimeout(onDone, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Flash */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: config.color, opacity: flashOpacity, zIndex: 10 }]} />

      {/* Background */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: config.bg, opacity: fadeIn }]}>
        {/* Emoji particles */}
        {particles.map((p, i) => (
          <Animated.Text
            key={i}
            style={{
              position: 'absolute',
              left: p.x,
              fontSize: 28 * p.scale,
              opacity: p.anim.interpolate({ inputRange: [0, 0.1, 0.8, 1], outputRange: [0, 1, 1, 0] }),
              transform: [
                { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [p.startY, -80] }) },
                { translateX: p.wobble.interpolate({ inputRange: [-1, 1], outputRange: [-15, 15] }) },
              ],
            }}
          >
            {p.emoji}
          </Animated.Text>
        ))}

        {/* Center content */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
          <Animated.Text style={{
            fontSize: 32,
            fontWeight: '900',
            color: config.color,
            textAlign: 'center',
            letterSpacing: 2,
            textShadowColor: config.color,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 20,
            opacity: messageOpacity,
            transform: [{ scale: messageScale }, { scale: pulseAnim }],
          }}>
            {message}
          </Animated.Text>

          <Animated.Text style={{
            fontSize: 16,
            color: '#ffffff88',
            textAlign: 'center',
            marginTop: 16,
            fontWeight: '600',
            opacity: drinkOpacity,
          }}>
            {drinkName}
          </Animated.Text>
        </View>
      </Animated.View>
    </View>
  );
}
