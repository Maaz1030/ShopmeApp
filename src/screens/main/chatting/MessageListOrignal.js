import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import firestore from '@react-native-firebase/firestore';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../utils/colors';

const PLACEHOLDER = 'https://via.placeholder.com/100x100.png?text=U';

/** ---------- Custom time-ago formatter ---------- */
const getTimeAgo = ts => {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 30) return 'Just now';
  if (diffMin < 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} min ago`;
  if (diffHr < 24) return `${diffHr} hr ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay} d ago`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek} wk ago`;
  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} mo ago`;
  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} y ago`;
};

const MessagesList = ({ navigation }) => {
  const { user, darkMode } = useSelector(state => state.auth);
  const theme = darkMode ? colors.dark : colors.light;
  const insets = useSafeAreaInsets();

  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  /** ---------- Load user’s chats ---------- */
  useEffect(() => {
    // ✅ If user is null, clear chats and stop listener
    if (!user?.uid) {
      setChats([]);
      setLoading(false);
      return;
    }

    const unsub = firestore()
      .collection('shopme_chats')
      .where('users', 'array-contains', user.uid)
      .onSnapshot(
        snap => {
          const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          const list = all.filter(c => c.lastMessage?.trim?.().length);
          list.sort(
            (a, b) =>
              (b.lastMessageTime?.toMillis?.() || 0) -
              (a.lastMessageTime?.toMillis?.() || 0),
          );
          setChats(list);
          setLoading(false);
        },
        err => {
          console.log('Chat listener error:', err);
          setLoading(false);
        },
      );

    // ✅ Cleanup listener on unmount or logout
    return () => {
      unsub && unsub();
    };
  }, [user?.uid]);

  /** ---------- Delete chat ---------- */
  const confirmDelete = chat => {
    Alert.alert('Delete Chat', 'Delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => handleDelete(chat) },
    ]);
  };

  const handleDelete = async chat => {
    if (!chat?.id) return;
    try {
      setDeletingId(chat.id);
      const chatRef = firestore().collection('shopme_chats').doc(chat.id);

      const msgs = await chatRef.collection('messages').get();
      const batch = firestore().batch();
      msgs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      await chatRef.delete();
    } catch (err) {
      Alert.alert('Error', 'Could not delete chat.');
    } finally {
      setDeletingId(null);
    }
  };

  /** ---------- Render each chat ---------- */
  const renderChat = ({ item }) => {
    // ✅ SAFETY CHECK: user can be null after logout
    if (!user?.uid) return null;

    const other = item.usersInfo?.find(u => u.uid !== user.uid);
    const name = other?.name || 'User';
    const avatar = other?.photoURL || PLACEHOLDER;
    const time = getTimeAgo(item.lastMessageTime);

    const rightActions = () => (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: theme.error || '#E53935' }]}
        onPress={() => confirmDelete(item)}
        activeOpacity={0.85}
      >
        {deletingId === item.id ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Icon name="trash-outline" size={22} color="#fff" />
            <Text style={styles.deleteText}>Delete</Text>
          </>
        )}
      </TouchableOpacity>
    );

    return (
      <Swipeable renderRightActions={rightActions} overshootRight={false}>
        <TouchableOpacity
          style={[
            styles.chatRow,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          activeOpacity={0.8}
          onPress={() =>
            navigation.navigate('ChatScreen', {
              chatId: item.id,
              seller: { uid: other?.uid, name, photoURL: avatar },
            })
          }
        >
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <View style={styles.chatInfo}>
            <View style={styles.rowBetween}>
              <Text
                style={[styles.userName, { color: theme.primaryText }]}
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text style={[styles.time, { color: theme.secondaryText }]}>{time}</Text>
            </View>
            <Text
              style={[styles.lastMessage, { color: theme.secondaryText }]}
              numberOfLines={1}
            >
              {item.lastMessage || ''}
            </Text>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  /** ---------- Loading or list ---------- */
  if (loading) {
    return (
      <View style={[styles.centerBox, { backgroundColor: theme.primaryBackground }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  // ✅ SAFETY CHECK: Don’t render list if user is null (after logout)
  if (!user?.uid) {
    return (
      <View style={[styles.centerBox, { backgroundColor: theme.primaryBackground }]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.primaryBackground,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 10,
        },
      ]}
    >
      <Text style={[styles.header, { color: theme.primaryText }]}>Messages</Text>

      {chats.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Text style={{ color: theme.secondaryText }}>No conversations yet.</Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={item => item.id}
          renderItem={renderChat}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 16, paddingHorizontal: 16 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

/** ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  centerBox: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: '600', marginBottom: 16, marginLeft: 16 },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderWidth: 1,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  chatInfo: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  time: { fontSize: 12, paddingTop: 12 },
  lastMessage: { fontSize: 14 },
  deleteAction: {
    width: 80,
    height: 90,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  deleteText: { color: '#fff', fontSize: 12, marginTop: 2, fontWeight: '600' },
});

export default MessagesList;
