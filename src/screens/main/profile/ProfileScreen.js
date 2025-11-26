import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../../../utils/colors';

import ProfileHeader from './ProfileHeader';
import ListingItem from './ListingItem';

const ProfileScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { user, darkMode } = useSelector(state => state.auth);
  const theme = darkMode ? colors.dark : colors.light;

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [myListings, setMyListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  // load user profile
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = firestore()
      .collection('shopme_users')
      .doc(user.uid)
      .onSnapshot(
        doc => {
          if (doc.exists) setProfile(doc.data());
          setLoadingProfile(false);
        },
        err => {
          console.log('Profile fetch error:', err);
          setLoadingProfile(false);
        },
      );
    return () => unsub();
  }, [user?.uid]);

  //  load user's listings
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = firestore()
      .collection('shopme_products')
      .where('sellerId', '==', user.uid)
      .onSnapshot(
        snap => {
          const items = [];
          snap.forEach(d => items.push({ id: d.id, ...d.data() }));
          const toMs = t =>
            t?.toMillis?.() ??
            (t?.toDate?.()
              ? t.toDate().getTime()
              : typeof t === 'string'
              ? Date.parse(t)
              : 0);
          items.sort(
            (a, b) => (toMs(b.createdAt) || 0) - (toMs(a.createdAt) || 0),
          );
          setMyListings(items);
          setLoadingListings(false);
        },
        err => {
          console.log('Listings fetch error:', err);
          setLoadingListings(false);
        },
      );
    return () => unsub();
  }, [user?.uid]);

  // ── delete listing
  const confirmDelete = item => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => handleDelete(item),
        },
      ],
      { cancelable: true },
    );
  };

  const handleDelete = async item => {
    if (!item?.id) return;
    try {
      setDeletingId(item.id);
      const urls =
        Array.isArray(item.images) && item.images.length ? item.images
        : item.imageURL ? [item.imageURL] : [];
      for (const url of urls) {
        try {
          const ref = storage().refFromURL(url);
          await ref.delete();
        } catch (err) {
          console.log('Skipping image delete:', err?.message || err);
        }
      }
      await firestore().collection('shopme_products').doc(item.id).delete();
    } catch (err) {
      Alert.alert('Error', 'Unable to delete listing.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loadingProfile) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.primaryBackground,
            justifyContent: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
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
      <ProfileHeader
        profile={profile}
        theme={theme}
        onSettings={() => navigation.navigate('Settings')}
      />

      <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>
        My Listings
      </Text>

      {loadingListings ? (
        <ActivityIndicator size="small" color={theme.accent} />
      ) : (
        <FlatList
          data={myListings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <ListingItem
              item={item}
              theme={theme}
              deletingId={deletingId}
              onPress={prod =>
                navigation.navigate('ProductDetail', { product: prod })
              }
              onDelete={confirmDelete}
            />
          )}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 90, paddingHorizontal: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <Text style={{ color: theme.secondaryText }}>
                You have not posted any listings yet.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 16,
  },
});

export default ProfileScreen;