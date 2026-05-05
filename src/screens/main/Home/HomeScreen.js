import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AppLayout } from '../../../components/AppLayout';
import { Card } from '../../../components/Card';
import { CircularProgress } from '../../../components/CircularProgress';
import { Button } from '../../../components/Button';
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

export const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { consumptions, goals } = useContext(AuthContext);
  
  const latestConsumption = consumptions[0] || { type: 'N/A', value: 0, unit: '-' };
  const currentGoal = goals[0] || null;

  const tips = [
    "Higiene sustentável - feche a torneira ao escovar os dentes e reduza banhos para 5 minutos.",
    "Utilize lâmpadas LED para economizar até 80% de energia.",
    "Evite o desperdício de água lavando o carro com balde em vez de mangueira.",
    "Desligue aparelhos eletrônicos da tomada quando não estiverem em uso para evitar o consumo fantasma.",
    "Aproveite a luz natural abrindo cortinas e janelas durante o dia.",
    "Prefira produtos com embalagens recicláveis ou biodegradáveis.",
    "Pratique a compostagem de resíduos orgânicos para reduzir o lixo e criar adubo natural.",
    "Use a máquina de lavar roupa apenas com a carga completa para economizar água e energia.",
    "Plante árvores ou mantenha plantas em casa para melhorar a qualidade do ar.",
    "Opte por meios de transporte sustentáveis, como bicicleta ou caminhada, sempre que possível."
  ];
  
  const today = new Date();
  const start = new Date(today.getFullYear(), 0, 0);
  const diff = today - start;
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);
  const dailyTip = tips[dayOfYear % tips.length];
  
  const chartConsumptions = consumptions.slice(0, 5).reverse();
  const barData = {
    labels: chartConsumptions.length > 0 ? chartConsumptions.map(c => c.date.split('/')[0] + '/' + c.date.split('/')[1]) : ["-"],
    datasets: [
      {
        data: chartConsumptions.length > 0 ? chartConsumptions.map(c => Number(c.value) || 0) : [0],
        colors: chartConsumptions.map((_, i) => i % 2 === 0 ? () => colors.chart.barBlue : () => colors.chart.barOrange)
      }
    ]
  };

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Tela Inicial</Text>
      
      <TouchableOpacity onPress={() => navigation.navigate('Consumption')}>
        <Card>
          <Text style={[styles.cardHeader, { color: colors.text }]}>Consumo Recentes</Text>
          <BarChart
            data={barData}
            width={screenWidth}
            height={180}
            chartConfig={getChartConfig(colors)}
            fromZero
            style={styles.chart}
          />
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
        <Card>
          <Text style={[styles.cardHeader, { color: colors.text }]}>Meta Atual</Text>
          {currentGoal ? (
            <View style={styles.metaContentRow}>
              <View style={styles.metaDetailsGroup}>
                <View style={[styles.metaGrayBox, { backgroundColor: colors.border }]}>
                  <Text style={[styles.metaInfoLine, { color: colors.text }]}>Consumo: {currentGoal.value} Medida: {currentGoal.unit}</Text>
                  <Text style={[styles.metaInfoLine, { color: colors.text }]}>Tipo: {currentGoal.type}</Text>
                </View>
                <View style={[styles.metaGrayBox, { marginTop: 10, backgroundColor: colors.border }]}>
                  <Text style={[styles.metaInfoLine, { color: colors.text }]}>Inicio: {currentGoal.start}</Text>
                  <Text style={[styles.metaInfoLine, { color: colors.text }]}>Fim: {currentGoal.end}</Text>
                </View>
              </View>
              <View style={styles.progressBox}>
                <CircularProgress percentage={currentGoal.progress} radius={40} color={colors.progress.orange} />
              </View>
            </View>
          ) : (
            <Text style={{ color: colors.textLight, textAlign: 'center', padding: 20 }}>Nenhuma meta definida</Text>
          )}
        </Card>
      </TouchableOpacity>

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Dica do dia</Text>
      <Card style={{ marginBottom: 20, borderLeftWidth: 5, borderLeftColor: '#FFD700' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 5 }}>
          <View style={{ backgroundColor: '#FFD70020', padding: 10, borderRadius: 12, marginRight: 15 }}>
            <FontAwesome5 name="lightbulb" size={20} color="#FFD700" />
          </View>
          <Text style={[styles.tipTextItem, { color: colors.text, fontWeight: '500' }]}>{dailyTip}</Text>
        </View>
      </Card>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
  screenTitleText: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, marginTop: 5 },
  cardHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },
  chart: { marginVertical: 5, borderRadius: 15 },
  metaContentRow: { flexDirection: 'row', justifyContent: 'space-between' },
  metaDetailsGroup: { flex: 2 },
  metaGrayBox: { padding: 10, borderRadius: 15 },
  metaInfoLine: { fontSize: 12 },
  progressBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tipTextItem: { fontSize: 13, lineHeight: 18, flex: 1 },
  listHeaderTitle: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 8, marginLeft: 5 },
});
