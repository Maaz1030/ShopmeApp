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
  ActivityIndicator,
  Alert,
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

  const flatRef = useRef(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [text, setText] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatId, setChatId] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUid = user?.uid || auth().currentUser?.uid;

  /* ---------- Keyboard ---------- */
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', e =>
      setKeyboardHeight(e.endCoordinates.height),
    );
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  /* ---------- Create / Fetch Chat ---------- */
  useEffect(() => {
    let active = true;
    const setupChat = async () => {
      try {
        if (!currentUid || !seller?.uid) {
          if (active) setLoading(false);
          return;
        }

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

        // --- Always ensure both users arrays exist
        if (!snapshot.exists) {
          await chatRef.set({
            id: combinedId,
            users: [currentUid, seller.uid],
            usersInfo: [buyerInfo, sellerInfo],
            lastMessage: '',
            lastMessageTime: firestore.FieldValue.serverTimestamp(),
          });
        } else {
          const existing = snapshot.data() || {};
          const existingUsers = existing.users || [];
          const allUsers = Array.from(new Set([...existingUsers, currentUid, seller.uid]));

          const existingInfo = existing.usersInfo || [];
          const infoByUid = {};
          [...existingInfo, buyerInfo, sellerInfo].forEach(i => (infoByUid[i.uid] = i));

          await chatRef.set(
            { users: allUsers, usersInfo: Object.values(infoByUid) },
            { merge: true },
          );
        }

        if (active) {
          setChatId(combinedId);
          setLoading(false);
        }
      } catch (err) {
        console.log('setupChat error:', err);
        if (active) setLoading(false);
      }
    };
    setupChat();
    return () => {
      active = false;
    };
  }, [currentUid, seller?.uid]);

  /* ---------- Realtime listener ---------- */
  useEffect(() => {
    if (!chatId || !currentUid) return;
    let unsub = () => {};

    try {
      unsub = firestore()
        .collection(`shopme_chats/${chatId}/messages`)
        .orderBy('createdAt')
        .onSnapshot(snap => {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setMessages(docs);
          setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 50);
        });
    } catch (err) {
      console.log('Listener error:', err);
    }

    const subMsg = messaging().onMessage(async remoteMessage => {
      const { title, body } = remoteMessage.notification || {};
      Alert.alert(title || seller.name || 'New Message', body || '');
    });

    return () => {
      unsub && unsub();
      subMsg && subMsg();
    };
  }, [chatId, currentUid]);

  /* ---------- Send message ---------- */
  const sendMessage = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (!currentUid) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }
    if (!chatId) {
      Alert.alert('Error', 'Chat not initialized yet.');
      return;
    }

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

      // --- determine receiver
      const chatDoc = await firestore().doc(`shopme_chats/${chatId}`).get();
      const chat = chatDoc.data();
      const receiverId =
        chat?.users?.find?.(u => u !== currentUid) ||
        chat?.usersInfo?.map?.(u => u.uid)?.find?.(id => id !== currentUid);

      if (!receiverId || receiverId === currentUid) {
        console.log('Skipping self-notification');
        return;
      }

      const receiverSnap = await firestore()
        .collection('shopme_users')
        .doc(receiverId)
        .get();
      const fcmToken = receiverSnap.data()?.fcmToken;

      if (fcmToken) {
        await sendPushNotification(
          fcmToken,
          user?.name || 'New message',
          trimmed,
          { chatId },
        );
        console.log('Push sent to', receiverId);
      } else {
        console.log('No fcmToken found for receiver', receiverId);
      }

      setTimeout(() => flatRef.current?.scrollToEnd({ animated: true }), 80);
    } catch (err) {
      console.log('Send message error:', err);
      Alert.alert('Error', err.message || 'Unable to send message.');
    }
  };

  /* ---------- Render message ---------- */
  const renderMessage = ({ item }) => {
    const mine = item.senderId === currentUid;
    return (
      <View
        style={[
          styles.bubble,
          mine
            ? { alignSelf: 'flex-end', backgroundColor: theme.accent }
            : {
                alignSelf: 'flex-start',
                backgroundColor: theme.surface,
                borderColor: theme.border,
                borderWidth: 1,
              },
        ]}
      >
        <Text style={{ color: mine ? '#fff' : theme.primaryText, fontSize: 15 }}>
          {item.text}
        </Text>
      </View>
    );
  };

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  /* ---------- Main UI ---------- */
  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.primaryBackground, paddingTop: insets.top },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.primaryBackground, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={styles.backBtn}
        >
          <Icon name="arrow-back" size={22} color={theme.primaryText} />
        </TouchableOpacity>

        <FastImage
          style={styles.avatar}
          source={{ uri: seller.photoURL || PLACEHOLDER }}
        />
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>
          {seller.name || 'User'}
        </Text>
      </View>

      {/* Chat area */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 10, paddingBottom: 8 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: true })}
        />

        {/* Input bar */}
        <View
          style={[
            styles.inputContainer,
            {
              marginBottom: Platform.OS === 'android' ? keyboardHeight : 0,
              borderColor: theme.border,
              backgroundColor: theme.surface,
              paddingBottom: Platform.OS === 'ios' ? insets.bottom : 8,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.primaryBackground,
                color: theme.primaryText,
              },
            ]}
            placeholder="Type a message..."
            placeholderTextColor={theme.secondaryText}
            value={text}
            onChangeText={setText}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
          />
          <TouchableOpacity
            onPress={sendMessage}
            style={[styles.sendBtn, { backgroundColor: theme.accent }]}
          >
            <Icon name="send" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

/* ---------- STYLES ---------- */
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backBtn: { padding: 4, marginRight: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18, marginRight: 8 },
  headerTitle: { fontSize: 17, fontWeight: '600' },
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
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  input: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 15,
    marginBottom: 23,
  },
  sendBtn: {
    marginLeft: 8,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 23,
  },
});

export default ChatScreen;