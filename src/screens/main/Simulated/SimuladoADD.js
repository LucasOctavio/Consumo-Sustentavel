import React, { useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, TouchableWithoutFeedback, Keyboard, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../../../navigation/AppNavigator';
import { Card } from '../../../components/Card';
import { Input } from '../../../components/Input';
import { Button } from '../../../components/Button';
import { Dropdown } from '../../../components/Dropdown';

// Garante formato DD/MM/YYYY independente do ambiente/locale do dispositivo
const formatDatePTBR = (d) => {
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const SimuladoADD = ({ visible, onClose, title, onAdd }) => {
  const { colors } = useTheme();
  const [value, setValue] = useState('');
  const [type, setType] = useState('Água');
  const [unit, setUnit] = useState('L');
  const [date, setDate] = useState(formatDatePTBR(new Date()));
  const [startDate, setStartDate] = useState(formatDatePTBR(new Date()));
  const [endDate, setEndDate] = useState(formatDatePTBR(new Date()));
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');

  const typeOptions = ['Água', 'Energia', 'Gás', 'Combustível'];
  const unitOptions = ['L', 'kWh', 'm³', 'kg'];

  // Auto-update unit based on type
  useEffect(() => {
    switch (type) {
      case 'Água':
        setUnit('L');
        break;
      case 'Energia':
        setUnit('kWh');
        break;
      case 'Gás':
        setUnit('m³');
        break;
      case 'Combustível':
        setUnit('L');
        break;
      default:
        break;
    }
  }, [type]);

  // Reset fields when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setValue('');
      setType('Água');
      setUnit('L');
      setDate(formatDatePTBR(new Date()));
      setStartDate(formatDatePTBR(new Date()));
      setEndDate(formatDatePTBR(new Date()));
      setError('');
    }
  }, [visible]);

  const handlePressAdd = () => {
    const isGoal = title.toLowerCase().includes('meta');
    
    if (!value || !type || !unit) {
      setError('Preencha todos os campos');
      return;
    }

    if (isGoal && (!startDate || !endDate)) {
      setError('Preencha as datas de início e fim');
      return;
    }

    if (!isGoal && !date) {
      setError('Preencha a data do registro');
      return;
    }
    
    setError('');
    if (onAdd) {
      onAdd({ value, type, unit, date, startDate, endDate });
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%' }}
          >
            <Card style={styles.modalCard}>
              <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
                <Text style={[styles.title, { color: colors.secondary }]}>{title}</Text>
                
                {error ? <Text style={styles.errorText}>{error}</Text> : null}
                
                <Input 
                  label="Valor de Consumo" 
                  placeholder="Ex: 50" 
                  value={value} 
                  onChangeText={setValue} 
                  keyboardType="numeric"
                />
                <Input 
                  label="Descrição"
                  placeholder="Ex: Conta de água"
                  value={description}
                  onChangeText={setDescription}
                />
                
                <View style={styles.dropdownSection}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Tipo de Recurso</Text>
                  <Dropdown options={typeOptions} selectedValue={type} onSelect={setType} />
                </View>

                <View style={styles.dropdownSection}>
                  <Text style={[styles.fieldLabel, { color: colors.text }]}>Unidade de Medida</Text>
                  <Dropdown options={unitOptions} selectedValue={unit} onSelect={setUnit} />
                </View>

                {title.toLowerCase().includes('meta') ? (
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ width: '48%' }}>
                      <Input 
                        label="Data Início" 
                        placeholder="24/04/2026" 
                        value={startDate} 
                        onChangeText={setStartDate} 
                      />
                    </View>
                    <View style={{ width: '48%' }}>
                      <Input 
                        label="Data Fim" 
                        placeholder="24/04/2027" 
                        value={endDate} 
                        onChangeText={setEndDate} 
                      />
                    </View>
                  </View>
                ) : (
                  <Input 
                    label="Data do Registro" 
                    placeholder="Ex: 24/04/2026" 
                    value={date} 
                    onChangeText={setDate} 
                  />
                  
                )}

                <View style={styles.buttonRow}>
                  <Button title="Salvar" onPress={handlePressAdd} style={styles.btn} />
                  <Button title="Cancelar" onPress={onClose} type="danger" style={[styles.btn, { backgroundColor: colors.border }]} />
                </View>
              </ScrollView>
            </Card>
          </KeyboardAvoidingView>
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
