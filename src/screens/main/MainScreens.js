import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Switch,
  ScrollView,
  Alert,
  Image,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  TextInput,
} from 'react-native';
import {
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { AppLayout } from '../../components/AppLayout';
import { Card } from '../../components/Card';
import { CircularProgress } from '../../components/CircularProgress';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Dropdown } from '../../components/Dropdown';

import {
  AuthContext,
  ThemeContext,
  useTheme,
} from '../../navigation/AppNavigator';
import { photoService } from '../../services/api';
import * as ImagePicker from 'expo-image-picker';

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
  propsForDots: {
    r: '5',
    strokeWidth: '2',
    stroke: colors.card,
  },
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

// ─── Mapeamento fixo: cada tipo tem sua unidade de medida ──
const typeUnitMap = {
  Água: 'Litros',
  Energia: 'kWh',
  Gás: 'm³',
};

const typeIconMap = {
  Água: { name: 'tint', color: '#2196F3' },
  Energia: { name: 'bolt', color: '#FF9800' },
  Gás: { name: 'fire', color: '#4CAF50' },
};

const MONTH_NAMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];
const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// ─── CalendarPicker — calendário interativo customizado ──
const CalendarPicker = ({ selectedDate, onSelectDate, colors }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  // Parse DD/MM/YYYY → Date
  const parseSelected = () => {
    if (!selectedDate) return null;
    const [d, m, y] = selectedDate.split('/').map(Number);
    return new Date(y, m - 1, d);
  };
  const selected = parseSelected();

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else setViewMonth(viewMonth - 1);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else setViewMonth(viewMonth + 1);
  };

  const handleDayPress = day => {
    const dd = String(day).padStart(2, '0');
    const mm = String(viewMonth + 1).padStart(2, '0');
    onSelectDate(`${dd}/${mm}/${viewYear}`);
  };

  const isToday = day => {
    return (
      day === today.getDate() &&
      viewMonth === today.getMonth() &&
      viewYear === today.getFullYear()
    );
  };

  const isSelected = day => {
    if (!selected) return false;
    return (
      day === selected.getDate() &&
      viewMonth === selected.getMonth() &&
      viewYear === selected.getFullYear()
    );
  };

  // Build calendar grid cells
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <View style={calStyles.calendarContainer}>
      {/* Header: nav + month/year */}
      <View style={calStyles.calHeader}>
        <TouchableOpacity onPress={goToPrevMonth} style={calStyles.calNavBtn}>
          <FontAwesome5
            name="chevron-left"
            size={14}
            color={colors.secondary}
          />
        </TouchableOpacity>
        <Text style={[calStyles.calMonthLabel, { color: colors.text }]}>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={calStyles.calNavBtn}>
          <FontAwesome5
            name="chevron-right"
            size={14}
            color={colors.secondary}
          />
        </TouchableOpacity>
      </View>
      {/* Day-of-week labels */}
      <View style={calStyles.calRow}>
        {DAY_NAMES.map(dn => (
          <View key={dn} style={calStyles.calCell}>
            <Text style={[calStyles.calDayName, { color: colors.textLight }]}>
              {dn}
            </Text>
          </View>
        ))}
      </View>
      {/* Day grid */}
      <View style={calStyles.calGrid}>
        {cells.map((day, idx) => (
          <View key={idx} style={calStyles.calCell}>
            {day ? (
              <TouchableOpacity
                onPress={() => handleDayPress(day)}
                style={[
                  calStyles.calDayBtn,
                  isToday(day) && {
                    borderWidth: 1.5,
                    borderColor: colors.secondary,
                  },
                  isSelected(day) && { backgroundColor: colors.secondary },
                ]}>
                <Text
                  style={[
                    calStyles.calDayText,
                    { color: colors.text },
                    isSelected(day) && { color: '#fff', fontWeight: 'bold' },
                  ]}>
                  {day}
                </Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
};

const calStyles = StyleSheet.create({
  calendarContainer: {
    marginTop: 8,
    marginBottom: 5,
  },
  calHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  calNavBtn: {
    padding: 8,
  },
  calMonthLabel: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  calRow: {
    flexDirection: 'row',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
    marginBottom: 4,
  },
  calDayName: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  calDayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calDayText: {
    fontSize: 13,
  },
});

// ─── AddModal — modal reutilizável para adicionar consumo, simulação ou meta ──
const AddModal = ({ visible, onClose, title, onAdd, initialData }) => {
  const { colors } = useTheme();
  const isGoal = title?.toLowerCase().includes('meta');

  const [type, setType] = useState(initialData?.type || 'Água');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showCalendar, setShowCalendar] = useState(null); // 'date' | 'start' | 'end' | null

  const typeOptions = ['Água', 'Energia', 'Gás'];
  const unit = typeUnitMap[type] || 'Litros';
  const typeIcon = typeIconMap[type] || { name: 'tint', color: '#2196F3' };

  const resetForm = () => {
    setValue('');
    setDescription('');
    setDate('');
    setStartDate('');
    setEndDate('');
    setShowCalendar(null);
  };

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setType(initialData.type || 'Água');
        setValue(String(initialData.value || ''));
        setDescription(initialData.description || '');
        if (isGoal) {
          setStartDate(initialData.start || '');
          setEndDate(initialData.end || '');
        } else {
          setDate(initialData.date || '');
        }
      } else {
        resetForm();
      }
    }
  }, [visible, initialData]);

  const handleSubmit = () => {
    if (!value || isNaN(Number(value))) {
      Alert.alert('Erro', 'Por favor, insira um valor numérico válido.');
      return;
    }

    const payload = { id: initialData?.id, type, value: Number(value), unit };

    if (isGoal) {
      if (!startDate || !endDate) {
        Alert.alert('Erro', 'Por favor, selecione as datas de início e fim.');
        return;
      }
      onAdd({ ...payload, startDate, endDate, description });
    } else {
      const finalDate = date || new Date().toLocaleDateString('pt-BR');
      onAdd({ ...payload, date: finalDate, description });
    }
    resetForm();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={addModalStyles.overlay}>
          <ScrollView
            contentContainerStyle={addModalStyles.scrollContent}
            showsVerticalScrollIndicator={false}>
            <View
              style={[
                addModalStyles.container,
                { backgroundColor: colors.card },
              ]}>
              {/* ── Header ── */}
              <View style={addModalStyles.header}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      addModalStyles.headerIcon,
                      { backgroundColor: colors.secondary + '15' },
                    ]}>
                    <FontAwesome5
                      name="plus"
                      size={14}
                      color={colors.secondary}
                    />
                  </View>
                  <Text style={[addModalStyles.title, { color: colors.text }]}>
                    {initialData ? `Editar ${isGoal ? 'Meta' : 'Registro'}` : title}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    resetForm();
                  }}
                  style={[
                    addModalStyles.closeBtn,
                    { backgroundColor: colors.border + '40' },
                  ]}>
                  <FontAwesome5
                    name="times"
                    size={16}
                    color={colors.textLight}
                  />
                </TouchableOpacity>
              </View>

              {/* ── Tipo: chips ── */}
              <Text style={[addModalStyles.label, { color: colors.textLight }]}>
                Tipo de recurso
              </Text>
              <View style={addModalStyles.chipRow}>
                {typeOptions.map(opt => {
                  const icon = typeIconMap[opt];
                  const isActive = type === opt;
                  return (
                    <TouchableOpacity
                      key={opt}
                      onPress={() => setType(opt)}
                      style={[
                        addModalStyles.chip,
                        {
                          backgroundColor: isActive
                            ? icon.color + '18'
                            : colors.border + '25',
                          borderColor: isActive ? icon.color : 'transparent',
                        },
                      ]}>
                      <FontAwesome5
                        name={icon.name}
                        size={14}
                        color={isActive ? icon.color : colors.textLight}
                      />
                      <Text
                        style={[
                          addModalStyles.chipText,
                          {
                            color: isActive ? icon.color : colors.textLight,
                            fontWeight: isActive ? '700' : '500',
                          },
                        ]}>
                        {opt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Valor + Unidade ── */}
              <Text style={[addModalStyles.label, { color: colors.textLight }]}>
                Valor consumido
              </Text>
              <View
                style={[
                  addModalStyles.fieldGroup,
                  { backgroundColor: colors.border + '18' },
                ]}>
                <View style={addModalStyles.fieldRow}>
                  <View
                    style={[
                      addModalStyles.fieldIcon,
                      { backgroundColor: typeIcon.color + '18' },
                    ]}>
                    <FontAwesome5
                      name={typeIcon.name}
                      size={14}
                      color={typeIcon.color}
                    />
                  </View>
                  <TextInput
                    style={[addModalStyles.fieldInput, { color: colors.text }]}
                    placeholder="Ex: 150"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    value={value}
                    onChangeText={t => setValue(t.replace(/[^0-9.,]/g, ''))}
                  />
                  <View
                    style={[
                      addModalStyles.unitBadge,
                      { backgroundColor: typeIcon.color + '20' },
                    ]}>
                    <Text
                      style={[
                        addModalStyles.unitBadgeText,
                        { color: typeIcon.color },
                      ]}>
                      {unit}
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── Data (consumo/simulação) ── */}
              {!isGoal && (
                <>
                  <Text
                    style={[addModalStyles.label, { color: colors.textLight }]}>
                    Data
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setShowCalendar(showCalendar === 'date' ? null : 'date')
                    }
                    style={[
                      addModalStyles.fieldGroup,
                      { backgroundColor: colors.border + '18' },
                    ]}>
                    <View style={addModalStyles.fieldRow}>
                      <View
                        style={[
                          addModalStyles.fieldIcon,
                          { backgroundColor: '#9C27B0' + '18' },
                        ]}>
                        <FontAwesome5
                          name="calendar-alt"
                          size={14}
                          color="#9C27B0"
                        />
                      </View>
                      <Text
                        style={[
                          addModalStyles.fieldInput,
                          { color: date ? colors.text : colors.textLight },
                        ]}>
                        {date || 'Selecionar data (hoje por padrão)'}
                      </Text>
                      <FontAwesome5
                        name={
                          showCalendar === 'date'
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={12}
                        color={colors.textLight}
                      />
                    </View>
                  </TouchableOpacity>
                  {showCalendar === 'date' && (
                    <CalendarPicker
                      selectedDate={date}
                      onSelectDate={d => {
                        setDate(d);
                        setShowCalendar(null);
                      }}
                      colors={colors}
                    />
                  )}
                </>
              )}

              {/* ── Descrição (consumo/simulação) ── */}
              {!isGoal && (
                <>
                  <Text
                    style={[addModalStyles.label, { color: colors.textLight }]}>
                    Descrição (opcional)
                  </Text>
                  <View
                    style={[
                      addModalStyles.fieldGroup,
                      { backgroundColor: colors.border + '18' },
                    ]}>
                    <View style={addModalStyles.fieldRow}>
                      <View
                        style={[
                          addModalStyles.fieldIcon,
                          { backgroundColor: '#607D8B' + '18' },
                        ]}>
                        <FontAwesome5 name="pen" size={12} color="#607D8B" />
                      </View>
                      <TextInput
                        style={[
                          addModalStyles.fieldInput,
                          { color: colors.text },
                        ]}
                        placeholder="Ex: Conta de água de abril"
                        placeholderTextColor={colors.textLight}
                        value={description}
                        onChangeText={setDescription}
                      />
                    </View>
                  </View>
                </>
              )}

              {/* ── Datas (metas) ── */}
              {isGoal && (
                <>
                  <Text
                    style={[addModalStyles.label, { color: colors.textLight }]}>
                    Data de Início
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setShowCalendar(showCalendar === 'start' ? null : 'start')
                    }
                    style={[
                      addModalStyles.fieldGroup,
                      { backgroundColor: colors.border + '18' },
                    ]}>
                    <View style={addModalStyles.fieldRow}>
                      <View
                        style={[
                          addModalStyles.fieldIcon,
                          { backgroundColor: '#4CAF50' + '18' },
                        ]}>
                        <FontAwesome5
                          name="calendar-alt"
                          size={14}
                          color="#4CAF50"
                        />
                      </View>
                      <Text
                        style={[
                          addModalStyles.fieldInput,
                          { color: startDate ? colors.text : colors.textLight },
                        ]}>
                        {startDate || 'Selecionar data de início'}
                      </Text>
                      <FontAwesome5
                        name={
                          showCalendar === 'start'
                            ? 'chevron-up'
                            : 'chevron-down'
                        }
                        size={12}
                        color={colors.textLight}
                      />
                    </View>
                  </TouchableOpacity>
                  {showCalendar === 'start' && (
                    <CalendarPicker
                      selectedDate={startDate}
                      onSelectDate={d => {
                        setStartDate(d);
                        setShowCalendar(null);
                      }}
                      colors={colors}
                    />
                  )}

                  <Text
                    style={[addModalStyles.label, { color: colors.textLight }]}>
                    Data de Fim
                  </Text>
                  <TouchableOpacity
                    onPress={() =>
                      setShowCalendar(showCalendar === 'end' ? null : 'end')
                    }
                    style={[
                      addModalStyles.fieldGroup,
                      { backgroundColor: colors.border + '18' },
                    ]}>
                    <View style={addModalStyles.fieldRow}>
                      <View
                        style={[
                          addModalStyles.fieldIcon,
                          { backgroundColor: '#F44336' + '18' },
                        ]}>
                        <FontAwesome5
                          name="calendar-alt"
                          size={14}
                          color="#F44336"
                        />
                      </View>
                      <Text
                        style={[
                          addModalStyles.fieldInput,
                          { color: endDate ? colors.text : colors.textLight },
                        ]}>
                        {endDate || 'Selecionar data de fim'}
                      </Text>
                      <FontAwesome5
                        name={
                          showCalendar === 'end' ? 'chevron-up' : 'chevron-down'
                        }
                        size={12}
                        color={colors.textLight}
                      />
                    </View>
                  </TouchableOpacity>
                  {showCalendar === 'end' && (
                    <CalendarPicker
                      selectedDate={endDate}
                      onSelectDate={d => {
                        setEndDate(d);
                        setShowCalendar(null);
                      }}
                      colors={colors}
                    />
                  )}
                </>
              )}

              {/* ── Submit Button ── */}
              <TouchableOpacity
                style={[
                  addModalStyles.submitBtn,
                  { backgroundColor: colors.secondary },
                ]}
                onPress={handleSubmit}>
                <FontAwesome5
                  name="check"
                  size={16}
                  color="#fff"
                  style={{ marginRight: 10 }}
                />
                <Text style={addModalStyles.submitBtnText}>{initialData ? 'Atualizar' : 'Adicionar'}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const addModalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  container: {
    width: '92%',
    borderRadius: 28,
    padding: 24,
    elevation: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 8,
  },
  chipText: {
    fontSize: 14,
  },
  fieldGroup: {
    borderRadius: 16,
    padding: 4,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  fieldIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  unitBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 8,
  },
  unitBadgeText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  submitBtn: {
    height: 54,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    marginTop: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export const HomeScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { consumptions, goals, simulations } = useContext(AuthContext);

  const latestConsumption = consumptions[0] || {
    type: 'N/A',
    value: 0,
    unit: '-',
  };
  const currentGoal = goals[0] || null;

  const categorizedTips = {
    Água: [
      'Feche a torneira ao escovar os dentes e reduza banhos para 5 minutos.',
      'Evite o desperdício de água lavando o carro com balde em vez de mangueira.',
      'Use a máquina de lavar roupa apenas com a carga completa para economizar água.',
      'Conserte vazamentos em torneiras e descargas imediatamente.',
      'Reutilize a água da máquina de lavar para limpar o quintal.',
    ],
    Energia: [
      'Utilize lâmpadas LED para economizar até 80% de energia.',
      'Desligue aparelhos da tomada quando não estiverem em uso.',
      'Aproveite a luz natural abrindo cortinas e janelas durante o dia.',
      'Reduza o uso do ar-condicionado e prefira ventilação natural.',
      'Mantenha a borracha da geladeira em bom estado para evitar perda de frio.',
    ],
    Gás: [
      'Tampe as panelas durante o cozimento para acelerar o processo e economizar gás.',
      'Mantenha os queimadores do fogão limpos para uma chama mais eficiente.',
      'Corte os alimentos em pedaços menores para que cozinhem mais rápido.',
      'Verifique regularmente se há vazamentos nas conexões do gás.',
      'Use panelas de pressão sempre que possível para economizar tempo e gás.',
    ],
    Geral: [
      'Prefira produtos com embalagens recicláveis ou biodegradáveis.',
      'Pratique a compostagem de resíduos orgânicos para reduzir o lixo.',
      'Plante árvores ou mantenha plantas em casa para melhorar o ar.',
      'Opte por meios de transporte sustentáveis, como bicicleta ou caminhada.',
      'Evite o uso de sacolas plásticas e prefira ecobags.',
    ],
  };

  const getDailyTip = () => {
    const category = currentGoal ? currentGoal.type : 'Geral';
    const availableTips = categorizedTips[category] || categorizedTips['Geral'];
    const now = new Date();
    const dayOfYear = Math.floor(
      (now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24),
    );
    return availableTips[dayOfYear % availableTips.length];
  };

  const dailyTip = getDailyTip();

  const chartConsumptions = consumptions.slice(0, 5).reverse();
  const barData = {
    labels:
      chartConsumptions.length > 0
        ? chartConsumptions.map(
            c => c.date.split('/')[0] + '/' + c.date.split('/')[1],
          )
        : ['-'],
    datasets: [
      {
        data:
          chartConsumptions.length > 0
            ? chartConsumptions.map(c => Number(c.value) || 0)
            : [0],
        colors: chartConsumptions.map((_, i) =>
          i % 2 === 0
            ? () => colors.chart.barBlue
            : () => colors.chart.barOrange,
        ),
      },
    ],
  };

  return (
    <AppLayout>
      <TouchableOpacity onPress={() => navigation.navigate('Consumption')}>
        <Card>
          <View style={styles.cardHeaderArea}>
            <View
              style={[
                styles.headerIconCircle,
                { backgroundColor: colors.secondary + '10' },
              ]}>
              <FontAwesome5
                name="chart-line"
                size={12}
                color={colors.secondary}
              />
            </View>
            <Text style={[styles.cardHeaderText, { color: colors.text }]}>
              Consumo Recentes
            </Text>
          </View>
          <View style={{ marginBottom: 15, paddingHorizontal: 5 }}>
            <Text style={{ color: colors.textLight, fontSize: 12 }}>
              Último registro
            </Text>
            <Text
              style={{ color: colors.text, fontSize: 20, fontWeight: 'bold' }}>
              {latestConsumption.value}{' '}
              <Text style={{ fontSize: 14, color: colors.secondary }}>
                {latestConsumption.unit}
              </Text>
            </Text>
          </View>
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

      <TouchableOpacity onPress={() => navigation.navigate('Simulated')}>
        <Card>
          <View style={styles.cardHeaderArea}>
            <View
              style={[
                styles.headerIconCircle,
                { backgroundColor: colors.secondary + '10' },
              ]}>
              <FontAwesome5 name="vial" size={12} color={colors.secondary} />
            </View>
            <Text style={[styles.cardHeaderText, { color: colors.text }]}>
              Simulador
            </Text>
          </View>
          <LineChart
            data={{
              labels:
                simulations.length > 0
                  ? simulations
                      .slice(0, 5)
                      .reverse()
                      .map(
                        c => c.date.split('/')[0] + '/' + c.date.split('/')[1],
                      )
                  : ['-'],
              datasets: [
                {
                  data:
                    simulations.length > 0
                      ? simulations
                          .slice(0, 5)
                          .reverse()
                          .map(c => Number(c.value) || 0)
                      : [0],
                },
              ],
            }}
            width={screenWidth}
            height={180}
            chartConfig={getChartConfig(colors)}
            bezier
            style={styles.chart}
          />
        </Card>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Goals')}>
        <Card>
          <View style={styles.cardHeaderArea}>
            <View
              style={[
                styles.headerIconCircle,
                { backgroundColor: colors.secondary + '10' },
              ]}>
              <FontAwesome5
                name="bullseye"
                size={12}
                color={colors.secondary}
              />
            </View>
            <Text style={[styles.cardHeaderText, { color: colors.text }]}>
              Meta Atual
            </Text>
          </View>
          {currentGoal ? (
            <View style={styles.metaContentRow}>
              <View style={styles.metaDetailsGroup}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginBottom: 15,
                  }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.secondary + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <FontAwesome5
                      name={currentGoal.type === 'Água' ? 'faucet' : 'bolt'}
                      size={14}
                      color={colors.secondary}
                    />
                  </View>
                  <View>
                    <Text style={{ color: colors.textLight, fontSize: 11 }}>
                      Objetivo
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: '700',
                        fontSize: 15,
                      }}>
                      {currentGoal.value} {currentGoal.unit}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.success + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <FontAwesome5
                      name="calendar-alt"
                      size={14}
                      color={colors.success}
                    />
                  </View>
                  <View>
                    <Text style={{ color: colors.textLight, fontSize: 11 }}>
                      Prazo
                    </Text>
                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: '700',
                        fontSize: 15,
                      }}>
                      {currentGoal.end}
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.progressBox}>
                <CircularProgress
                  percentage={currentGoal.progress}
                  radius={42}
                  color={colors.progress.orange}
                />
              </View>
            </View>
          ) : (
            <Text
              style={{
                color: colors.textLight,
                textAlign: 'center',
                padding: 20,
              }}>
              Nenhuma meta definida
            </Text>
          )}
        </Card>
      </TouchableOpacity>

      <Text style={[styles.listHeaderTitle, { color: colors.text }]}>
        Dica do dia
      </Text>
      <Card
        style={{
          marginBottom: 20,
          borderLeftWidth: 5,
          borderLeftColor: '#FFD700',
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 5,
          }}>
          <View
            style={{
              backgroundColor: '#FFD70020',
              padding: 10,
              borderRadius: 12,
              marginRight: 15,
            }}>
            <FontAwesome5 name="lightbulb" size={20} color="#FFD700" />
          </View>
          <Text
            style={[
              styles.tipTextItem,
              { color: colors.text, fontWeight: '500' },
            ]}>
            {dailyTip}
          </Text>
        </View>
      </Card>
    </AppLayout>
  );
};

