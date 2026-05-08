import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTheme } from '../navigation/AppNavigator';

export const Dropdown = ({ options, selectedValue, onSelect }) => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  const handleSelect = item => {
    onSelect(item);
    setModalVisible(false);
  };

  return (
    <View>
      <TouchableOpacity
        style={[
          styles.dropdownButton,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => setModalVisible(true)}>
        <Text style={[styles.dropdownText, { color: colors.text }]}>
          {selectedValue}
        </Text>
        <FontAwesome5 name="chevron-down" size={12} color={colors.textLight} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent={true} animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.optionItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => handleSelect(item)}>
                  <Text
                    style={[
                      styles.optionText,
                      {
                        color:
                          item === selectedValue ? colors.primary : colors.text,
                      },
                    ]}>
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-end',
    minWidth: 120,
    marginBottom: 10,
  },
  dropdownText: {
    fontSize: 14,
    marginRight: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    maxHeight: 300,
    borderRadius: 15,
    overflow: 'hidden',
  },
  optionItem: {
    padding: 15,
    borderBottomWidth: 1,
  },
  optionText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
