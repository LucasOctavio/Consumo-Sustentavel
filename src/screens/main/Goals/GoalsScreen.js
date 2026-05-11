import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { AppLayout } from '../../../components/AppLayout';
import { Card } from '../../../components/Card';
import { CircularProgress } from '../../../components/CircularProgress';
import { GoalADD } from '../Goals/GoalADD.js';
import { BarChart } from 'react-native-chart-kit';
import { AuthContext, useTheme } from '../../../navigation/AppNavigator';

const screenWidth = Dimensions.get('window').width - 60;

const getChartConfig = colors => ({
  backgroundGradientFrom: colors.card,
  backgroundGradientTo: colors.card,
  color: (opacity = 1) =>
    colors.text === '#FFFFFF'
      ? `rgba(255, 255, 255, ${opacity})`
      : `rgba(30, 44, 90, ${opacity})`,
  labelColor: (opacity = 1) => colors.textLight,
  strokeWidth: 3,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForBackgroundLines: {
    strokeDasharray: '',
    stroke: colors.border,
    strokeOpacity: 0.2,
  },
});

const AddButtonFull = ({ onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.addButtonFull, { backgroundColor: colors.card }]}
      onPress={onPress}>
      <Text style={[styles.addButtonFullText, { color: colors.secondary }]}>
        ADD
      </Text>
    </TouchableOpacity>
  );
};

