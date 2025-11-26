import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import { Swipeable } from 'react-native-gesture-handler';

const ListingItem = ({ item, theme, onPress, onDelete, deletingId }) => {
  const cover =
    Array.isArray(item.images) && item.images.length > 0
      ? item.images[0]
      : item.imageURL ||
        'https://via.placeholder.com/400x300.png?text=No+Image';

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: theme.error }]}
      onPress={() => onDelete(item)}
      disabled={deletingId === item.id}
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
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        onPress={() => onPress(item)}
        activeOpacity={0.85}
      >
        <View style={styles.imageWrap}>
          <FastImage style={styles.image} source={{ uri: cover }} />
          {Array.isArray(item.images) && item.images.length > 1 && (
            <View style={styles.countBadge}>
              <Icon name="images-outline" size={12} color="#fff" />
              <Text style={styles.countText}>{item.images.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.info}>
          <Text style={[styles.title, { color: theme.primaryText }]}>
            {item.title}
          </Text>
          <Text style={[styles.price, { color: theme.accent }]}>
            ${item.price}
          </Text>
        </View>
      </TouchableOpacity>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    paddingRight: 10,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    alignItems: 'center',
    minHeight: 90,
    width: '100%',
  },
  imageWrap: { position: 'relative' },
  image: { width: 100, height: 90 },
  countBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 12,
    paddingHorizontal: 6,
    height: 20,
    minWidth: 26,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  countText: { color: '#fff', marginLeft: 4, fontSize: 11, fontWeight: '600' },
  info: { flex: 1, padding: 10, justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '500' },
  price: { fontSize: 14, fontWeight: '600', marginTop: 4 },
  deleteAction: {
    width: 80,
    height: 90,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  deleteText: { color: '#fff', fontSize: 12, marginTop: 2, fontWeight: '600' },
});

export default ListingItem;
