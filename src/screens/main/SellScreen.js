import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  FlatList,
  Modal,
  StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch, useSelector } from 'react-redux';
import { createListing } from '../../redux/productSlice';
import colors from '../../utils/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// static categories
const categories = [
  'Pets',
  'Mobiles',
  'Vehicles',
  'Grocery',
  'Electronics',
  'Furniture',
  'Fashion',
  'Books',
  'Others',
];

export default function SellScreen() {
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { user } = useSelector(state => state.auth);
  const { loading } = useSelector(state => state.products);
  const darkMode = useSelector(state => state.auth.darkMode);
  const theme = darkMode ? colors.dark : colors.light;

  //  choose statusbar brightness automatically
  const statusBarStyle = darkMode ? 'light-content' : 'dark-content';
  const statusBarBg = theme.primaryBackground || '#fff';

  // component state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [photos, setPhotos] = useState([]);
  const [catModalVisible, setCatModalVisible] = useState(false);

  const handlePickPhotos = () =>
    launchImageLibrary(
      { mediaType: 'photo', quality: 0.8, selectionLimit: 0 },
      res => {
        if (res.didCancel || res.errorCode) return;
        const newUris = res.assets?.map(a => a.uri) || [];
        setPhotos(prev => [...newUris, ...prev]);
      },
    );

  const handleRemovePhoto = uri =>
    setPhotos(prev => prev.filter(p => p !== uri));

  const handlePost = async () => {
    if (!title || !description || !price || !category || photos.length === 0) {
      Alert.alert('Missing details', 'Please fill all fields and add photos.');
      return;
    }
    if (!user?.uid) {
      Alert.alert('Error', 'User not logged in.');
      return;
    }

    const result = await dispatch(
      createListing({
        title,
        description,
        price,
        category,
        photo: photos,
        user,
      }),
    );

    if (createListing.fulfilled.match(result)) {
      Alert.alert('Success', 'Listing posted successfully!');
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setPhotos([]);
    } else {
      Alert.alert('Error', result.payload || 'Something went wrong.');
    }
  };

  const flatListData = ['add', ...photos];

  return (
    <View style={{ flex: 1, backgroundColor: theme.primaryBackground }}>
      {/* Dynamic status bar */}
      <StatusBar
        barStyle={statusBarStyle}
        backgroundColor={statusBarBg}
        animated={true}
      />

      <ScrollView
        style={{
          flex: 1,
          backgroundColor: theme.primaryBackground,
          paddingTop: insets.top + 10,
          paddingBottom: insets.bottom + 10,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.header, { color: theme.primaryText }]}>
          Create New Listing
        </Text>

        {/* Photos */}
        <FlatList
          data={flatListData}
          horizontal
          keyExtractor={item => (item === 'add' ? 'add-button' : item)}
          contentContainerStyle={styles.photoRow}
          renderItem={({ item }) =>
            item === 'add' ? (
              <TouchableOpacity
                style={[
                  styles.addBox,
                  { borderColor: theme.accent, backgroundColor: theme.surface },
                ]}
                onPress={handlePickPhotos}
              >
                <Icon name="add" size={36} color={theme.accent} />
              </TouchableOpacity>
            ) : (
              <View style={styles.previewWrap}>
                <Image source={{ uri: item }} style={styles.photoThumb} />
                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemovePhoto(item)}
                >
                  <Icon name="close" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            )
          }
        />

        {/* Inputs */}
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.primaryText,
            },
          ]}
          placeholder="Title"
          placeholderTextColor={theme.secondaryText}
          value={title}
          onChangeText={setTitle}
        />

        <TextInput
          style={[
            styles.input,
            styles.textArea,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.primaryText,
            },
          ]}
          placeholder="Description"
          placeholderTextColor={theme.secondaryText}
          multiline
          numberOfLines={4}
          value={description}
          onChangeText={setDescription}
        />

        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              color: theme.primaryText,
            },
          ]}
          placeholder="Price"
          placeholderTextColor={theme.secondaryText}
          keyboardType="numeric"
          value={price}
          onChangeText={setPrice}
        />

        {/* Category */}
        <TouchableOpacity
          style={[
            styles.dropdown,
            { backgroundColor: theme.surface, borderColor: theme.border },
          ]}
          onPress={() => setCatModalVisible(true)}
        >
          <Text
            style={{
              color: category ? theme.primaryText : theme.secondaryText,
              fontSize: 15,
            }}
          >
            {category || 'Select Category'}
          </Text>
          <Icon name="caret-down-outline" size={18} color={theme.accent} />
        </TouchableOpacity>

        <Modal
          visible={catModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setCatModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setCatModalVisible(false)}
            style={[styles.modalBg, { paddingTop: insets.top + 180 }]}
          >
            <View
              style={[
                styles.dropdownBox,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
            >
              <FlatList
                data={categories}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.optionRow}
                    onPress={() => {
                      setCategory(item);
                      setCatModalVisible(false);
                    }}
                  >
                    <Text style={{ color: theme.primaryText, fontSize: 15 }}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        <TouchableOpacity
          style={[
            styles.button,
            { backgroundColor: theme.accent },
            loading && { opacity: 0.7 },
          ]}
          onPress={handlePost}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Posting…' : 'Post Listing'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { fontSize: 20,
     fontWeight: '600',
      marginBottom: 12
     },
  photoRow: { marginBottom: 20 },
  addBox: {
    width: 110,
    height: 110,
    borderRadius: 8,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  previewWrap: { position: 'relative', 
    marginRight: 8
   },
  photoThumb: { 
    width: 110,
     height: 110,
      borderRadius: 8
     },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 12,
    padding: 2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 30,
  },
  modalBg: { flex: 1 },
  dropdownBox: {
    top: 200,
    width: '40%',
    alignSelf: 'flex-end',
    borderRadius: 8,
    borderWidth: 1,
    elevation: 4,
    right: 16,
    maxHeight: 260,
  },
  optionRow: { paddingVertical: 10, 
    paddingHorizontal: 14 },
  button: { 
    paddingVertical: 14,
     borderRadius: 8,
      alignItems: 'center'
     },
  buttonText: {
     color: '#fff', 
     fontWeight: '600',
      fontSize: 16
     },
});
