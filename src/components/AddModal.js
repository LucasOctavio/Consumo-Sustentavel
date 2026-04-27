import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useTheme } from '../navigation/AppNavigator';
import { Card } from './Card';
import { Input } from './Input';
import { Button } from './Button';
import { Dropdown } from './Dropdown';

export const AddModal = ({ visible, onClose, title, onAdd }) => {
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const [type, setType] = useState('Água');
  const [unit, setUnit] = useState('L');
  const [date, setDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [error, setError] = useState('');

  const typeOptions = ['Água', 'Energia', 'Gás', 'Combustível'];
  const unitOptions = ['L', 'kWh', 'm³', 'kg'];

  // Reset fields when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setValue('');
      setType('Água');
      setUnit('L');
      setDate(new Date().toLocaleDateString('pt-BR'));
      setError('');
    }
  }, [visible]);

  const handlePressAdd = () => {
    if (!value || !type || !unit || !date) {
      setError('Preencha todos os campos');
      return;
    }
    
    setError('');
    if (onAdd) {
      onAdd({ value, type, unit, date });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <Card style={styles.modalCard}>
            <Text style={[styles.title, { color: colors.secondary }]}>{title}</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <Input 
              label="Valor de Consumo" 
              placeholder="Ex: 50" 
              value={value} 
              onChangeText={setValue} 
              keyboardType="numeric"
            />
            
            <View style={styles.dropdownSection}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Tipo de Recurso</Text>
              <Dropdown options={typeOptions} selectedValue={type} onSelect={setType} />
            </View>

            <View style={styles.dropdownSection}>
              <Text style={[styles.fieldLabel, { color: colors.text }]}>Unidade de Medida</Text>
              <Dropdown options={unitOptions} selectedValue={unit} onSelect={setUnit} />
            </View>

            <Input 
              label="Data do Registro" 
              placeholder="Ex: 24/04/2026" 
              value={date} 
              onChangeText={setDate} 
            />

            <View style={styles.buttonRow}>
              <Button title="Salvar" onPress={handlePressAdd} style={styles.btn} />
              <Button title="Cancelar" onPress={onClose} type="danger" style={[styles.btn, { backgroundColor: colors.border }]} />
            </View>
          </Card>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    padding: 25,
    borderRadius: 30,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  dropdownSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  btn: {
    width: '48%',
    height: 50,
  }
});
