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
  Keyboard,
  Platform,
  KeyboardAvoidingView,
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

// --- Approximate height of your custom header based on styles ---
// Avatar (40) + vertical padding (10 + 10) = ~60
const APPROX_HEADER_HEIGHT = 90;

const ChatScreen = ({ route, navigation }) => {
  const seller = route?.params?.seller || {};
  const { darkMode, user } = useSelector(state => state.auth);
  const theme = darkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();
  
  // Calculate the vertical offset needed to clear the header area.
  // This is the header's fixed height + the top safe area inset.
  const headerOffset = APPROX_HEADER_HEIGHT + insets.top;
  
  // The keyboardOpened state and its listeners are removed as requested, 
  // since they were not strictly necessary for the KAV implementation.

  const currentUid = user?.uid || auth().currentUser?.uid;
  const [chatId, setChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatRef = useRef(null);
  const [keyboardOpened, setKeyboardOpened] = useState(false)
  // Removed: const inputPosition = useRef(new Animated.Value(0)).current;

  // ---------------- Keyboard Listeners (REMOVED) ----------------
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => {
      setKeyboardOpened(true);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardOpened(false);
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
  
  // --- Conditional KAV Props ---
  const kavBehavior = Platform.OS === 'ios' ? 'padding' : 'height';
  const kavOffset = Platform.OS === 'ios' ? headerOffset : 0;

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
        // Ensure scrollToEnd is called to show the latest message
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
console.log("keyboard opened....", keyboardOpened)
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.primaryBackground,
        paddingTop: insets.top,
      }}
    >
      {/* Header (OUTSIDE KeyboardAvoidingView) */}
      <View
        style={[styles.header, { backgroundColor: theme.primaryBackground, paddingTop: 0 }]}
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

      <View
        style={{
          height: 2,
          backgroundColor: theme.border,
          opacity: 0.6,
        }}
      />
      
      {/* KeyboardAvoidingView wraps the scrollable content (FlatList) and the input */}
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={'height'}
        keyboardVerticalOffset={keyboardOpened ? 40 :0}
      >
        {/* Messages */}
        <FlatList
          ref={flatRef}
          data={messages}
          keyExtractor={i => i.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 12, paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() =>
            flatRef.current?.scrollToEnd({ animated: false })
          }
          keyboardShouldPersistTaps="handled"
          style={{ flex: 1 }}
        />

        {/* Input Bar */}
        <View
          style={[
            styles.inputContainer,
            {
              backgroundColor: theme.primaryBackground,
              borderColor: theme.border,
              paddingBottom: insets.bottom + 4,
              marginBottom: 0,
            },
          ]}
        >
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.surface,
                color: theme.primaryText,
              },
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
        </View>
      </KeyboardAvoidingView>
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