export const GoalsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { goals, addGoal, updateGoal, deleteGoal } = useContext(AuthContext);
  const [period, setPeriod] = useState('1 sem');
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);

  const filterDataByPeriod = (data, periodStr) => {
    const now = new Date();
    let days = 7;
    if (periodStr === '2 sem') days = 14;
    else if (periodStr === '3 sem') days = 21;
    else if (periodStr === '1 mês') days = 30;
    else if (periodStr === '6 meses') days = 180;
    else if (periodStr === '1 ano') days = 365;

    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data
      .filter(item => {
        const datePart = item.start.includes(' ')
          ? item.start.split(' ')[0]
          : item.start;
        const [day, month, year] = datePart.split('/').map(Number);
        const itemDate = new Date(year, month - 1, day);
        return itemDate >= cutoff;
      })
      .sort((a, b) => {
        const dateA = a.start.includes(' ') ? a.start.split(' ')[0] : a.start;
        const dateB = b.start.includes(' ') ? b.start.split(' ')[0] : b.start;
        const [da, ma, ya] = dateA.split('/').map(Number);
        const [db, mb, yb] = dateB.split('/').map(Number);
        return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db);
      });
  };

  const filteredGoalsForChart = filterDataByPeriod(goals, period);

  const handleAddOrUpdate = data => {
    if (editingGoal) {
      // Garante que o ID original seja enviado no payload de atualização
      updateGoal({ ...data, id: editingGoal.id });
    } else {
      addGoal(data);
    }
    setModalVisible(false);
    setEditingGoal(null);
  };

  const handleEdit = goal => {
    setEditingGoal(goal);
    setModalVisible(true);
  };

  const handleDelete = id => {
    Alert.alert(
      'Excluir Meta',
      'Tem certeza que deseja excluir permanentemente esta meta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteGoal(id),
        },
      ],
    );
  };

  const renderGoalItem = (goal, color) => (
    <Card key={goal.id} style={{ marginBottom: 20 }}>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}>
        <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 14 }}>
          {goal.type}
        </Text>
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            onPress={() => handleEdit(goal)}
            style={{ marginRight: 15 }}>
            <Text
              style={{
                color: colors.secondary,
                fontSize: 12,
                fontWeight: 'bold',
              }}>
              EDITAR
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(goal.id)}>
            <Text
              style={{ color: '#FF4C4C', fontSize: 12, fontWeight: 'bold' }}>
              EXCLUIR
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <View style={styles.metaContentRow}>
        <View style={styles.metaDetailsGroup}>
          <View
            style={[styles.metaGrayBox, { backgroundColor: colors.border }]}>
            <Text style={{ color: colors.text, fontSize: 12 }}>
              Valor: {goal.value} {goal.unit}
            </Text>
            <Text style={{ color: colors.text, fontSize: 12 }}>
              Período: {goal.start} - {goal.end}
            </Text>
          </View>
        </View>
        <View style={styles.progressBox}>
          <CircularProgress
            percentage={goal.progress}
            radius={35}
            color={color}
          />
        </View>
      </View>
      {goal.description ? (
        <View
          style={[
            styles.descriptionBox,
            { backgroundColor: colors.border + '30' },
          ]}>
          <Text
            style={{
              color: colors.textLight,
              fontSize: 12,
              fontStyle: 'italic',
            }}>
            {goal.description}
          </Text>
        </View>
      ) : null}
    </Card>
  );

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>
        Metas
      </Text>
      <AddButtonFull
        onPress={() => {
          setEditingGoal(null);
          setModalVisible(true);
        }}
      />

      <Card style={{ marginBottom: 20 }}>
        <View style={styles.chartHeaderRow}>
          <Text
            style={[
              styles.cardHeader,
              { color: colors.text, marginBottom: 0 },
            ]}>
            Limite Disponível (Restante)
          </Text>
          <View
            style={[
              styles.activePeriodBadge,
              { backgroundColor: colors.secondary + '20' },
            ]}>
            <Text
              style={[
                styles.activePeriodBadgeText,
                { color: colors.secondary },
              ]}>
              {period}
            </Text>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.periodSelectorScroll}>
          {['1 sem', '2 sem', '3 sem', '1 mês', '6 meses', '1 ano'].map(
            option => (
              <TouchableOpacity
                key={option}
                onPress={() => setPeriod(option)}
                style={[
                  styles.periodChip,
                  {
                    backgroundColor:
                      period === option
                        ? colors.secondary
                        : colors.border + '30',
                  },
                ]}>
                <Text
                  style={[
                    styles.periodChipText,
                    { color: period === option ? '#fff' : colors.text },
                  ]}>
                  {option}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </ScrollView>
        {(() => {
          const totals = filteredGoalsForChart.reduce((acc, goal) => {
            acc[goal.type] = (acc[goal.type] || 0) + (Number(goal.remaining) || 0);
            return acc;
          }, {});

          const labels = Object.keys(totals);
          const data = Object.values(totals);

          if (labels.length === 0)
            return (
              <Text
                style={{
                  color: colors.textLight,
                  textAlign: 'center',
                  padding: 20,
                }}>
                Nenhuma meta para analisar
              </Text>
            );

          return (
            <BarChart
              data={{
                labels: labels,
                datasets: [
                  {
                    data: data,
                    colors: labels.map(label => {
                      if (label === 'Água') return () => colors.chart.barBlue;
                      if (label === 'Energia')
                        return () => colors.chart.barOrange;
                      if (label === 'Gás') return () => colors.success;
                      return () => colors.secondary;
                    }),
                  },
                ],
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

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
        Metas atuais
      </Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const todayGoals = goals.filter(g => g.start === today);

        return todayGoals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={{ color: colors.textLight }}>Não há meta atual</Text>
          </Card>
        ) : (
          todayGoals.map(goal => renderGoalItem(goal, colors.progress.orange))
        );
      })()}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
        Metas anteriores
      </Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const olderGoals = goals.filter(g => g.start !== today);

        return olderGoals.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={{ color: colors.textLight }}>
              Não há metas anteriores
            </Text>
          </Card>
        ) : (
          olderGoals.map(goal => renderGoalItem(goal, colors.progress.blue))
        );
      })()}

      <GoalADD
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        title={editingGoal ? 'Editar Meta' : 'Adicionar Meta'}
        onAdd={handleAddOrUpdate}
        initialData={editingGoal}
      />
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screenTitleText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 5,
  },
  cardHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  chart: { marginVertical: 5, borderRadius: 15 },
  addButtonFull: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 3,
  },
  addButtonFullText: { fontWeight: 'bold', fontSize: 16 },
  metaContentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaDetailsGroup: { flex: 2 },
  metaGrayBox: { padding: 10, borderRadius: 15 },
  progressBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 5,
  },
  periodSelectorScroll: { marginBottom: 15 },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  periodChipText: { fontSize: 13 },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  activePeriodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activePeriodBadgeText: { fontSize: 10, fontWeight: 'bold' },
  emptyCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#ccc',
  },
  descriptionBox: { marginTop: 10, padding: 8, borderRadius: 10 },
});
