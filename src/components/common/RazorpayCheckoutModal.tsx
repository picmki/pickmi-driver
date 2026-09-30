import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme/colors';
import { playOnlineSound } from '../../utils/soundEffects';

interface RazorpayCheckoutModalProps {
  visible: boolean;
  amount?: number;
  title?: string;
  description?: string;
  driverName?: string;
  driverMobile?: string;
  driverEmail?: string;
  onSuccess: (paymentId: string) => void;
  onClose: () => void;
}

function getRazorpayCheckoutHtml(params: {
  keyId: string;
  amount: number;
  title: string;
  description: string;
  driverName: string;
  driverMobile: string;
  driverEmail: string;
}) {
  const amountInPaise = Math.round(params.amount * 100);
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Razorpay Checkout</title>
  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body {
      background: #0C2340;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #FFFFFF;
      overflow: hidden;
    }
    .loader-box {
      text-align: center;
      padding: 24px;
    }
    .spinner {
      border: 3px solid rgba(255, 255, 255, 0.15);
      border-top: 3px solid #3395FF;
      border-radius: 50%;
      width: 46px;
      height: 46px;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .title { font-size: 17px; font-weight: 700; margin-bottom: 6px; }
    .subtitle { font-size: 13px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="loader-box">
    <div class="spinner"></div>
    <div class="title">Connecting directly to Razorpay...</div>
    <div class="subtitle">Opening UPI, Cards & NetBanking checkout</div>
  </div>
  <script>
    window.onload = function() {
      var options = {
        key: "${params.keyId}",
        amount: "${amountInPaise}",
        currency: "INR",
        name: "${params.title.replace(/"/g, '\\"')}",
        description: "${params.description.replace(/"/g, '\\"')}",
        prefill: {
          name: "${params.driverName.replace(/"/g, '\\"')}",
          contact: "${params.driverMobile.replace(/"/g, '\\"')}",
          email: "${params.driverEmail.replace(/"/g, '\\"')}"
        },
        theme: { color: "#0043DC" },
        modal: {
          backdropclose: false,
          escape: false,
          handleback: true,
          confirm_close: true,
          ondismiss: function() {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ event: 'DISMISS' }));
            }
          }
        },
        handler: function(response) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'SUCCESS',
              paymentId: response.razorpay_payment_id,
              orderId: response.razorpay_order_id,
              signature: response.razorpay_signature
            }));
          }
        }
      };
      try {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function(resp) {
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              event: 'FAILED',
              description: (resp.error && resp.error.description) || 'Payment Failed'
            }));
          }
        });
        rzp.open();
      } catch (err) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            event: 'ERROR',
            message: err.message
          }));
        }
      }
    };
  </script>
