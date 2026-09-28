import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

// Sound effects using native haptics only — no browser APIs
// expo-audio is used for native mobile, web falls back to Web Audio API safely

export async function playOnlineSound() {
  try {
    // Tactile haptic feedback on mobile (success double pulse)
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (Platform.OS === "web") {
      try {
        const AudioCtx =
          typeof window !== "undefined"
            ? (window as any).AudioContext || (window as any).webkitAudioContext
            : null;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") ctx.resume();
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(880, ctx.currentTime);
          gain1.gain.setValueAtTime(0.3, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.12);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(1320, ctx.currentTime + 0.1);
          gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.1);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime + 0.1);
          osc2.stop(ctx.currentTime + 0.35);
        }
      } catch (e) {}
    }
    // Native iOS/Android: haptic feedback is sufficient for this app
  } catch (err) {
    console.warn("Audio playOnlineSound error:", err);
  }
}

export async function playOfflineSound() {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (Platform.OS === "web") {
      try {
        const AudioCtx =
          typeof window !== "undefined"
            ? (window as any).AudioContext || (window as any).webkitAudioContext
            : null;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") ctx.resume();
          const osc1 = ctx.createOscillator();
          const gain1 = ctx.createGain();
          osc1.type = "sine";
          osc1.frequency.setValueAtTime(660, ctx.currentTime);
          gain1.gain.setValueAtTime(0.25, ctx.currentTime);
          gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
          osc1.connect(gain1);
          gain1.connect(ctx.destination);
          osc1.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.1);

          const osc2 = ctx.createOscillator();
          const gain2 = ctx.createGain();
          osc2.type = "sine";
          osc2.frequency.setValueAtTime(440, ctx.currentTime + 0.08);
          gain2.gain.setValueAtTime(0.2, ctx.currentTime + 0.08);
          gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
          osc2.connect(gain2);
          gain2.connect(ctx.destination);
          osc2.start(ctx.currentTime + 0.08);
          osc2.stop(ctx.currentTime + 0.28);
        }
      } catch (e) {}
    }
    // Native iOS/Android: haptic feedback is sufficient
  } catch (err) {
    console.warn("Audio playOfflineSound error:", err);
  }
}

export async function playNewTripSound() {
  try {
    // Distinct double success haptic vibration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (Platform.OS === "web") {
      try {
        const AudioCtx =
          typeof window !== "undefined"
            ? (window as any).AudioContext || (window as any).webkitAudioContext
            : null;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          if (ctx.state === "suspended") ctx.resume();

          // Harmonious 4-note chime sequence (C5, E5, G5, High C6)
          const notes = [523.25, 659.25, 783.99, 1046.5];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            const startTime = ctx.currentTime + idx * 0.09;
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, startTime);
            gain.gain.setValueAtTime(0.28, startTime);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(startTime);
            osc.stop(startTime + 0.3);
          });
        }
      } catch (e) {}
    }
  } catch (err) {
    console.warn("Audio playNewTripSound error:", err);
  }
}