export const ConsumptionScreen = () => {
  const { colors } = useTheme();
  const { consumptions, addConsumption, updateConsumption, deleteConsumption } = useContext(AuthContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [period, setPeriod] = useState('1 sem');
  const [filterType, setFilterType] = useState('Todos');
  const [editingItem, setEditingItem] = useState(null);

  const filterDataByPeriod = (data, periodStr) => {
    const now = new Date();
    let days = 7;
    if (periodStr.includes('2 sem')) days = 14;
    else if (periodStr.includes('3 sem')) days = 21;
    else if (periodStr.includes('1 mês')) days = 30;
    else if (periodStr.includes('3 meses')) days = 90;
    else if (periodStr.includes('6 meses')) days = 180;
    else if (periodStr.includes('9 meses')) days = 270;
    else if (periodStr.includes('1 ano')) days = 365;
    else if (periodStr.includes('2 anos')) days = 730;

    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data
      .filter(item => {
        const [day, month, year] = item.date.split('/').map(Number);
        const itemDate = new Date(year, month - 1, day);
        return itemDate >= cutoff;
      })
      .reverse();
  };

  const typeFiltered = filterType === 'Todos'
    ? consumptions
    : consumptions.filter(item => item.type === filterType);

  const filteredConsumptions = filterDataByPeriod(typeFiltered, period);

  const handleAdd = data => {
    if (data.id) {
      updateConsumption(data);
    } else {
      addConsumption(data);
    }
    setModalVisible(false);
    setEditingItem(null);
  };

  const confirmDelete = id => {
    Alert.alert('Excluir', 'Deseja realmente excluir este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive', 
        onPress: () => deleteConsumption(id) 
      },
    ]);
  };

  const FilterTypeSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {['Todos', 'Água', 'Energia', 'Gás'].map(type => (
        <TouchableOpacity
          key={type}
          onPress={() => setFilterType(type)}
          style={[
            styles.filterChip,
            { 
              backgroundColor: filterType === type ? colors.secondary : 'transparent',
              borderColor: filterType === type ? colors.secondary : colors.border
            }
          ]}
        >
          <Text style={[
            styles.filterChipText, 
            { color: filterType === type ? '#fff' : colors.textLight }
          ]}>
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>
        Consumos
      </Text>
      <FilterTypeSelector />
      <AddButtonFull
        onPress={() => {
          setEditingItem(null);
          setModalVisible(true);
        }}
      />
      <Card>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5 name="history" size={12} color={colors.secondary} />
          </View>
          <Text
            style={[styles.cardHeaderText, { color: colors.text, flex: 1 }]}>
            Análise Temporal
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
          {[
            '1 sem',
            '2 sem',
            '3 sem',
            '1 mês',
            '3 meses',
            '6 meses',
            '9 meses',
            '1 ano',
            '2 anos',
          ].map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setPeriod(option)}
              style={[
                styles.periodChip,
                {
                  backgroundColor:
                    period === option ? colors.secondary : colors.border + '30',
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
          ))}
        </ScrollView>
        <BarChart
          data={{
            labels:
              filteredConsumptions.length > 0
                ? filteredConsumptions.map(
                    c => c.date.split('/')[0] + '/' + c.date.split('/')[1],
                  )
                : ['-'],
            datasets: [
              {
                data:
                  filteredConsumptions.length > 0
                    ? filteredConsumptions.map(c => Number(c.value) || 0)
                    : [0],
              },
            ],
          }}
          width={screenWidth}
          height={180}
          chartConfig={getChartConfig(colors)}
          fromZero
          style={styles.chart}
        />
      </Card>
      <Card style={{ marginTop: 10 }}>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5
              name="calendar-alt"
              size={12}
              color={colors.secondary}
            />
          </View>
          <Text style={[styles.cardHeaderText, { color: colors.text }]}>
            Registros atuais
          </Text>
        </View>
        {(() => {
          const today = new Date().toLocaleDateString('pt-BR');
          const todayItems = typeFiltered.filter(item => item.date === today);

          return todayItems.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: colors.textLight, textAlign: 'center' }}>
                Não há registro atual
              </Text>
            </View>
          ) : (
            todayItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.innerListItemExtended,
                  idx !== todayItems.length - 1 && styles.innerDividerExtended,
                ]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 15,
                  }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.secondary + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <FontAwesome5
                      name={item.type === 'Água' ? 'faucet' : 'bolt'}
                      size={14}
                      color={colors.secondary}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        minWidth: 0,
                      }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: '700',
                          fontSize: 16,
                        }}>
                        {item.type}
                      </Text>
                      {item.description ? (
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={{
                            color: colors.textLight,
                            fontSize: 15,
                            marginLeft: 8,
                            flex: 1,
                            flexShrink: 1,
                            minWidth: 0,
                            fontWeight: '600',
                          }}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={{
                        color: colors.textLight,
                        fontSize: 13,
                        marginTop: 4,
                      }}>
                      {item.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItem(item);
                      setModalVisible(true);
                    }}
                    style={[styles.actionBtn, { backgroundColor: colors.secondary + '20' }]}>
                    <FontAwesome5 name="pen" size={12} color={colors.secondary} />
                    <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item.id)}
                    style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}>
                    <FontAwesome5 name="trash-alt" size={12} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: colors.secondary + '10',
                    padding: 12,
                    borderRadius: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.secondary,
                  }}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    Consumo:{' '}
                    <Text
                      style={{ fontWeight: 'bold', color: colors.secondary }}>
                      {item.value} {item.unit}
                    </Text>
                  </Text>
                </View>
              </View>
            ))
          );
        })()}
      </Card>

      <Card style={{ marginTop: 20 }}>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5 name="history" size={12} color={colors.secondary} />
          </View>
          <Text style={[styles.cardHeaderText, { color: colors.text }]}>
            Registros anteriores
          </Text>
        </View>
        {(() => {
          const today = new Date().toLocaleDateString('pt-BR');
          const olderItems = typeFiltered.filter(item => item.date !== today);

          return olderItems.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: colors.textLight, textAlign: 'center' }}>
                Não há registros anteriores
              </Text>
            </View>
          ) : (
            olderItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.innerListItemExtended,
                  idx !== olderItems.length - 1 && styles.innerDividerExtended,
                ]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 15,
                  }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <FontAwesome5
                      name={item.type === 'Água' ? 'faucet' : 'bolt'}
                      size={14}
                      color={colors.textLight}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        minWidth: 0,
                      }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: '700',
                          fontSize: 15,
                        }}>
                        {item.type}
                      </Text>
                      {item.description ? (
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={{
                            color: colors.textLight,
                            fontSize: 14,
                            marginLeft: 8,
                            flex: 1,
                            flexShrink: 1,
                            minWidth: 0,
                          }}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={{
                        color: colors.textLight,
                        fontSize: 12,
                        marginTop: 4,
                      }}>
                      {item.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItem(item);
                      setModalVisible(true);
                    }}
                    style={[styles.actionBtn, { backgroundColor: colors.border + '50' }]}>
                    <FontAwesome5 name="pen" size={11} color={colors.textLight} />
                    <Text style={[styles.actionBtnText, { color: colors.textLight }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item.id)}
                    style={[styles.actionBtn, { backgroundColor: colors.danger + '10' }]}>
                    <FontAwesome5 name="trash-alt" size={11} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: colors.border + '30',
                    padding: 12,
                    borderRadius: 12,
                  }}>
                  <Text style={{ color: colors.textLight, fontSize: 14 }}>
                    Consumo:{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {item.value} {item.unit}
                    </Text>
                  </Text>
                </View>
              </View>
            ))
          );
        })()}
      </Card>
      <AddModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        title="Adicionar Consumo"
        onAdd={handleAdd}
        initialData={editingItem}
      />
    </AppLayout>
  );
};