</body>
</html>`;
}

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  amount = 250,
  title = 'PickMi Driver Security Deposit',
  description = '1-Year Mandatory Partner Security Deposit',
  driverName = 'PickMi Driver',
  driverMobile = '+91 98765 43210',
  driverEmail = 'driver@pickmi.com',
  onSuccess,
  onClose,
}) => {
  const [paymentSuccessId, setPaymentSuccessId] = useState<string | null>(null);
  const liveKeyId = (process.env.EXPO_PUBLIC_RAZORPAY_KEY_ID || 'rzp_live_Tbvz9tjiGE4r0y').trim();

  // On Web: Trigger Razorpay JS checkout directly when visible becomes true
  useEffect(() => {
    if (!visible || Platform.OS !== 'web') return;

    let isMounted = true;

    const openWebRazorpay = async () => {
      try {
        if (!(window as any).Razorpay) {
          await new Promise<void>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Razorpay SDK'));
            document.body.appendChild(script);
          });
        }

        const rzp = new (window as any).Razorpay({
          key: liveKeyId,
          amount: Math.round(amount * 100),
          currency: 'INR',
          name: title,
          description,
          prefill: {
            name: driverName,
            contact: driverMobile,
            email: driverEmail,
          },
          theme: { color: '#0043DC' },
          modal: {
            ondismiss: () => {
              if (isMounted) onClose();
            },
          },
          handler: (response: any) => {
            if (!isMounted) return;
            const paymentId = response.razorpay_payment_id;
            setPaymentSuccessId(paymentId);
            playOnlineSound();
            setTimeout(() => {
              onSuccess(paymentId);
            }, 1000);
          },
        });

        rzp.on('payment.failed', (resp: any) => {
          Alert.alert('Payment Failed', resp?.error?.description || 'Payment was not completed.');
        });

        rzp.open();
      } catch (err: any) {
        console.warn('Razorpay web checkout error:', err);
        Alert.alert('Razorpay Error', err?.message || 'Could not launch Razorpay checkout');
        onClose();
      }
    };

    openWebRazorpay();

    return () => {
      isMounted = false;
    };
  }, [visible]);

  // Handle postMessage events from native WebView
  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.event === 'SUCCESS' && data.paymentId) {
        setPaymentSuccessId(data.paymentId);
        playOnlineSound();
        setTimeout(() => {
          setPaymentSuccessId(null);
          onSuccess(data.paymentId);
        }, 1200);
      } else if (data.event === 'DISMISS') {
        onClose();
      } else if (data.event === 'FAILED' || data.event === 'ERROR') {
        Alert.alert('Payment Failed', data.description || data.message || 'Razorpay payment was not completed.');
        onClose();
      }
    } catch (e) {
      console.warn('Razorpay WebView message error:', e);
    }
  };

  if (!visible) return null;

  // On Web, Razorpay popup is mounted to DOM, so modal is just a backdrop
  if (Platform.OS === 'web') {
    if (paymentSuccessId) {
      return (
        <Modal visible={true} transparent animationType="fade">
          <View style={styles.successBackdrop}>
            <View style={styles.successCard}>
              <View style={styles.successCircle}>
                <Ionicons name="checkmark" size={38} color="#FFFFFF" />
              </View>
              <Text style={styles.successTitle}>Payment Successful!</Text>
              <Text style={styles.successSubtitle}>Razorpay Ref: {paymentSuccessId}</Text>
            </View>
          </View>
        </Modal>
      );
    }
    return null;
  }

  // On Mobile (iOS / Android): Full Screen Razorpay Direct Gateway
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.safeContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#0C2340" />

        {/* Razorpay Top Navigation Bar */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.rzpBadge}>
              <Text style={styles.rzpBadgeText}>Razorpay</Text>
            </View>
            <View style={styles.secureTag}>
              <Ionicons name="lock-closed" size={12} color="#10B981" />
              <Text style={styles.secureTagText}>Official Gateway</Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.amountDisplay}>₹{amount.toFixed(2)}</Text>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Direct Razorpay Checkout View */}
        {paymentSuccessId ? (
          <View style={styles.successContainer}>
            <View style={styles.successCircle}>
              <Ionicons name="checkmark" size={48} color="#FFFFFF" />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successSubtitle}>Ref: {paymentSuccessId}</Text>
            <Text style={styles.successHint}>Unlocking security deposit...</Text>
          </View>
        ) : (
          <View style={styles.webViewWrapper}>
            <WebView
              originWhitelist={['*']}
              source={{
                html: getRazorpayCheckoutHtml({
                  keyId: liveKeyId,
                  amount,
                  title,
                  description,
                  driverName,
                  driverMobile,
                  driverEmail,
                }),
                baseUrl: 'https://checkout.razorpay.com',
              }}
              onMessage={handleWebViewMessage}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3395FF" />
                  <Text style={styles.loadingText}>Opening Razorpay Checkout…</Text>
                </View>
              )}
              style={styles.webView}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#0C2340',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#0C2340',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rzpBadge: {
    backgroundColor: '#3395FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rzpBadgeText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  secureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  secureTagText: {
    color: '#10B981',
    fontSize: 11,
    fontWeight: '700',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  amountDisplay: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: '#0C2340',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0C2340',
    gap: 12,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  successSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 8,
  },
  successHint: {
    fontSize: 13,
    color: '#34D399',
    fontWeight: '600',
  },
  // Web success backdrop
  successBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: '#0C2340',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
});
