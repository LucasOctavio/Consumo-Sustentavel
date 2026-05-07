import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert } from 'react-native';
import { AppLayout } from '../../../components/AppLayout';
import { Card } from '../../../components/Card';
import { SimuladoADD } from '../Simulated/SimuladoADD.js';
import { LineChart } from 'react-native-chart-kit';
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

export const SimulatedScreen = () => {
  const { colors } = useTheme();
  const { simulations, addSimulation, updateSimulation, deleteSimulation } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSimulation, setEditingSimulation] = useState(null);
  const [period, setPeriod] = useState('1 sem');

  const filterDataByPeriod = (data, periodStr) => {
    const now = new Date();
    let days = 7;
    if (periodStr.includes('2 sem')) days = 14;
    else if (periodStr.includes('3 sem')) days = 21;
    else if (periodStr.includes('1 mês')) days = 30;
    else if (periodStr.includes('2 mê')) days = 60;
    else if (periodStr.includes('3 mê')) days = 90;

    const cutoff = new Date(now.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return data.filter(item => {
      const [day, month, year] = item.date.split('/').map(Number);
      const itemDate = new Date(year, month - 1, day);
      return itemDate >= cutoff;
    }).reverse();
  };

  const filteredSimulations = filterDataByPeriod(simulations, period);

  const handleAddOrUpdate = (data) => {
    if (editingSimulation) {
      updateSimulation(data);
    } else {
      addSimulation(data);
    }
    setModalVisible(false);
    setEditingSimulation(null);
  };

  const handleEdit = (simulation) => {
    setEditingSimulation(simulation);
    setModalVisible(true);
  };

  const handleDelete = (id) => {
    Alert.alert(
      "Excluir Simulação",
      "Tem certeza que deseja excluir permanentemente esta simulação?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteSimulation(id) }
      ]
    );
  };

  const renderSimulationItem = (item) => (
    <Card key={item.id} style={{ marginBottom: 15 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text style={[styles.registerEntryTitle, { color: colors.text, marginBottom: 0 }]}>Registro do simulador</Text>
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
    </Card>
  );

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Simulador</Text>
      <AddButtonFull onPress={() => { setEditingSimulation(null); setModalVisible(true); }} />
      <Card>
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.cardHeader, { color: colors.text, marginBottom: 0 }]}>Análise Temporal</Text>
          <View style={[styles.activePeriodBadge, { backgroundColor: colors.secondary + '20' }]}>
            <Text style={[styles.activePeriodBadgeText, { color: colors.secondary }]}>{period}</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodSelectorScroll}>
          {['1 sem', '2 sem', '3 sem', '1 mês', '2 mêses', '3 mêses'].map((option) => (
            <TouchableOpacity 
              key={option}
              onPress={() => setPeriod(option)}
              style={[styles.periodChip, { backgroundColor: period === option ? colors.secondary : colors.border + '30' }]}
            >
              <Text style={[styles.periodChipText, { color: period === option ? '#fff' : colors.text }]}>{option}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <LineChart
          data={{
            labels: filteredSimulations.length > 0 ? filteredSimulations.map(c => c.date.split('/')[0] + '/' + c.date.split('/')[1]) : ["-"],
            datasets: [
              { 
                data: filteredSimulations.length > 0 ? filteredSimulations.map(c => Number(c.value) || 0) : [0], 
                color: () => colors.chart.barOrange 
              }
            ]
          }}
          width={screenWidth}
          height={180}
          chartConfig={getChartConfig(colors)}
          bezier
          style={styles.chart}
        />
      </Card>
      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros atuais</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const todayItems = simulations.filter(item => item.date === today);
        
        return todayItems.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há registro atual</Text></Card>
        ) : (
          todayItems.map(renderSimulationItem)
        );
      })()}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros anteriores</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const olderItems = simulations.filter(item => item.date !== today);
        
        return olderItems.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há registros anteriores</Text></Card>
        ) : (
          olderItems.map(renderSimulationItem)
        );
      })()}
      <SimuladoADD 
        visible={modalVisible} 
        onClose={() => setModalVisible(false)} 
        title={editingSimulation ? "Editar no Simulador" : "Adicionar ao Simulador"} 
        onAdd={handleAddOrUpdate}
        initialData={editingSimulation}
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
});
