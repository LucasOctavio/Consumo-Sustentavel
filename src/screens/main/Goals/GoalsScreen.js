import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { AppLayout } from '../../../components/AppLayout';
import { Card } from '../../../components/Card';
import { CircularProgress } from '../../../components/CircularProgress';
import { GoalADD } from '../Goals/GoalADD.js';
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

export const GoalsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { goals, addGoal } = useContext(AuthContext);
  const [period, setPeriod] = useState('1 sem');
  const [modalVisible, setModalVisible] = useState(false);

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
      const [day, month, year] = item.start.split('/').map(Number);
      const itemDate = new Date(year, month - 1, day);
      return itemDate >= cutoff;
    });
  };

  const filteredGoalsForChart = filterDataByPeriod(goals, period);

  const handleAdd = (data) => {
    addGoal(data);
    setModalVisible(false);
  };

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Metas</Text>
      <AddButtonFull onPress={() => setModalVisible(true)} />
      
      <Card style={{ marginBottom: 20 }}>
        <View style={styles.chartHeaderRow}>
          <Text style={[styles.cardHeader, { color: colors.text, marginBottom: 0 }]}>Análise por Recurso</Text>
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
        {(() => {
          const totals = filteredGoalsForChart.reduce((acc, goal) => {
            acc[goal.type] = (acc[goal.type] || 0) + (Number(goal.value) || 0);
            return acc;
          }, {});
          
          const labels = Object.keys(totals);
          const data = Object.values(totals);
          
          if (labels.length === 0) return <Text style={{ color: colors.textLight, textAlign: 'center', padding: 20 }}>Nenhuma meta para analisar</Text>;

          return (
            <BarChart
              data={{
                labels: labels,
                datasets: [{ 
                  data: data,
                  colors: labels.map(label => {
                    if (label === 'Água') return () => colors.chart.barBlue;
                    if (label === 'Energia') return () => colors.chart.barOrange;
                    if (label === 'Gás') return () => colors.success;
                    return () => colors.secondary;
                  })
                }]
              }}
              width={screenWidth}
              height={180}
              chartConfig={getChartConfig(colors)}
              fromZero
              flatColor={true}
              withCustomBarColorFromData={true}
              style={styles.chart}
            />
          );
        })()}
      </Card>
      
      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Metas atuais</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const todayGoals = goals.filter(g => g.start === today);
        
        return todayGoals.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há meta atual</Text></Card>
        ) : (
          todayGoals.map(goal => (
            <Card key={goal.id} style={{ marginBottom: 20 }}>
              <View style={styles.metaContentRow}>
                <View style={styles.metaDetailsGroup}>
                  <View style={[styles.metaGrayBox, { backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Consumo: {goal.value} Medida: {goal.unit}</Text>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Tipo: {goal.type}</Text>
                  </View>
                  <View style={[styles.metaGrayBox, { marginTop: 10, backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Inicio: {goal.start}</Text>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Fim: {goal.end}</Text>
                  </View>
                </View>
                <View style={styles.progressBox}>
                  <CircularProgress percentage={goal.progress} radius={40} color={colors.progress.orange} />
                </View>
              </View>
            </Card>
          ))
        );
      })()}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Metas anteriores</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const olderGoals = goals.filter(g => g.start !== today);
        
        return olderGoals.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há metas anteriores</Text></Card>
        ) : (
          olderGoals.map(goal => (
            <Card key={goal.id} style={{ marginBottom: 20 }}>
              <View style={styles.metaContentRow}>
                <View style={styles.metaDetailsGroup}>
                  <View style={[styles.metaGrayBox, { backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Consumo: {goal.value} Medida: {goal.unit}</Text>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Tipo: {goal.type}</Text>
                  </View>
                  <View style={[styles.metaGrayBox, { marginTop: 10, backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Inicio: {goal.start}</Text>
                    <Text style={{ color: colors.text, fontSize: 12 }}>Fim: {goal.end}</Text>
                  </View>
                </View>
                <View style={styles.progressBox}>
                  <CircularProgress percentage={goal.progress} radius={40} color={colors.progress.blue} />
                </View>
              </View>
            </Card>
          ))
        );
      })()}
      
      <GoalADD visible={modalVisible} onClose={() => setModalVisible(false)} title="Adicionar Meta" onAdd={handleAdd} />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screenTitleText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 5 },
  cardHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  chart: { marginVertical: 5, borderRadius: 15 },
  addButtonFull: { width: '100%', paddingVertical: 14, borderRadius: 20, alignItems: 'center', marginBottom: 20, elevation: 3 },
  addButtonFullText: { fontWeight: 'bold', fontSize: 16 },
  metaContentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaDetailsGroup: { flex: 2 },
  metaGrayBox: { padding: 10, borderRadius: 15 },
  progressBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeaderTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 8, marginLeft: 5 },
  periodSelectorScroll: { marginBottom: 15 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 25, marginRight: 10 },
  periodChipText: { fontSize: 13 },
  chartHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  activePeriodBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  activePeriodBadgeText: { fontSize: 10, fontWeight: 'bold' },
  emptyCard: { padding: 40, alignItems: 'center', justifyContent: 'center', borderStyle: 'dashed', borderWidth: 2, borderColor: '#ccc' },
});