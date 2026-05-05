import React, { useState, useContext, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Switch, ScrollView, Alert, Image, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { FontAwesome5, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { AppLayout } from '../../components/AppLayout';
import { Card } from '../../components/Card';
import { CircularProgress } from '../../components/CircularProgress';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { AddModal } from '../../components/AddModal';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { AuthContext, ThemeContext, useTheme } from '../../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';

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

export const ConsumptionScreen = () => {
  const { colors } = useTheme();
  const { consumptions, addConsumption } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
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

  const filteredConsumptions = filterDataByPeriod(consumptions, period);

  const handleAdd = (data) => {
    addConsumption(data);
    setModalVisible(false);
  };

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Consumos</Text>
      <AddButtonFull onPress={() => setModalVisible(true)} />
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
          todayItems.map(item => (
            <Card key={item.id} style={{ marginBottom: 15 }}>
              <Text style={[styles.registerEntryTitle, { color: colors.text }]}>Registro de consumo</Text>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Tipo: {item.type}</Text>
                <Text style={{ color: colors.text }}>Data: {item.date}</Text>
              </View>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Consumo: {item.value}</Text>
                <Text style={{ color: colors.text }}>Medida: {item.unit}</Text>
              </View>
            </Card>
          ))
        );
      })()}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros anteriores</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const olderItems = consumptions.filter(item => item.date !== today);
        
        return olderItems.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há registros anteriores</Text></Card>
        ) : (
          olderItems.map(item => (
            <Card key={item.id} style={{ marginBottom: 15 }}>
              <Text style={[styles.registerEntryTitle, { color: colors.text }]}>Registro de consumo</Text>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Tipo: {item.type}</Text>
                <Text style={{ color: colors.text }}>Data: {item.date}</Text>
              </View>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Consumo: {item.value}</Text>
                <Text style={{ color: colors.text }}>Medida: {item.unit}</Text>
              </View>
            </Card>
          ))
        );
      })()}
      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Adicionar Consumo" onAdd={handleAdd} />
    </AppLayout>
  );
};

export const SimulatedScreen = () => {
  const { colors } = useTheme();
  const { simulations, addSimulation } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
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

  const handleAdd = (data) => {
    addSimulation(data);
    setModalVisible(false);
  };

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Simulador</Text>
      <AddButtonFull onPress={() => setModalVisible(true)} />
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
          todayItems.map(item => (
            <Card key={item.id} style={{ marginBottom: 15 }}>
              <Text style={[styles.registerEntryTitle, { color: colors.text }]}>Registro do simulador</Text>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Tipo: {item.type}</Text>
                <Text style={{ color: colors.text }}>Data: {item.date}</Text>
              </View>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Consumo: {item.value}</Text>
                <Text style={{ color: colors.text }}>Medida: {item.unit}</Text>
              </View>
            </Card>
          ))
        );
      })()}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros anteriores</Text>
      {(() => {
        const today = new Date().toLocaleDateString('pt-BR');
        const olderItems = simulations.filter(item => item.date !== today);
        
        return olderItems.length === 0 ? (
          <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há registros anteriores</Text></Card>
        ) : (
          olderItems.map(item => (
            <Card key={item.id} style={{ marginBottom: 15 }}>
              <Text style={[styles.registerEntryTitle, { color: colors.text }]}>Registro do simulador</Text>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Tipo: {item.type}</Text>
                <Text style={{ color: colors.text }}>Data: {item.date}</Text>
              </View>
              <View style={styles.registerEntryRow}>
                <Text style={{ color: colors.text }}>Consumo: {item.value}</Text>
                <Text style={{ color: colors.text }}>Medida: {item.unit}</Text>
              </View>
            </Card>
          ))
        );
      })()}
      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Adicionar ao Simulador" onAdd={handleAdd} />
    </AppLayout>
  );
};

export const GoalsScreen = () => {
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
      
      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Adicionar Meta" onAdd={handleAdd} />
    </AppLayout>
  );
};