export const SimulatedScreen = () => {
  const { colors } = useTheme();
  const { simulations, addSimulation, updateSimulation, deleteSimulation } = useContext(AuthContext);
  const [editingItem, setEditingItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterType, setFilterType] = useState('Todos');
  const [period, setPeriod] = useState('1 sem');

  const filterDataByPeriod = (data, periodStr) => {
    const now = new Date();
    let days = 7;
    if (periodStr.includes('2 sem')) days = 14;
    else if (periodStr.includes('3 sem')) days = 21;
    else if (periodStr.includes('1 mês')) days = 30;
    else if (periodStr.includes('3 meses')) days = 90;
    else if (periodStr.includes('6 meses')) days = 180;
    else if (periodStr.includes('9 meses')) days = 270;
    else if (periodStr.includes('1 ano')) days = 365;
    else if (periodStr.includes('2 anos')) days = 730;

    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data
      .filter(item => {
        const [day, month, year] = item.date.split('/').map(Number);
        const itemDate = new Date(year, month - 1, day);
        return itemDate >= cutoff;
      })
      .reverse();
  };

  const typeFiltered = filterType === 'Todos'
    ? simulations
    : simulations.filter(item => item.type === filterType);

  const filteredSimulations = filterDataByPeriod(typeFiltered, period);

  const handleAdd = data => {
    if (data.id) {
      updateSimulation(data);
    } else {
      addSimulation(data);
    }
    setModalVisible(false);
    setEditingItem(null);
  };

  const confirmDelete = id => {
    Alert.alert('Excluir Simulação', 'Deseja apagar este registro?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => deleteSimulation(id) },
    ]);
  };

  const FilterTypeSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {['Todos', 'Água', 'Energia', 'Gás'].map(type => (
        <TouchableOpacity
          key={type}
          onPress={() => setFilterType(type)}
          style={[
            styles.filterChip,
            { 
              backgroundColor: filterType === type ? colors.secondary : 'transparent',
              borderColor: filterType === type ? colors.secondary : colors.border
            }
          ]}
        >
          <Text style={[
            styles.filterChipText, 
            { color: filterType === type ? '#fff' : colors.textLight }
          ]}>
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>
        Simulador
      </Text>
      <FilterTypeSelector />
      <AddButtonFull
        onPress={() => {
          setEditingItem(null);
          setModalVisible(true);
        }}
      />
      <Card>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5 name="history" size={12} color={colors.secondary} />
          </View>
          <Text
            style={[styles.cardHeaderText, { color: colors.text, flex: 1 }]}>
            Análise Temporal
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
          {[
            '1 sem',
            '2 sem',
            '3 sem',
            '1 mês',
            '3 meses',
            '6 meses',
            '9 meses',
            '1 ano',
            '2 anos',
          ].map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setPeriod(option)}
              style={[
                styles.periodChip,
                {
                  backgroundColor:
                    period === option ? colors.secondary : colors.border + '30',
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
          ))}
        </ScrollView>
        <LineChart
          data={{
            labels:
              filteredSimulations.length > 0
                ? filteredSimulations.map(
                    c => c.date.split('/')[0] + '/' + c.date.split('/')[1],
                  )
                : ['-'],
            datasets: [
              {
                data:
                  filteredSimulations.length > 0
                    ? filteredSimulations.map(c => Number(c.value) || 0)
                    : [0],
                color: () => colors.chart.barOrange,
              },
            ],
          }}
          width={screenWidth}
          height={180}
          chartConfig={getChartConfig(colors)}
          bezier
          style={styles.chart}
        />
      </Card>
      <Card style={{ marginTop: 10 }}>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5
              name="clipboard-list"
              size={12}
              color={colors.secondary}
            />
          </View>
          <Text style={[styles.cardHeaderText, { color: colors.text }]}>
            Registros atuais
          </Text>
        </View>
        {(() => {
          const today = new Date().toLocaleDateString('pt-BR');
          const todayItems = typeFiltered.filter(item => item.date === today);

          return todayItems.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: colors.textLight, textAlign: 'center' }}>
                Não há registro atual
              </Text>
            </View>
          ) : (
            todayItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.innerListItemExtended,
                  idx !== todayItems.length - 1 && styles.innerDividerExtended,
                ]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 15,
                  }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.secondary + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <FontAwesome5
                      name={item.type === 'Água' ? 'faucet' : 'bolt'}
                      size={14}
                      color={colors.secondary}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        minWidth: 0,
                      }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: '700',
                          fontSize: 16,
                        }}>
                        {item.type}
                      </Text>
                      {item.description ? (
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={{
                            color: colors.textLight,
                            fontSize: 14,
                            marginLeft: 8,
                            flex: 1,
                            flexShrink: 1,
                            minWidth: 0,
                            fontWeight: '600',
                          }}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={{
                        color: colors.textLight,
                        fontSize: 12,
                        marginTop: 4,
                      }}>
                      {item.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItem(item);
                      setModalVisible(true);
                    }}
                    style={[styles.actionBtn, { backgroundColor: colors.secondary + '20' }]}>
                    <FontAwesome5 name="pen" size={12} color={colors.secondary} />
                    <Text style={[styles.actionBtnText, { color: colors.secondary }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item.id)}
                    style={[styles.actionBtn, { backgroundColor: colors.danger + '15' }]}>
                    <FontAwesome5 name="trash-alt" size={12} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: colors.secondary + '10',
                    padding: 12,
                    borderRadius: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.secondary,
                  }}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    Simulação:{' '}
                    <Text
                      style={{ fontWeight: 'bold', color: colors.secondary }}>
                      {item.value} {item.unit}
                    </Text>
                  </Text>
                </View>
              </View>
            ))
          );
        })()}
      </Card>

      <Card style={{ marginTop: 20 }}>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5 name="history" size={12} color={colors.secondary} />
          </View>
          <Text style={[styles.cardHeaderText, { color: colors.text }]}>
            Registros anteriores
          </Text>
        </View>
        {(() => {
          const today = new Date().toLocaleDateString('pt-BR');
          const olderItems = typeFiltered.filter(item => item.date !== today);

          return olderItems.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: colors.textLight, textAlign: 'center' }}>
                Não há registros anteriores
              </Text>
            </View>
          ) : (
            olderItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.innerListItemExtended,
                  idx !== olderItems.length - 1 && styles.innerDividerExtended,
                ]}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-start',
                    marginBottom: 15,
                  }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      backgroundColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}>
                    <FontAwesome5
                      name={item.type === 'Água' ? 'faucet' : 'bolt'}
                      size={14}
                      color={colors.textLight}
                    />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        flex: 1,
                        minWidth: 0,
                      }}>
                      <Text
                        style={{
                          color: colors.text,
                          fontWeight: '700',
                          fontSize: 15,
                        }}>
                        {item.type}
                      </Text>
                      {item.description ? (
                        <Text
                          numberOfLines={2}
                          ellipsizeMode="tail"
                          style={{
                            color: colors.textLight,
                            fontSize: 14,
                            marginLeft: 8,
                            flex: 1,
                            flexShrink: 1,
                            minWidth: 0,
                          }}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    <Text
                      style={{
                        color: colors.textLight,
                        fontSize: 12,
                        marginTop: 4,
                      }}>
                      {item.date}
                    </Text>
                  </View>
                </View>
                <View style={styles.actionButtonsRow}>
                  <TouchableOpacity
                    onPress={() => {
                      setEditingItem(item);
                      setModalVisible(true);
                    }}
                    style={[styles.actionBtn, { backgroundColor: colors.border + '50' }]}>
                    <FontAwesome5 name="pen" size={11} color={colors.textLight} />
                    <Text style={[styles.actionBtnText, { color: colors.textLight }]}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmDelete(item.id)}
                    style={[styles.actionBtn, { backgroundColor: colors.danger + '10' }]}>
                    <FontAwesome5 name="trash-alt" size={11} color={colors.danger} />
                    <Text style={[styles.actionBtnText, { color: colors.danger }]}>Excluir</Text>
                  </TouchableOpacity>
                </View>
                <View
                  style={{
                    backgroundColor: colors.border + '30',
                    padding: 12,
                    borderRadius: 12,
                  }}>
                  <Text style={{ color: colors.textLight, fontSize: 14 }}>
                    Simulação:{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {item.value} {item.unit}
                    </Text>
                  </Text>
                </View>
              </View>
            ))
          );
        })()}
      </Card>
      <AddModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        title="Adicionar ao Simulador"
        onAdd={handleAdd}
        initialData={editingItem}
      />
    </AppLayout>
  );
};

