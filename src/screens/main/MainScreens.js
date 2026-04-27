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

export const HomeScreen = () => {
  const { colors } = useTheme();
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
  
  const barData = {
    labels: ["S1", "S2", "S3", "S4", "S5"],
    datasets: [
      {
        data: [35, 75, 95, 55, 85],
        colors: [() => colors.chart.barBlue, () => colors.chart.barOrange, () => colors.chart.barBlue, () => colors.chart.barOrange, () => colors.chart.barBlue]
      }
    ]
  };

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Tela Inicial</Text>
      
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

      <Card>
        <Text style={[styles.cardHeader, { color: colors.text }]}>Meta Atual</Text>
        <View style={styles.metaContentRow}>
          <View style={styles.metaDetailsGroup}>
            <View style={[styles.metaGrayBox, { backgroundColor: colors.border }]}>
              <Text style={[styles.metaInfoLine, { color: colors.text }]}>Consumo: 50   Medida: kWh</Text>
              <Text style={[styles.metaInfoLine, { color: colors.text }]}>Tipo: Energia</Text>
            </View>
            <View style={[styles.metaGrayBox, { marginTop: 10, backgroundColor: colors.border }]}>
              <Text style={[styles.metaInfoLine, { color: colors.text }]}>Inicio: 22/09/2008</Text>
              <Text style={[styles.metaInfoLine, { color: colors.text }]}>Fim: 22/09/2009</Text>
            </View>
          </View>
          <View style={styles.progressBox}>
            <CircularProgress percentage={52} radius={40} color={colors.progress.orange} />
          </View>
        </View>
      </Card>

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
  const [modalVisible, setModalVisible] = useState(false);
  const [period, setPeriod] = useState('1 semana');
  const [items, setItems] = useState([
    { id: 1, type: 'Água', value: 50, date: '20/05/2009', unit: 'L' },
    { id: 2, type: 'Energia', value: 12, date: '20/05/2008', unit: 'kWh' }
  ]);

  const handleAdd = (data) => {
    const newItem = { id: items.length + 1, ...data };
    setItems([newItem, ...items]);
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
            labels: ["S1", "S2", "S3", "S4"],
            datasets: [{ data: [40, 80, 50, 90] }]
          }}
          width={screenWidth}
          height={180}
          chartConfig={getChartConfig(colors)}
          fromZero
          style={styles.chart}
        />
      </Card>
      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros atuais</Text>
      {items.length === 0 ? (
        <Card style={styles.emptyCard}><Text style={{ color: colors.textLight }}>Não há dados registrados</Text></Card>
      ) : (
        items.map(item => (
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
      )}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros anteriores</Text>
      <Card style={{ marginBottom: 15 }}>
        <Text style={[styles.registerEntryTitle, { color: colors.text }]}>Registro de consumo</Text>
        <View style={styles.registerEntryRow}>
          <Text style={{ color: colors.text }}>Tipo: Água</Text>
          <Text style={{ color: colors.text }}>Data: 15/04/2008</Text>
        </View>
        <View style={styles.registerEntryRow}>
          <Text style={{ color: colors.text }}>Consumo: 45</Text>
          <Text style={{ color: colors.text }}>Medida: L</Text>
        </View>
      </Card>
      <Card style={{ marginBottom: 15 }}>
        <Text style={[styles.registerEntryTitle, { color: colors.text }]}>Registro de consumo</Text>
        <View style={styles.registerEntryRow}>
          <Text style={{ color: colors.text }}>Tipo: Energia</Text>
          <Text style={{ color: colors.text }}>Data: 10/01/2007</Text>
        </View>
        <View style={styles.registerEntryRow}>
          <Text style={{ color: colors.text }}>Consumo: 150</Text>
          <Text style={{ color: colors.text }}>Medida: kWh</Text>
        </View>
      </Card>
      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Adicionar Consumo" onAdd={handleAdd} />
    </AppLayout>
  );
};

export const SimulatedScreen = () => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [period, setPeriod] = useState('1 semana');
  const [items, setItems] = useState([
    { id: 1, type: 'Água', value: 50, date: '12/10/2009', unit: 'L' },
    { id: 2, type: 'Energia', value: 12, date: '31/03/2005', unit: 'kWh' }
  ]);

  const handleAdd = (data) => {
    const newItem = { id: items.length + 1, ...data };
    setItems([newItem, ...items]);
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
            labels: ["S1", "S2", "S3", "S4"],
            datasets: [{ data: [20, 50, 40, 90], color: () => colors.chart.barOrange }, { data: [30, 45, 60, 85], color: () => colors.success }]
          }}
          width={screenWidth}
          height={180}
          chartConfig={getChartConfig(colors)}
          bezier
          style={styles.chart}
        />
      </Card>
      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros atuais</Text>
      {items.map(item => (
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
      ))}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Registros anteriores</Text>
      <Card style={{ marginBottom: 15 }}>
        <Text style={[styles.registerEntryTitle, { color: colors.text }]}>Registro do simulador</Text>
        <View style={styles.registerEntryRow}>
          <Text style={{ color: colors.text }}>Tipo: Energia</Text>
          <Text style={{ color: colors.text }}>Data: 22/09/2008</Text>
        </View>
        <View style={styles.registerEntryRow}>
          <Text style={{ color: colors.text }}>Consumo: 15</Text>
          <Text style={{ color: colors.text }}>Medida: kWh</Text>
        </View>
      </Card>
      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Adicionar ao Simulador" onAdd={handleAdd} />
    </AppLayout>
  );
};