export const SettingsScreen = () => {
  const { logout, userData, updateProfile, deleteAccount } = useContext(AuthContext);
  const { isDarkMode, setIsDarkMode, colors } = useContext(ThemeContext);
  const [expandedSection, setExpandedSection] = useState(null);
  
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [password, setPassword] = useState(userData?.password || '');
  const [profileImage, setProfileImage] = useState(userData?.profileImage || null);
  const [saving, setSaving] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Erro', 'Precisamos de permissão para acessar suas fotos.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    setSaving(true);
    updateProfile({ name, email, password, profileImage });
    setTimeout(() => {
      setSaving(false);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    }, 500);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Excluir Conta",
      "Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Excluir", style: "destructive", onPress: () => deleteAccount() }
      ]
    );
  };

  const CollapsibleCard = ({ title, icon, sectionKey, children }) => (
    <Card style={{ marginTop: 15, padding: 0, overflow: 'hidden' }}>
      <TouchableOpacity 
        style={[styles.collapsibleHeader, { backgroundColor: expandedSection === sectionKey ? colors.secondary + '10' : 'transparent' }]} 
        onPress={() => setExpandedSection(expandedSection === sectionKey ? null : sectionKey)}
      >
        <View style={styles.collapsibleTitleRow}>
          <View style={[styles.iconBox, { backgroundColor: colors.secondary + '15' }]}>
            <FontAwesome5 name={icon} size={14} color={colors.secondary} />
          </View>
          <Text style={[styles.collapsibleTitle, { color: colors.text }]}>{title}</Text>
        </View>
        <FontAwesome5 name={expandedSection === sectionKey ? "chevron-up" : "chevron-down"} size={12} color={colors.textLight} />
      </TouchableOpacity>
      {expandedSection === sectionKey && (
        <View style={styles.collapsibleContent}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {children}
        </View>
      )}
    </Card>
  );

  const LegalSection = ({ title, items }) => (
    <View style={{ marginBottom: 20 }}>
      <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>{title}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.legalItemRow}>
          <View style={[styles.bullet, { backgroundColor: colors.secondary }]} />
          <Text style={[styles.legalItemText, { color: colors.text }]}>{item}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.profileHeaderContainer}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity onPress={pickImage} style={[styles.avatarLarge, { backgroundColor: colors.border }]}>
            {profileImage ? <Image source={{ uri: profileImage }} style={{ width: '100%', height: '100%' }} /> : <FontAwesome5 name="user-alt" size={40} color={colors.secondary} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={[styles.avatarPlusBtn, { backgroundColor: colors.secondary }]}>
            <FontAwesome5 name="plus" size={12} color="#fff" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.profileNameRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.profileNameText, { color: colors.text }]}>{name}</Text>
            <FontAwesome5 name="chevron-down" size={14} color={colors.text} style={{ marginLeft: 8 }} />
          </View>
          <TouchableOpacity 
            style={[styles.pencilEditBtn, { backgroundColor: colors.border + '50' }]}
            onPress={() => setExpandedSection(expandedSection === 'profile' ? null : 'profile')}
          >
            <FontAwesome5 name="pen" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {expandedSection === 'profile' && (
        <Card style={{ marginTop: 10 }}>
          <View style={styles.editSection}>
            <Text style={[styles.editLabel, { color: colors.text }]}>Editar Informações</Text>
            <Input label="Nome" value={name} onChangeText={setName} />
            <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <Input label="Senha" value={password} onChangeText={setPassword} secureTextEntry />
          </View>
          <View style={styles.profileActionBtns}>
            <TouchableOpacity style={[styles.saveProfileBtn, { backgroundColor: colors.secondary }]} onPress={handleSave} disabled={saving}>
              <Text style={styles.btnTextWhite}>{saving ? "Salvando..." : "Salvar alterações"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.danger }]} onPress={logout}>
              <Text style={[styles.logoutBtnText, { color: colors.danger }]}>Sair da conta</Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}
      <Card style={{ marginTop: 20 }}>
        <View style={styles.modeToggleRow}>
          <Text style={[styles.modeText, { color: colors.text }]}><FontAwesome5 name="moon" size={18} color={colors.text} /> Modo Escuro</Text>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#767577', true: colors.secondary }} thumbColor={isDarkMode ? '#fff' : '#f4f3f4'} />
        </View>
      </Card>
      <CollapsibleCard title="Informações e Ajuda" icon="info-circle" sectionKey="info">
        <Text style={[styles.legalSectionTitle, { color: colors.secondary, marginTop: 10 }]}>Termos de Uso</Text>
        <LegalSection title="1. Objetivo" items={["Auxiliar no controle de gastos", "Incentivar práticas sustentáveis"]} />
        <LegalSection title="2. Cadastro" items={["Responsabilidade pelas informações", "Uso ético"]} />
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 20 }]} />
        <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>Política de Privacidade</Text>
        <LegalSection title="1. Dados" items={["Nome e E-mail", "Gastos inseridos"]} />
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 20 }]} />
        <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>Central de Ajuda</Text>
        <LegalSection title="Dúvidas?" items={["Entre nas FAQ", "Contate o suporte"]} />
      </CollapsibleCard>
      <CollapsibleCard title="Suporte" icon="envelope" sectionKey="support">
        <View style={styles.supportBox}>
          <FontAwesome5 name="headset" size={20} color={colors.secondary} style={{ marginBottom: 10 }} />
          <Text style={[styles.supportEmail, { color: colors.secondary }]}>suporte.ccn@email.com</Text>
        </View>
      </CollapsibleCard>

      <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteAccountButton}>
        <FontAwesome5 name="trash-alt" size={14} color={colors.danger} style={{ marginRight: 10 }} />
        <Text style={[styles.deleteAccountText, { color: colors.danger }]}>Excluir Conta Permanentemente</Text>
      </TouchableOpacity>
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
  tipTextItem: { fontSize: 13, lineHeight: 18, flex: 1 },
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
  modeToggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  modeText: { fontSize: 18, fontWeight: 'bold' },
  collapsibleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18 },
  collapsibleTitleRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  collapsibleTitle: { fontSize: 15, fontWeight: '700' },
  collapsibleContent: { padding: 18, paddingTop: 0 },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.5 },
  legalSectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  legalItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, marginRight: 10 },
  legalItemText: { fontSize: 13, lineHeight: 20, flex: 1 },
  supportBox: { padding: 20, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  supportEmail: { fontSize: 14, fontWeight: '700', textDecorationLine: 'underline' },
  profileHeaderContainer: { alignItems: 'center', marginVertical: 30 },
  avatarWrapper: { position: 'relative' },
  avatarLarge: { width: 110, height: 110, borderRadius: 55, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  avatarPlusBtn: { position: 'absolute', bottom: 5, right: 5, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  profileNameText: { fontSize: 20, fontWeight: 'bold' },
  profileUsernameText: { fontSize: 14, marginTop: 4 },
  pencilEditBtn: { padding: 8, borderRadius: 20, marginLeft: 15 },
  editSection: { marginBottom: 20 },
  editLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, opacity: 0.7 },
  profileActionBtns: { marginTop: 10 },
  saveProfileBtn: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  logoutBtn: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  deleteAccountButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 40, 
    marginBottom: 30,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12
  },
  deleteAccountText: { fontSize: 14, fontWeight: 'bold' },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
