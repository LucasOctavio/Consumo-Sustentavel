import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert } from 'react-native';
import { AppLayout } from '../../../components/AppLayout';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { ADD } from '../Consumption/ADD.js';
import { BarChart } from 'react-native-chart-kit';
import { AuthContext, useTheme } from '../../../navigation/AppNavigator';

const screenWidth = Dimensions.get('window').width - 60;

const getChartConfig = (colors) => ({
  backgroundGradientFrom: colors.card,
  backgroundGradientTo: colors.card,
  color: (opacity = 1) => colors.text === '#FFFFFF' ? `rgba(255, 255, 255, ${opacity})` : `rgba(30, 44, 90, ${opacity})`,
  labelColor: (opacity = 1) => colors.textLight,
  strokeWidth: 3,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForDots: {
    r: "5",
    strokeWidth: "2",
    stroke: colors.card
  },
  propsForBackgroundLines: {
    strokeDasharray: "",
    stroke: colors.border,
    strokeOpacity: 0.2
  },
});

const AddButtonFull = ({ onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity style={[styles.addButtonFull, { backgroundColor: colors.card }]} onPress={onPress}>
      <Text style={[styles.addButtonFullText, { color: colors.secondary }]}>ADD</Text>
    </TouchableOpacity>
  );
};

export const ConsumptionScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { consumptions, addConsumption, updateConsumption, deleteConsumption } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [period, setPeriod] = useState('1 sem');

  const filterDataByPeriod = (data, periodStr) => {
    const now = new Date();
    let days = 7;
    if (periodStr === '2 sem') days = 14;
    else if (periodStr === '3 sem') days = 21;
    else if (periodStr === '1 mês') days = 30;
    else if (periodStr === '6 meses') days = 180;
    else if (periodStr === '1 ano') days = 365;

    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return data
      .filter(item => {
        const datePart = item.date.includes(' ') ? item.date.split(' ')[0] : item.date;
        const [day, month, year] = datePart.split('/').map(Number);
        const itemDate = new Date(year, month - 1, day);
        return itemDate >= cutoff;
      })
      .sort((a, b) => {
        const dateA = a.date.includes(' ') ? a.date.split(' ')[0] : a.date;
        const dateB = b.date.includes(' ') ? b.date.split(' ')[0] : b.date;
        const [da, ma, ya] = dateA.split('/').map(Number);
        const [db, mb, yb] = dateB.split('/').map(Number);
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
      });
  };

  const filteredConsumptions = filterDataByPeriod(consumptions, period);

  const handleAddOrUpdate = (data) => {
    if (editingItem) {
      updateConsumption(data);
    } else {
      addConsumption(data);
    }
    setModalVisible(false);
    setEditingItem(null);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Excluir Registro",
      "Tem certeza que deseja excluir permanentemente este registro?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteConsumption(id) }
      ]
    );
  };

  const renderItem = (item) => (
    <Card key={item.id} style={{ marginBottom: 15 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[styles.registerEntryTitle, { color: colors.text, marginBottom: 0 }]}>Registro de consumo</Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity onPress={() => handleEdit(item)} style={{ marginRight: 15 }}>
            <Text style={{ color: colors.secondary, fontSize: 12, fontWeight: 'bold' }}>EDITAR</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={{ color: '#FF4C4C', fontSize: 12, fontWeight: 'bold' }}>EXCLUIR</Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.registerEntryRow}>
        <Text style={{ color: colors.text }}>Tipo: {item.type}</Text>
        <Text style={{ color: colors.text }}>Data: {item.date}</Text>
      </View>
      <View style={styles.registerEntryRow}>
        <Text style={{ color: colors.text }}>Consumo: {item.value}</Text>
        <Text style={{ color: colors.text }}>Medida: {item.unit}</Text>
      </View>
      {item.description ? (
        <View style={[styles.descriptionBox, { backgroundColor: colors.border + '30' }]}>
          <Text style={{ color: colors.textLight, fontSize: 12, fontStyle: 'italic' }}>{item.description}</Text>
        </View>
      ) : null}
    </Card>
  );

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Consumos</Text>
      <AddButtonFull onPress={() => { setEditingItem(null); setModalVisible(true); }} />
      <Card>
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.cardHeader, { color: colors.text, marginBottom: 0 }]}>Análise Temporal</Text>
          <View style={[styles.activePeriodBadge, { backgroundColor: colors.secondary + '20' }]}>
            <Text style={[styles.activePeriodBadgeText, { color: colors.secondary }]}>{period}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelectorScroll}>
          {['1 sem', '2 sem', '3 sem', '1 mês', '6 meses', '1 ano'].map((option) => (
            <TouchableOpacity 
              key={option}
              onPress={() => setPeriod(option)}
              style={[styles.periodChip, { backgroundColor: period === option ? colors.secondary : colors.border + '30' }]}
            >
              <Text style={[styles.periodChipText, { color: period === option ? '#fff' : colors.text }]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <BarChart
          data={{
            labels: filteredConsumptions.length > 0 ? filteredConsumptions.map(c => c.date.split('/')[0] + '/' + c.date.split('/')[1]) : ["-"],
            datasets: [{
              data: filteredConsumptions.length > 0 ? filteredConsumptions.map(c => Number(c.value) || 0) : [0]
            }]
          }}
          width={screenWidth}
          height={180}
          chartConfig={getChartConfig(colors)}
          fromZero
          style={styles.chart}
        />
      </Card>
      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros atuais</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const todayItems = consumptions.filter(item => item.date === today);

        return todayItems.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há registro atual</Text></Card>
        ) : (
          todayItems.map(renderItem)
        );
      })()}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros anteriores</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const olderItems = consumptions.filter(item => item.date !== today);

        return olderItems.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há registros anteriores</Text></Card>
        ) : (
          olderItems.map(renderItem)
        );
      })()}

      <ADD
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingItem ? "Editar Consumo" : "Adicionar Consumo"}
        onAdd={handleAddOrUpdate}
        initialData={editingItem}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screenTitleText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 5 },
  cardHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  chart: { marginVertical: 5, borderRadius: 15 },
  addButtonFull: { width: '100%', paddingVertical: 14, borderRadius: 20, alignItems: 'center', marginBottom: 20, elevation: 3 },
  addButtonFullText: { fontWeight: 'bold', fontSize: 16 },
  listHeaderTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 8, marginLeft: 5 },
  registerEntryTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  registerEntryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  periodSelectorScroll: { marginBottom: 15 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 25, marginRight: 10 },
  periodChipText: { fontSize: 13 },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  activePeriodBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activePeriodBadgeText: { fontSize: 10, fontWeight: 'bold' },
  emptyCard: { padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc' },
  descriptionBox: { marginTop: 10, padding: 8, borderRadius: 10 },
});