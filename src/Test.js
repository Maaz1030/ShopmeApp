import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  LayoutAnimation,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const dummyMessages = [
  { id: '1', text: 'Hey!', mine: false },
  { id: '2', text: 'Hi there 👋', mine: true },
  { id: '3', text: 'How are you?', mine: false },
  { id: '4', text: 'All fine, working on testing RN layouts 😄', mine: true },
];

const SimpleChatScreen = () => {
  const [messages, setMessages] = useState(dummyMessages);
  const [text, setText] = useState('');
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatRef = useRef(null);
  const insets = useSafeAreaInsets();

  /** 🔹 Detect keyboard open / close and animate */
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e => {
      LayoutAnimation.easeInEaseOut();
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      LayoutAnimation.easeInEaseOut();
      setKeyboardHeight(0);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const send = () => {
    if (!text.trim()) return;
    const newMsg = { id: Date.now().toString(), text: text.trim(), mine: true };
    setMessages(prev => [...prev, newMsg]);
    setText('');
    setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 100);
    Keyboard.dismiss();
  };

  const renderMessage = ({ item }) => (
    <View
      style={[
        styles.bubble,
        item.mine
          ? { alignSelf: 'flex-end', backgroundColor: '#4a90e2' }
          : { alignSelf: 'flex-start', backgroundColor: '#e0e0e0' },
      ]}
    >
      <Text style={{ color: item.mine ? '#fff' : '#000', fontSize: 15 }}>
        {item.text}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {/* ------- Header ------- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dummy Chat</Text>
      </View>

      {/* ------- KeyboardAvoidingView wrapper ------- */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* The list now shrinks naturally */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 10, paddingBottom: 8 }}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputContainer,
            {
              marginBottom: Platform.OS === 'android' ? keyboardHeight : 0, // 👈 dynamically fill missing space
            },
          ]}
        >
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            onSubmitEditing={send}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={send} style={styles.sendBtn}>
            <Text style={{ color: 'white', fontWeight: 'bold' }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#f2f6fa' },
  header: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4a90e2',
    alignItems: 'center',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },

  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginVertical: 4,
    maxWidth: '75%',
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderColor: '#ccc',
    padding: 6,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    backgroundColor: '#fff',
  },
  sendBtn: {
    backgroundColor: '#4a90e2',
    marginLeft: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
});

export default SimpleChatScreen;
//////////////////////////////
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  Platform,
  Keyboard, // <-- Import the Keyboard API
  Animated, // <-- Import Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import messaging from '@react-native-firebase/messaging';
import { useSelector } from 'react-redux';
import colors from '../../../utils/colors';
import { sendPushNotification } from '../../../utils/sendNotification';

const PLACEHOLDER = 'https://via.placeholder.com/100x100.png?text=User';

