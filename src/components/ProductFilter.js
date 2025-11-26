import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import colors from '../utils/colors';

const ProductFilter = ({ onSelect }) => {
  const [visible, setVisible] = useState(false);
  const [selected, setSelected] = useState('date');
  const insets = useSafeAreaInsets();
  const darkMode = useSelector(state => state.auth.darkMode);
  const theme = darkMode ? colors.dark : colors.light;

  const handleSelect = type => {
    setSelected(type);
    setVisible(false);
    onSelect(type);
  };

  const handleClear = () => {
    setSelected('date');
    setVisible(false);
    onSelect('date');
  };

  return (
    <View>
      <TouchableOpacity
        style={[styles.iconButton, { backgroundColor: theme.accent }]}
        onPress={() => setVisible(true)}
      >
        <Icon name="filter-outline" size={22} color={theme.surface} />
      </TouchableOpacity>

      {/* Modal overlay */}
      <Modal visible={visible} transparent animationType="fade">
        <Pressable
          style={[
            styles.overlay,
            {
              paddingTop: insets.top + 10, // keep below status bar cutout
              paddingBottom: insets.bottom,
            },
          ]}
          onPress={() => setVisible(false)}
        >
          {/* Top‑ panel */}
          <View
            style={[
              styles.topPanel,
              { backgroundColor: theme.surface, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.title, { color: theme.primaryText }]}>
              Sort By
            </Text>

            {[
              { key: 'date', label: 'Recently Posted' },
              { key: 'low', label: 'Price: Low to High' },
              { key: 'high', label: 'Price: High to Low' },
            ].map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.option,
                  {
                    backgroundColor:
                      selected === opt.key ? theme.accent : theme.surface,
                  },
                ]}
                onPress={() => handleSelect(opt.key)}
              >
                <Text
                  style={{
                    color: selected === opt.key ? '#fff' : theme.primaryText,
                    fontSize: 15,
                  }}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}

            {selected !== 'date' && (
              <TouchableOpacity
                onPress={handleClear}
                style={[styles.clearBtn, { borderColor: theme.accent }]}
              >
                <Text style={[styles.clearText, { color: theme.accent }]}>
                  Remove Filter
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setVisible(false)}>
              <Text style={[styles.close, { color: theme.accent }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  iconButton: { marginLeft: 4, borderRadius: 8, padding: 10 },

  //
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    //backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
  },

  topPanel: {
    width: '93%',
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 10,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    height: 250,
  },

  title: { fontSize: 17, fontWeight: '600', marginBottom: 12 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  clearBtn: {
    borderWidth: 1,
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  clearText: { fontSize: 14, fontWeight: '600' },
  close: { textAlign: 'right', fontSize: 14, fontWeight: '600' },
});

export default ProductFilter;
