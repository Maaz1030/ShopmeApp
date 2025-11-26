import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Icon from 'react-native-vector-icons/Ionicons';
import firestore from '@react-native-firebase/firestore';
import { useSelector } from 'react-redux';
import colors from '../../utils/colors';
import ProductFilter from '../../components/ProductFilter';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const categories = [
  { id: '0', name: 'All', icon: 'grid-outline' },
  { id: '1', name: 'Pets', icon: 'paw-outline' },
  { id: '2', name: 'Mobiles', icon: 'phone-portrait-outline' },
  { id: '3', name: 'Vehicles', icon: 'car-outline' },
  { id: '4', name: 'Grocery', icon: 'basket-outline' },
  { id: '5', name: 'Electronics', icon: 'laptop-outline' },
  { id: '6', name: 'Furniture', icon: 'home-outline' },
  { id: '7', name: 'Fashion', icon: 'shirt-outline' },
  { id: '8', name: 'Books', icon: 'book-outline' },
  { id: '9', name: 'Others', icon: 'folder-outline' },
];

const HomeScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortType, setSortType] = useState('date');
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  const darkMode = useSelector(state => state.auth.darkMode);
  const theme = darkMode ? colors.dark : colors.light;

  useEffect(() => {
    const unsub = firestore()
      .collection('shopme_products')
      .orderBy('createdAt', 'desc')
      .onSnapshot(
        snap => {
          const items = [];
          snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
          setListings(items);
          setLoading(false);
        },
        err => {
          console.log('Firestore error:', err);
          setLoading(false);
        },
      );
    return () => unsub();
  }, []);

  let filteredListings = listings.filter(item => {
    const inCategory =
      selectedCategory === 'All' ||
      item.category?.toLowerCase() === selectedCategory.toLowerCase();
    const inSearch = item.title?.toLowerCase().includes(search.toLowerCase());
    return inCategory && inSearch;
  });

  if (sortType === 'low') {
    filteredListings.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
  } else if (sortType === 'high') {
    filteredListings.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
  } else {
    filteredListings.sort(
      (a, b) =>
        (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0),
    );
  }

  const renderCategory = ({ item }) => {
    const isActive = item.name === selectedCategory;
    return (
      <TouchableOpacity
        onPress={() => setSelectedCategory(item.name)}
        style={[
          styles.categoryItem,
          {
            backgroundColor: isActive ? theme.accent : theme.surface,
            borderColor: isActive ? theme.accent : theme.border,
          },
        ]}
      >
        <Icon
          name={item.icon}
          size={20}
          color={isActive ? '#fff' : theme.accent}
        />
        <Text
          style={[
            styles.categoryText,
            { color: isActive ? '#fff' : theme.primaryText },
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderProduct = ({ item }) => {
    const cover =
      Array.isArray(item.images) && item.images.length
        ? item.images[0]
        : item.imageURL ||
          'https://via.placeholder.com/400x300.png?text=No+Image';
    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('ProductDetail', { product: item })}
      >
        <View style={styles.imageWrap}>
          <FastImage
            style={styles.productImage}
            source={{
              uri: cover,
              priority: FastImage.priority.high,
              cache: FastImage.cacheControl.immutable,
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>
        <Text style={[styles.productTitle, { color: theme.primaryText }]}>
          {item.title}
        </Text>
        <Text style={[styles.productPrice, { color: theme.accent }]}>
          ${item.price}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading)
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.primaryBackground,
            justifyContent: 'center',
            alignItems: 'center',
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.primaryBackground,
          paddingTop: insets.top + 10,
          paddingHorizontal: 16, // keep side padding consistent
        },
      ]}
    >
      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Icon name="search-outline" size={20} color={theme.secondaryText} />
          <TextInput
            placeholder="Search products"
            placeholderTextColor={theme.secondaryText}
            style={[styles.searchInput, { color: theme.primaryText, marginLeft: 6 }]}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Icon
                name="close-circle"
                size={20}
                color={theme.secondaryText}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>
          )}
        </View>
        <ProductFilter onSelect={type => setSortType(type)} />
      </View>

      {/* Categories */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>
          Categories
        </Text>
      </View>
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item.id}
          renderItem={renderCategory}
          showsHorizontalScrollIndicator={false}
        />
      </View>

      {/* Products */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.primaryText }]}>
          Product Listings
        </Text>
      </View>

      <FlatList
        data={filteredListings}
        keyExtractor={item => item.id}
        renderItem={renderProduct}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80, //   space above tab bar
          marginTop: 8,
        }}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Text style={{ color: theme.secondaryText }}>No listings found</Text>
          </View>
        }
      />
    </View>
  );
};

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 6,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600' },
  categoryContainer: { marginBottom: 12 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 10,
    borderWidth: 1,
  },
  categoryText: { marginLeft: 6, fontSize: 14 },
  card: {
    borderRadius: 10,
    padding: 10,
    width: '48%',
    marginBottom: 12,
    borderWidth: 1,
  },
  imageWrap: { position: 'relative' },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  productTitle: { fontSize: 14, fontWeight: '500' },
  productPrice: { fontSize: 13, fontWeight: '600', marginTop: 2 },
});

export default HomeScreen;