export const GoalsScreen = () => {
  const { colors } = useTheme();
  const { goals, addGoal, updateGoal, deleteGoal } = useContext(AuthContext);
  const [period, setPeriod] = useState('1 sem');
  const [filterType, setFilterType] = useState('Todos');
  const [editingItem, setEditingItem] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const filterDataByPeriod = (data, periodStr) => {
    const now = new Date();
    let days = 7;
    if (periodStr.includes('2 sem')) days = 14;
    else if (periodStr.includes('3 sem')) days = 21;
    else if (periodStr.includes('1 mês')) days = 30;
    else if (periodStr.includes('3 meses')) days = 90;
    else if (periodStr.includes('6 meses')) days = 180;
    else if (periodStr.includes('9 meses')) days = 270;
    else if (periodStr.includes('1 ano')) days = 365;
    else if (periodStr.includes('2 anos')) days = 730;

    const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return data.filter(item => {
      const [day, month, year] = item.start.split('/').map(Number);
      const itemDate = new Date(year, month - 1, day);
      return itemDate >= cutoff;
    });
  };

  const typeFiltered = filterType === 'Todos'
    ? goals
    : goals.filter(item => item.type === filterType);

  const filteredGoalsForChart = filterDataByPeriod(typeFiltered, period);

  const handleAdd = data => {
    if (data.id) {
      updateGoal(data);
    } else {
      addGoal(data);
    }
    setModalVisible(false);
    setEditingItem(null);
  };

  const confirmDelete = id => {
    Alert.alert('Excluir Meta', 'Tem certeza que deseja apagar esta meta?', [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Excluir', 
        style: 'destructive', 
        onPress: () => deleteGoal(id) 
      },
    ]);
  };

  const FilterTypeSelector = () => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
      {['Todos', 'Água', 'Energia', 'Gás'].map(type => (
        <TouchableOpacity
          key={type}
          onPress={() => setFilterType(type)}
          style={[
            styles.filterChip,
            { 
              backgroundColor: filterType === type ? colors.secondary : 'transparent',
              borderColor: filterType === type ? colors.secondary : colors.border
            }
          ]}
        >
          <Text style={[
            styles.filterChipText, 
            { color: filterType === type ? '#fff' : colors.textLight }
          ]}>
            {type}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  return (
    <AppLayout>
      <Text style={[styles.screenTitleText, { color: colors.text }]}>
        Metas
      </Text>
      <FilterTypeSelector />
      <AddButtonFull
        onPress={() => {
          setEditingItem(null);
          setModalVisible(true);
        }}
      />

      <Card style={{ marginBottom: 20 }}>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5
              name="chart-line"
              size={12}
              color={colors.secondary}
            />
          </View>
          <Text
            style={[styles.cardHeaderText, { color: colors.text, flex: 1 }]}>
            Evolução das Metas (%)
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
          {[
            '1 sem',
            '2 sem',
            '3 sem',
            '1 mês',
            '3 meses',
            '6 meses',
            '9 meses',
            '1 ano',
            '2 anos',
          ].map(option => (
            <TouchableOpacity
              key={option}
              onPress={() => setPeriod(option)}
              style={[
                styles.periodChip,
                {
                  backgroundColor:
                    period === option ? colors.secondary : colors.border + '30',
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
          ))}
        </ScrollView>
        {(() => {
          const calculateProgressData = () => {
            const now = new Date();
            let days = 7;
            if (period === '2 sem') days = 14;
            else if (period === '3 sem') days = 21;
            else if (period === '1 mês') days = 30;
            else if (period === '6 meses') days = 180;
            else if (period === '1 ano') days = 365;

            const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
            const activeGoals = filteredGoalsForChart.filter(goal => {
              const [sd, sm, sy] = String(goal.start || '')
                .split('/')
                .map(Number);
              const [ed, em, ey] = String(goal.end || '')
                .split('/')
                .map(Number);
              if (!sd || !sm || !sy || !ed || !em || !ey) return false;
              const startDate = new Date(sy, sm - 1, sd);
              const endDate = new Date(ey, em - 1, ed);
              return endDate >= cutoff && startDate <= now;
            });

            if (activeGoals.length === 0) return { labels: [], data: [] };

            const weeks = [];
            const current = new Date(cutoff);
            while (current <= now) {
              weeks.push(new Date(current));
              current.setDate(current.getDate() + 7);
            }

            const labels = weeks.map(
              week => `${week.getDate()}/${week.getMonth() + 1}`,
            );
            const data = weeks.map(week => {
              const weekGoals = activeGoals.filter(goal => {
                const [sd, sm, sy] = String(goal.start || '')
                  .split('/')
                  .map(Number);
                const [ed, em, ey] = String(goal.end || '')
                  .split('/')
                  .map(Number);
                if (!sd || !sm || !sy || !ed || !em || !ey) return false;
                const startDate = new Date(sy, sm - 1, sd);
                const endDate = new Date(ey, em - 1, ed);
                return startDate <= week && endDate >= week;
              });

              if (weekGoals.length === 0) return 0;
              const totalProgress = weekGoals.reduce(
                (sum, goal) => sum + (Number(goal.progress) || 0),
                0,
              );
              return Math.min(
                100,
                Math.round(totalProgress / weekGoals.length),
              );
            });

            return { labels, data };
          };

          const progressData = calculateProgressData();
          if (progressData.labels.length === 0)
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
            <LineChart
              data={{
                labels: progressData.labels,
                datasets: [
                  {
                    data: progressData.data,
                    color: () => `rgba(25, 118, 210, 1)`,
                    strokeWidth: 3,
                  },
                ],
              }}
              width={screenWidth}
              height={180}
              chartConfig={{
                ...getChartConfig(colors),
                backgroundGradientFromOpacity: 0,
                backgroundGradientToOpacity: 0,
                fillShadowGradient: 'rgba(25, 118, 210, 0.18)',
                fillShadowGradientOpacity: 1,
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: colors.card,
                },
                formatYLabel: y => `${y}%`,
                decimalPlaces: 0,
              }}
              bezier
              style={[styles.chart, { backgroundColor: 'transparent' }]}
              withDots={true}
              withShadow={true}
              withInnerLines={true}
              withOuterLines={false}
              fromZero={true}
              yAxisSuffix="%"
              yAxisInterval={1}
              renderDotContent={({ x, y, index }) => (
                <Text
                  key={`dot-${index}`}
                  style={{
                    position: 'absolute',
                    top: y - 24,
                    left: x - 14,
                    color: colors.text,
                    fontSize: 10,
                    fontWeight: '700',
                  }}>
                  {progressData.data[index]}%
                </Text>
              )}
            />
          );
        })()}
      </Card>

      <Card style={{ marginTop: 10 }}>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5 name="bullseye" size={12} color={colors.secondary} />
          </View>
          <Text style={[styles.cardHeaderText, { color: colors.text }]}>
            Metas atuais
          </Text>
        </View>
        {(() => {
          const today = new Date().toLocaleDateString('pt-BR');
          const todayGoals = typeFiltered.filter(g => g.start === today);

          return todayGoals.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: colors.textLight, textAlign: 'center' }}>
                Não há meta atual
              </Text>
            </View>
          ) : (
            todayGoals.map((goal, idx) => (
              <View
                key={goal.id}
                style={[
                  styles.innerListItemExtended,
                  idx !== todayGoals.length - 1 && styles.innerDividerExtended,
                ]}>
                <View style={styles.metaContentRow}>
                  <View style={styles.metaDetailsGroup}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: colors.secondary + '15',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                        <FontAwesome5
                          name={goal.type === 'Água' ? 'faucet' : 'bolt'}
                          size={12}
                          color={colors.secondary}
                        />
                      </View>
                      <View>
                        <Text style={{ color: colors.textLight, fontSize: 10 }}>
                          Recurso
                        </Text>
                        <Text style={{ color: colors.text, fontWeight: '700' }}>
                          {goal.type}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: colors.success + '15',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                        <FontAwesome5
                          name="calendar-alt"
                          size={12}
                          color={colors.success}
                        />
                      </View>
                      <View>
                        <Text style={{ color: colors.textLight, fontSize: 10 }}>
                          Período
                        </Text>
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: '700',
                            fontSize: 12,
                          }}>
                          {goal.start} - {goal.end}
                        </Text>
                      </View>
                    </View>
                  </View>
                <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <CircularProgress
                      percentage={goal.progress}
                      radius={35}
                      color={colors.progress.orange}
                    />
                  <View style={[styles.actionButtonsRow, { marginTop: 10 }]}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingItem(goal);
                          setModalVisible(true);
                        }}
                        style={[styles.actionBtn, { backgroundColor: colors.secondary + '20', paddingHorizontal: 8 }]}>
                        <FontAwesome5 name="pen" size={10} color={colors.secondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => confirmDelete(goal.id)}
                        style={[styles.actionBtn, { backgroundColor: colors.danger + '15', paddingHorizontal: 8 }]}>
                      <Text style={{ color: colors.danger, fontSize: 10, fontWeight: 'bold', marginRight: 4 }}>EXCLUIR</Text>
                        <FontAwesome5 name="trash-alt" size={10} color={colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View
                  style={{
                    marginTop: 15,
                    backgroundColor: colors.secondary + '10',
                    padding: 12,
                    borderRadius: 12,
                    borderLeftWidth: 4,
                    borderLeftColor: colors.secondary,
                  }}>
                  <Text style={{ color: colors.text, fontSize: 14 }}>
                    Meta de consumo:{' '}
                    <Text
                      style={{ fontWeight: 'bold', color: colors.secondary }}>
                      {goal.value} {goal.unit}
                    </Text>
                  </Text>
                </View>
              </View>
            ))
          );
        })()}
      </Card>

      <Card style={{ marginTop: 20 }}>
        <View style={styles.cardHeaderArea}>
          <View
            style={[
              styles.headerIconCircle,
              { backgroundColor: colors.secondary + '10' },
            ]}>
            <FontAwesome5
              name="check-circle"
              size={12}
              color={colors.secondary}
            />
          </View>
          <Text style={[styles.cardHeaderText, { color: colors.text }]}>
            Metas anteriores
          </Text>
        </View>
        {(() => {
          const today = new Date().toLocaleDateString('pt-BR');
          const olderGoals = typeFiltered.filter(g => g.start !== today);

          return olderGoals.length === 0 ? (
            <View style={{ paddingVertical: 10 }}>
              <Text style={{ color: colors.textLight, textAlign: 'center' }}>
                Não há metas anteriores
              </Text>
            </View>
          ) : (
            olderGoals.map((goal, idx) => (
              <View
                key={goal.id}
                style={[
                  styles.innerListItemExtended,
                  idx !== olderGoals.length - 1 && styles.innerDividerExtended,
                ]}>
                <View style={styles.metaContentRow}>
                  <View style={styles.metaDetailsGroup}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginBottom: 12,
                      }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                        <FontAwesome5
                          name={goal.type === 'Água' ? 'faucet' : 'bolt'}
                          size={12}
                          color={colors.textLight}
                        />
                      </View>
                      <View>
                        <Text style={{ color: colors.textLight, fontSize: 10 }}>
                          Recurso
                        </Text>
                        <Text style={{ color: colors.text, fontWeight: '700' }}>
                          {goal.type}
                        </Text>
                      </View>
                    </View>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 10,
                          backgroundColor: colors.border,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: 12,
                        }}>
                        <FontAwesome5
                          name="history"
                          size={12}
                          color={colors.textLight}
                        />
                      </View>
                      <View>
                        <Text style={{ color: colors.textLight, fontSize: 10 }}>
                          Período Finalizado
                        </Text>
                        <Text
                          style={{
                            color: colors.text,
                            fontWeight: '700',
                            fontSize: 12,
                          }}>
                          {goal.start} - {goal.end}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ opacity: 0.5 }}>
                    <CircularProgress
                      percentage={goal.progress}
                      radius={35}
                      color={colors.textLight}
                    />
                  </View>
                  <View style={[styles.actionButtonsRow, { marginTop: 10 }]}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingItem(goal);
                        setModalVisible(true);
                      }}
                    style={[styles.actionBtn, { backgroundColor: colors.border + '50' }]}>
                      <FontAwesome5 name="pen" size={10} color={colors.textLight} />
                      <Text style={[styles.actionBtnText, { color: colors.textLight }]}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDelete(goal.id)}
                      style={[styles.actionBtn, { backgroundColor: colors.danger + '10' }]}>
                      <FontAwesome5 name="trash-alt" size={10} color={colors.danger} />
                      <Text style={[styles.actionBtnText, { color: colors.danger }]}>Excluir</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <View
                  style={{
                    marginTop: 15,
                    backgroundColor: colors.border + '30',
                    padding: 12,
                    borderRadius: 12,
                  }}>
                  <Text style={{ color: colors.textLight, fontSize: 14 }}>
                    Meta atingida:{' '}
                    <Text style={{ fontWeight: 'bold' }}>
                      {goal.value} {goal.unit}
                    </Text>
                  </Text>
                </View>
              </View>
            ))
          );
        })()}
      </Card>

      <AddModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingItem(null);
        }}
        title="Adicionar Meta"
        onAdd={handleAdd}
        initialData={editingItem}
      />
    </AppLayout>
  );
};