const ChatScreen = ({ route, navigation }) => {
  const seller = route?.params?.seller || {};
  const { darkMode, user } = useSelector(state => state.auth);
  const theme = darkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const currentUid = user?.uid || auth().currentUser?.uid;
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatRef = useRef(null);
  
  // ---------------- NEW: Keyboard Animation State ----------------
  const inputBottomOffset = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      'keyboardWillShow', // Use 'keyboardWillShow' for iOS
      e => {
        // Calculate the height needed to move the input bar up.
        // keyboardHeight - bottom safe area inset (since the safe area padding is on the input bar).
        const offset = e.endCoordinates.height - insets.bottom;
        
        Animated.timing(inputBottomOffset, {
          toValue: offset,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();
      },
    );

    const keyboardHideListener = Keyboard.addListener(
      'keyboardWillHide', // Use 'keyboardWillHide' for iOS
      e => {
        Animated.timing(inputBottomOffset, {
          toValue: 0,
          duration: e.duration || 250,
          useNativeDriver: false,
        }).start();
      },
    );
    
    // Use the reliable 'keyboardDid' events for Android
    if (Platform.OS === 'android') {
      keyboardShowListener.remove();
      keyboardHideListener.remove();

      const androidShow = Keyboard.addListener('keyboardDidShow', e => {
        const offset = e.endCoordinates.height - insets.bottom;
        Animated.timing(inputBottomOffset, {
          toValue: offset,
          duration: 100, // Android is typically instant, using a short duration for consistency
          useNativeDriver: false,
        }).start();
      });

      const androidHide = Keyboard.addListener('keyboardDidHide', () => {
        Animated.timing(inputBottomOffset, {
          toValue: 0,
          duration: 100,
          useNativeDriver: false,
        }).start();
      });
      
      return () => {
        androidShow.remove();
        androidHide.remove();
      };
    }

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [insets.bottom]);
  // ---------------- END NEW: Keyboard Animation State ----------------

  /** ---------------- Create / fetch chat ---------------- **/
  useEffect(() => {
    const setupChat = async () => {
      if (!currentUid || !seller?.uid) return setLoading(false);

      const combinedId =
        currentUid < seller.uid
          ? `${currentUid}_${seller.uid}`
          : `${seller.uid}_${currentUid}`;

      const chatRef = firestore().doc(`shopme_chats/${combinedId}`);
      const snapshot = await chatRef.get();

      const buyerInfo = {
        uid: currentUid,
        name: user?.name || 'User',
        photoURL: user?.photoURL || '',
      };
      const sellerInfo = {
        uid: seller.uid,
        name: seller.name || 'Seller',
        photoURL: seller.photoURL || '',
      };

      if (!snapshot.exists) {
        await chatRef.set({
          id: combinedId,
          users: [currentUid, seller.uid],
          usersInfo: [buyerInfo, sellerInfo],
          lastMessage: '',
          lastMessageTime: firestore.FieldValue.serverTimestamp(),
        });
      } else {
        await chatRef.set(
          { users: [currentUid, seller.uid], usersInfo: [buyerInfo, sellerInfo] },
          { merge: true },
        );
      }

      setChatId(combinedId);
      setLoading(false);
    };
    setupChat();
  }, [currentUid, seller?.uid]);

  /** ---------------- Realtime listener ---------------- **/
  useEffect(() => {
    if (!chatId) return;
    const unsub = firestore()
      .collection(`shopme_chats/${chatId}/messages`)
      .orderBy('createdAt')
      .onSnapshot(snap => {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMessages(docs);
        setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 60);
      });

    const subMsg = messaging().onMessage(async remoteMessage => {
      const { title, body } = remoteMessage.notification || {};
      Alert.alert(title || seller.name || 'New Message', body || '');
    });

    return () => {
      unsub();
      subMsg();
    };
  }, [chatId]);

  /** ---------------- Send message ---------------- **/
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed || !chatId) return;

    setText('');
    const msgCol = firestore().collection(`shopme_chats/${chatId}/messages`);

    try {
      const serverTime = firestore.FieldValue.serverTimestamp();
      await msgCol.add({
        text: trimmed,
        senderId: currentUid,
        createdAt: serverTime,
      });

      await firestore()
        .doc(`shopme_chats/${chatId}`)
        .set(
          { lastMessage: trimmed, lastMessageTime: serverTime },
          { merge: true },
        );

      const chatDoc = await firestore().doc(`shopme_chats/${chatId}`).get();
      const chat = chatDoc.data();
      const receiverId = chat.users.find(u => u !== currentUid);
      if (receiverId) {
        const receiverSnap = await firestore()
          .collection('shopme_users')
          .doc(receiverId)
          .get();
        const fcmToken = receiverSnap.data()?.fcmToken;
        if (fcmToken) {
          await sendPushNotification(
            fcmToken,
            user?.name || 'New Message',
            trimmed,
            { chatId },
          );
        }
      }
    } catch (err) {
      console.log('Send message error:', err);
      Alert.alert('Error', 'Unable to send message.');
    }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.senderId === currentUid;
    return (
      <View
        style={[
          styles.msgBubble,
          isMine
            ? { alignSelf: 'flex-end', backgroundColor: theme.accent }
            : {
                alignSelf: 'flex-start',
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
        ]}
      >
        <Text style={[styles.msgText, { color: isMine ? '#fff' : theme.primaryText }]}>
          {item.text}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: theme.primaryBackground }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View // Revert to standard View container
      style={{
        flex: 1,
        backgroundColor: theme.primaryBackground,
      }}
    >
      {/* ─────────────── Header ─────────────── */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.primaryBackground, paddingTop: insets.top }, 
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={22} color={theme.primaryText} />
        </TouchableOpacity>

        <FastImage
          style={styles.avatar}
          source={{ uri: seller.photoURL || PLACEHOLDER }}
        />

        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: theme.primaryText }]}>
            {seller.name || 'User'}
          </Text>
        </View>
      </View>

      {/* 🟢 Divider below header */}
      <View
        style={{
          height: 2,
          backgroundColor: theme.border,
          opacity: 0.6,
        }}
      />

      {/* ─────────────── Messages - Standard FlatList ─────────────── */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={i => i.id}
        renderItem={renderMessage}
        contentContainerStyle={{ padding: 12, paddingBottom: 12 }}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() =>
          flatRef.current?.scrollToEnd({ animated: true })
        }
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }} // Crucial to allow FlatList to take up remaining space
      />

      {/* ─────────────── Input Bar (Now Animated) ─────────────── */}
      <Animated.View // <-- Use Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.surface,
            borderColor: theme.border,
            // Use the animated value for marginBottom to push the input up
            marginBottom: inputBottomOffset, 
            paddingBottom: insets.bottom,
          },
        ]}
      >
        <TextInput
          style={[
            styles.input,
            { backgroundColor: theme.primaryBackground, color: theme.primaryText },
          ]}
          placeholder="Type a message..."
          placeholderTextColor={theme.secondaryText}
          value={text}
          onChangeText={setText}
          returnKeyType="send"
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity
          style={[styles.sendBtn, { backgroundColor: theme.accent }]}
          onPress={sendMessage}
        >
          <Icon name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: '#f7f9fa',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
  },
  backBtn: { marginRight: 6, padding: 4, borderRadius: 20 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginHorizontal: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
  msgBubble: {
    maxWidth: '75%',
    padding: 10,
    borderRadius: 12,
    marginVertical: 4,
  },
  msgText: { fontSize: 14 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 14,
  },
  sendBtn: {
    marginLeft: 8,
    borderRadius: 20,
    padding: 10,
  },
});

export default ChatScreen;
