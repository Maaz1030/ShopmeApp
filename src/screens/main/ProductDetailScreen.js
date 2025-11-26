import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import FastImage from 'react-native-fast-image';
import firestore from '@react-native-firebase/firestore';
import ImageViewing from 'react-native-image-viewing';
import { useSelector } from 'react-redux';
import colors from '../../utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
const { width } = Dimensions.get('window');

const ProductDetailScreen = ({ route, navigation }) => {
  const product = route?.params?.product || {};
const insets = useSafeAreaInsets();
  const {
    id = '',
    title = 'Sample Product',
    price = '0',
    description = 'No description available.',
    category = 'General',
    imageURL = 'https://via.placeholder.com/400x300.png?text=No+Image',
    images = [],
    sellerId = '',
  } = product;

  const imageArray = images.length ? images : [imageURL];

  const [activeIndex, setActiveIndex] = useState(0);
  const [sellerData, setSellerData] = useState(null);
  const [loadingSeller, setLoadingSeller] = useState(true);

  // Image Viewer state
  const [viewerVisible, setViewerVisible] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const darkMode = useSelector(state => state.auth.darkMode);
  const theme = darkMode ? colors.dark : colors.light;

  // ───────────────────────────────────────────
  // Fetch seller info
  useEffect(() => {
    if (!sellerId) {
      setLoadingSeller(false);
      return;
    }

    const unsubscribe = firestore()
      .collection('shopme_users')
      .doc(sellerId)
      .onSnapshot(
        doc => {
          if (doc.exists) setSellerData(doc.data());
          setLoadingSeller(false);
        },
        () => setLoadingSeller(false),
      );

    return unsubscribe;
  }, [sellerId]);

  // ───────────────────────────────────────────
  // Carousel scroll index
  const handleScroll = e => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setActiveIndex(index);
  };

  // ───────────────────────────────────────────
  // Open viewer at tapped image
  const openViewer = index => {
    setViewerIndex(index);
    setViewerVisible(true);
  };

  // Convert images for viewer
  const viewerImages = imageArray.map(uri => ({ uri }));

  // ───────────────────────────────────────────
  return (
    <View
      style={[styles.container, { backgroundColor: theme.primaryBackground,paddingTop: insets.top ,
          paddingBottom: insets.bottom + 10, }]}
    >
      {/* Header bar */}
      <View
        style={[
          styles.headerBar,
          { backgroundColor: theme.primaryBackground, borderColor: theme.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBack}
        >
          <Icon name="arrow-back" size={22} color={theme.primaryText} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.primaryText }]}>
          Product Details
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image Carousel */}
        <View style={styles.carouselWrapper}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={handleScroll}
          >
            {imageArray.map((img, index) => (
              <TouchableOpacity
                key={index}
                activeOpacity={0.9}
                onPress={() => openViewer(index)}
              >
                <FastImage
                  style={styles.image}
                  source={{ uri: img }}
                  resizeMode={FastImage.resizeMode.cover}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Dots */}
          {imageArray.length > 1 && (
            <View style={styles.dots}>
              {imageArray.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    { backgroundColor: theme.border },
                    i === activeIndex && { backgroundColor: theme.accent },
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* ─────────────── Details ─────────────── */}
        <View
          style={[
            styles.details,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
        >
          <Text style={[styles.title, { color: theme.primaryText }]}>
            {title}
          </Text>
          <Text style={[styles.price, { color: theme.accent }]}>${price}</Text>
          <Text style={[styles.category, { color: theme.primaryText }]}>
            Category: {category}
          </Text>

          <Text style={[styles.header, { color: theme.primaryText }]}>
            Description
          </Text>
          <Text style={[styles.description, { color: theme.secondaryText }]}>
            {description}
          </Text>

          {/* ───────────── Seller Info ───────────── */}
          <View style={styles.sellerContainer}>
            {loadingSeller ? (
              <ActivityIndicator color={theme.accent} />
            ) : (
              <>
                <FastImage
                  style={styles.sellerAvatar}
                  source={
                    sellerData?.photoURL
                      ? { uri: sellerData.photoURL }
                      : require('../../assets/avatar.jpg')
                  }
                />
                <View>
                  <Text
                    style={[styles.sellerName, { color: theme.primaryText }]}
                  >
                    {sellerData?.name || 'Unknown Seller'}
                  </Text>
                  <Text
                    style={[styles.sellerLabel, { color: theme.secondaryText }]}
                  >
                    Seller
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </ScrollView>

      {/* ─────────────── Zoomable Viewer ─────────────── */}
      <ImageViewing
        images={viewerImages}
        imageIndex={viewerIndex}
        visible={viewerVisible}
        onRequestClose={() => setViewerVisible(false)}
        backgroundColor="#000"
        FooterComponent={({ imageIndex }) => (
          <View style={{ alignItems: 'center', paddingBottom: 20 }}>
            <Text style={{ color: '#fff' }}>
              {imageIndex + 1}/{viewerImages.length}
            </Text>
          </View>
        )}
      />

      {/* ─────────────── Message Seller ─────────────── */}
      <TouchableOpacity
        style={[styles.messageButton, { backgroundColor: theme.accent }]}
        onPress={() =>
          navigation.navigate('ChatScreen', {
            seller: {
              uid: sellerId,
              name: sellerData?.name || 'Unknown Seller',
              photoURL:
                sellerData?.photoURL ||
                'https://via.placeholder.com/100x100.png?text=User',
            },
          })
        }
      >
        <Icon name="chatbubble-ellipses-outline" size={20} color="#fff" />
        <Text style={styles.messageButtonText}>Message Seller</Text>
      </TouchableOpacity>
    </View>
  );
};

const DOT_SIZE = 8;

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
  },
  headerBack: { marginRight: 6 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
  carouselWrapper: { marginTop: 6 },
  image: {
    width,
    height: 280,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    marginHorizontal: 4,
  },
  details: {
    top:15,
    borderWidth: 1,
   // borderRadius: 8,
   // margin: 8,
    padding: 16,
  },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 2 },
  price: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  category: { fontSize: 14, marginTop: 6 },
  header: { fontSize: 16, fontWeight: '600', marginTop: 10, marginBottom: 6 },
  description: { fontSize: 14, lineHeight: 20 },
  sellerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
  },
  sellerAvatar: { width: 50, height: 50, borderRadius: 25, marginRight: 12 },
  sellerName: { fontSize: 16, fontWeight: '500' },
  sellerLabel: { fontSize: 13 },
  messageButton: {
    position: 'absolute',
    bottom: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  messageButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ProductDetailScreen;