export const SettingsScreen = () => {
  const { logout, userData, updateProfile, deleteAccount, photo, setPhoto } =
    useContext(AuthContext);
  const { isDarkMode, setIsDarkMode, colors } = useContext(ThemeContext);
  const [expandedSection, setExpandedSection] = useState(null);

  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [password, setPassword] = useState(userData?.password || '');
  const [profileImage, setProfileImage] = useState(
    photo || userData?.profileImage || null,
  );
  const [saving, setSaving] = useState(false);

  // Sincroniza a imagem de perfil quando a foto é carregada do banco de dados
  useEffect(() => {
    if (photo) {
      setProfileImage(photo);
    }
  }, [photo]);

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
      const uri = result.assets[0].uri;
      setProfileImage(uri);

      // Persistência no Banco de Dados
      try {
        const fileType = uri.split('.').pop();
        const formData = new FormData();
        formData.append('foto', {
          uri,
          name: `user_photo.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });

        // Chama a rota da API (/foto/create)
        await photoService.upload(formData);

        // Sincroniza o estado global no AuthContext
        if (setPhoto) {
          setPhoto(uri);
        }
        Alert.alert('Sucesso', 'Sua foto de perfil foi alterada no servidor!');
      } catch (error) {
        console.error('Erro ao salvar foto:', error);
        Alert.alert('Erro', 'Não foi possível salvar a foto no banco de dados.');
      }
    }
  };

  const handleSave = () => {
    setSaving(true);
    updateProfile({ name, email, password, profileImage });
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    }, 500);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Conta',
      'Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: () => deleteAccount(),
        },
      ],
    );
  };

  const CollapsibleCard = ({ title, icon, sectionKey, children }) => (
    <Card style={{ marginTop: 15, padding: 0, overflow: 'hidden' }}>
      <TouchableOpacity
        style={[
          styles.collapsibleHeader,
          {
            backgroundColor:
              expandedSection === sectionKey
                ? colors.secondary + '10'
                : 'transparent',
          },
        ]}
        onPress={() =>
          setExpandedSection(expandedSection === sectionKey ? null : sectionKey)
        }>
        <View style={styles.collapsibleTitleRow}>
          <View
            style={[
              styles.iconBox,
              { backgroundColor: colors.secondary + '15' },
            ]}>
            <FontAwesome5 name={icon} size={14} color={colors.secondary} />
          </View>
          <Text style={[styles.collapsibleTitle, { color: colors.text }]}>
            {title}
          </Text>
        </View>
        <FontAwesome5
          name={expandedSection === sectionKey ? 'chevron-up' : 'chevron-down'}
          size={12}
          color={colors.textLight}
        />
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
      <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>
        {title}
      </Text>
      {items.map((item, index) => (
        <View key={index} style={styles.legalItemRow}>
          <View
            style={[styles.bullet, { backgroundColor: colors.secondary }]}
          />
          <Text style={[styles.legalItemText, { color: colors.text }]}>
            {item}
          </Text>
        </View>
      ))}
    </View>
  );

  return (
    <AppLayout>
      <View style={styles.profileHeaderContainer}>
        <View style={styles.avatarWrapper}>
          <TouchableOpacity
            onPress={pickImage}
            style={[styles.avatarLarge, { backgroundColor: colors.border }]}>
            {profileImage ? (
              <Image
                source={{ uri: profileImage }}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <FontAwesome5
                name="user-alt"
                size={40}
                color={colors.secondary}
              />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickImage}
            style={[
              styles.avatarPlusBtn,
              { backgroundColor: colors.secondary },
            ]}>
            <FontAwesome5 name="plus" size={12} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.profileNameRow}>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center' }}
            onPress={() =>
              setExpandedSection(
                expandedSection === 'profile_view' ? null : 'profile_view',
              )
            }>
            <Text style={[styles.profileNameText, { color: colors.text }]}>
              {name}
            </Text>
            <FontAwesome5
              name={
                expandedSection === 'profile_view'
                  ? 'chevron-up'
                  : 'chevron-down'
              }
              size={14}
              color={colors.text}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pencilEditBtn,
              { backgroundColor: colors.secondary + '15' },
            ]}
            onPress={() =>
              setExpandedSection(
                expandedSection === 'profile_edit' ? null : 'profile_edit',
              )
            }>
            <FontAwesome5 name="pen" size={14} color={colors.secondary} />
          </TouchableOpacity>
        </View>
      </View>

      {expandedSection === 'profile_view' && (
        <Card style={{ marginTop: 10 }}>
          <View style={{ paddingVertical: 10 }}>
            <View style={{ marginBottom: 15 }}>
              <Text
                style={{
                  color: colors.textLight,
                  fontSize: 12,
                  marginBottom: 2,
                }}>
                Nome de usuário
              </Text>
              <Text
                style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
                {name}
              </Text>
            </View>
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  color: colors.textLight,
                  fontSize: 12,
                  marginBottom: 2,
                }}>
                E-mail cadastrado
              </Text>
              <Text
                style={{ color: colors.text, fontSize: 16, fontWeight: '500' }}>
                {email}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.logoutBtnModern,
                {
                  backgroundColor: colors.danger + '10',
                  borderColor: colors.danger + '30',
                },
              ]}
              onPress={logout}>
              <View
                style={[
                  styles.logoutIconBox,
                  { backgroundColor: colors.danger },
                ]}>
                <FontAwesome5 name="sign-out-alt" size={10} color="#fff" />
              </View>
              <Text
                style={[
                  styles.logoutBtnText,
                  { color: colors.danger, fontWeight: 'bold' },
                ]}>
                Sair da conta
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {expandedSection === 'profile_edit' && (
        <Card style={{ marginTop: 10 }}>
          <View style={styles.editSection}>
            <Text
              style={[
                styles.editLabel,
                { color: colors.text, marginBottom: 15 },
              ]}>
              Editar Perfil
            </Text>
            <Input label="Nome" value={name} onChangeText={setName} />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
            <Input
              label="Nova Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
          <TouchableOpacity
            style={[
              styles.saveProfileBtn,
              { backgroundColor: colors.secondary, marginTop: 10 },
            ]}
            onPress={handleSave}
            disabled={saving}>
            <Text style={styles.btnTextWhite}>
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </Text>
          </TouchableOpacity>
        </Card>
      )}
      <Card style={{ marginTop: 20 }}>
        <View style={styles.modeToggleRow}>
          <Text style={[styles.modeText, { color: colors.text }]}>
            <FontAwesome5 name="moon" size={18} color={colors.text} /> Modo
            Escuro
          </Text>
          <Switch
            value={isDarkMode}
            onValueChange={setIsDarkMode}
            trackColor={{ false: '#767577', true: colors.secondary }}
            thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
          />
        </View>
      </Card>
      <CollapsibleCard
        title="Informações e Ajuda"
        icon="info-circle"
        sectionKey="info">
        <Text
          style={[
            styles.legalSectionTitle,
            { color: colors.secondary, marginTop: 10 },
          ]}>
          Termos de Uso
        </Text>
        <LegalSection
          title="1. Objetivo"
          items={[
            'Auxiliar no controle de gastos',
            'Incentivar práticas sustentáveis',
          ]}
        />
        <LegalSection
          title="2. Cadastro"
          items={['Responsabilidade pelas informações', 'Uso ético']}
        />
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.border, marginVertical: 20 },
          ]}
        />
        <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>
          Política de Privacidade
        </Text>
        <LegalSection
          title="1. Dados"
          items={['Nome e E-mail', 'Gastos inseridos']}
        />
        <View
          style={[
            styles.divider,
            { backgroundColor: colors.border, marginVertical: 20 },
          ]}
        />
        <Text style={[styles.legalSectionTitle, { color: colors.secondary }]}>
          Central de Ajuda
        </Text>
        <LegalSection
          title="Dúvidas?"
          items={['Entre nas FAQ', 'Contate o suporte']}
        />
      </CollapsibleCard>
      <CollapsibleCard title="Suporte" icon="envelope" sectionKey="support">
        <View style={styles.supportBox}>
          <FontAwesome5
            name="headset"
            size={20}
            color={colors.secondary}
            style={{ marginBottom: 10 }}
          />
          <Text style={[styles.supportEmail, { color: colors.secondary }]}>
            suporte.ccn@email.com
          </Text>
        </View>
      </CollapsibleCard>

      <View style={{ marginTop: 20, marginBottom: 40 }}>
        <TouchableOpacity
          onPress={handleDeleteAccount}
          style={[
            styles.deleteAccountButton,
            {
              backgroundColor: colors.secondary + '10',
              borderColor: colors.secondary + '30',
            },
          ]}>
          <View
            style={[
              styles.dangerIconBox,
              { backgroundColor: colors.secondary },
            ]}>
            <FontAwesome5 name="trash-alt" size={12} color="#fff" />
          </View>
          <Text style={[styles.deleteAccountText, { color: colors.secondary }]}>
            Excluir conta permanentemente
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            textAlign: 'center',
            fontSize: 12,
            color: colors.textLight,
            marginTop: 10,
            paddingHorizontal: 40,
          }}>
          Esta ação é irreversível e todos os seus dados serão apagados.
        </Text>
      </View>
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
  tipTextItem: { fontSize: 13, lineHeight: 18, flex: 1 },
  listHeaderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    marginLeft: 5,
  },
  registerEntryTitle: { fontWeight: 'bold', fontSize: 14, marginBottom: 8 },
  registerEntryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  periodSelectorScroll: { marginBottom: 15 },
  innerListItem: { paddingVertical: 12 },
  innerListItemExtended: { paddingVertical: 20 },
  innerDivider: { borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  innerDividerExtended: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    marginBottom: 10,
  },
  periodChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 10,
  },
  periodChipText: { fontSize: 13 },
  cardHeaderArea: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 10,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  headerIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
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
  modeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  modeText: { fontSize: 18, fontWeight: 'bold' },
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
  },
  collapsibleTitleRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  collapsibleTitle: { fontSize: 15, fontWeight: '700' },
  collapsibleContent: { padding: 18, paddingTop: 0 },
  divider: { height: 1, width: '100%', marginBottom: 15, opacity: 0.5 },
  legalSectionTitle: { fontSize: 14, fontWeight: '800', marginBottom: 10 },
  legalItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10,
  },
  legalItemText: { fontSize: 13, lineHeight: 20, flex: 1 },
  supportBox: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  supportEmail: {
    fontSize: 14,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  profileHeaderContainer: { alignItems: 'center', marginVertical: 30 },
  avatarWrapper: { position: 'relative' },
  avatarLarge: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlusBtn: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileNameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 15 },
  profileNameText: { fontSize: 20, fontWeight: 'bold' },
  profileUsernameText: { fontSize: 14, marginTop: 4 },
  pencilEditBtn: { padding: 8, borderRadius: 20, marginLeft: 15 },
  editSection: { marginBottom: 20 },
  editLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    opacity: 0.7,
  },
  profileActionBtns: { marginTop: 10 },
  saveProfileBtn: {
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  logoutBtn: {
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  deleteAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1.5,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  dangerIconBox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deleteAccountText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutBtnModern: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 10,
  },
  logoutIconBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  logoutBtnText: { fontWeight: 'bold' },
  actionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 5,
    marginBottom: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    gap: 5,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  filterScroll: {
    marginBottom: 15,
    paddingLeft: 5,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
});