export const GoalsScreen = () => {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [goals, setGoals] = useState([
    { id: 1, type: 'Energia', value: 50, unit: 'kWh', start: '22/09/2008', end: '22/09/2009', progress: 52 },
  ]);

  const pastGoals = [
    { id: 101, type: 'Água', value: 1200, unit: 'L', start: '06/04/2008', end: '17/07/2011', progress: 52 }
  ];

  const handleAdd = (data) => {
    const newGoal = { id: goals.length + 1, type: data.type, value: data.value, unit: data.unit, start: data.date, end: '31/12/2026', progress: 0 };
    setGoals([newGoal, ...goals]);
    setModalVisible(false);
  };

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Metas</Text>
      <AddButtonFull onPress={() => setModalVisible(true)} />
      
      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Meta Atual</Text>
      {goals.map(goal => (
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
      ))}

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>Metas anteriores</Text>
      {pastGoals.map(goal => (
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
      ))}
      
      <AddModal visible={modalVisible} onClose={() => setModalVisible(false)} title="Adicionar Meta" onAdd={handleAdd} />
    </AppLayout>
  );
};

export const SettingsScreen = () => {
  const { logout, userData, updateProfile } = useContext(AuthContext);
  const { isDarkMode, setIsDarkMode, colors } = useContext(ThemeContext);
  const [expandedSection, setExpandedSection] = useState(null);
  
  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
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
    updateProfile({ name, email, profileImage });
    setTimeout(() => {
      setSaving(false);
      Alert.alert("Sucesso", "Perfil atualizado com sucesso!");
    }, 500);
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
      <Text style={[styles.screenTitleText, { color: colors.text }]}>Configuração</Text>
      <Card style={styles.profileEditCard}>
        <Text style={[styles.cardHeader, { color: colors.text, textAlign: 'center' }]}>Editar Perfil</Text>
        <View style={styles.profileImageContainer}>
          <TouchableOpacity onPress={pickImage} style={[styles.avatarCircle, { backgroundColor: colors.border, overflow: 'hidden' }]}>
            {profileImage ? <Image source={{ uri: profileImage }} style={{ width: '100%', height: '100%' }} /> : <FontAwesome5 name="user-alt" size={40} color={colors.secondary} />}
            <View style={styles.editImageBtn}><FontAwesome5 name="camera" size={14} color="#fff" /></View>
          </TouchableOpacity>
        </View>
        <View style={styles.editSection}>
          <Text style={[styles.editLabel, { color: colors.text }]}>Informações Pessoais</Text>
          <Input label="Nome" value={name} onChangeText={setName} />
          <Input label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />
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
      <Card style={{ marginTop: 20 }}>
        <View style={styles.modeToggleRow}>
          <Text style={[styles.modeText, { color: colors.text }]}>🌙 Modo Escuro</Text>
          <Switch value={isDarkMode} onValueChange={setIsDarkMode} trackColor={{ false: '#767577', true: colors.secondary }} thumbColor={isDarkMode ? '#fff' : '#f4f3f4'} />
        </View>
      </Card>
      <CollapsibleCard title="Informações e Ajuda" icon="info-circle" sectionKey="info">
        <Text style={[styles.legalSectionTitle, { color: colors.secondary, marginTop: 10 }]}>📄 Termos de Uso</Text>
        <LegalSection title="1. Objetivo" items={["Auxiliar no controle de gastos", "Incentivar práticas sustentáveis"]} />
        <LegalSection title="2. Cadastro" items={["Responsabilidade pelas informações", "Uso ético"]} />
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 20 }]} />
        <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>🔒 Política de Privacidade</Text>
        <LegalSection title="1. Dados" items={["Nome e E-mail", "Gastos inseridos"]} />
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 20 }]} />
        <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>❓ Central de Ajuda</Text>
        <LegalSection title="Dúvidas?" items={["Entre nas FAQ", "Contate o suporte"]} />
      </CollapsibleCard>
      <CollapsibleCard title="Suporte" icon="envelope" sectionKey="support">
        <View style={styles.supportBox}>
          <FontAwesome5 name="headset" size={20} color={colors.secondary} style={{ marginBottom: 10 }} />
          <Text style={[styles.supportEmail, { color: colors.secondary }]}>suporte.ccn@email.com</Text>
        </View>
      </CollapsibleCard>
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
  profileEditCard: { borderRadius: 30, padding: 25 },
  profileImageContainer: { alignItems: 'center', marginVertical: 20 },
  avatarCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  editImageBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#009DFF', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#fff' },
  editSection: { marginBottom: 20 },
  editLabel: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, opacity: 0.7 },
  profileActionBtns: { marginTop: 10 },
  saveProfileBtn: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  logoutBtn: { height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});
