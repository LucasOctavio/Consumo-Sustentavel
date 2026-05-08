import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Switch,
  Modal,
} from 'react-native';
import { FontAwesome5 } from '@expo/vector-icons';
import { AppLayout } from '../../../components/AppLayout';
import { Card } from '../../../components/Card';
import { Button } from '../../../components/Button';
import { Input } from '../../../components/Input';
import {
  authService,
  consumptionService,
  goalService,
  photoService,
} from '../services/api';
import { AuthContext, ThemeContext } from '../../../navigation/AppNavigator';
import * as ImagePicker from 'expo-image-picker';

export const SettingsScreen = () => {
  const { logout, userData, updateProfile, deleteAccount, photo, setPhoto } =
    useContext(AuthContext);
  const { isDarkMode, setIsDarkMode, colors } = useContext(ThemeContext);
  const [expandedSection, setExpandedSection] = useState(null);
  const [isPhotoEnlarged, setIsPhotoEnlarged] = useState(false);

  const [name, setName] = useState(userData?.name || '');
  const [email, setEmail] = useState(userData?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileImage, setProfileImage] = useState(
    userData?.profileImage || null,
  );
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
      quality: 0.8,
    });

    if (!result.canceled) {
      const asset = result.assets[0];

      // Validação de formato
      const fileType = asset.uri.split('.').pop().toLowerCase();
      if (!['jpg', 'jpeg', 'png'].includes(fileType)) {
        Alert.alert('Erro', 'Apenas imagens JPG ou PNG são permitidas.');
        return;
      }

      // Validação de tamanho (máx 5MB)
      // Nota: No Expo, o tamanho do arquivo nem sempre está disponível no asset de imediato sem o FileSystem
      // Mas podemos tentar fazer o upload e o backend valida também.

      setProfileImage(asset.uri);

      // Upload para o backend
      try {
        const formData = new FormData();
        formData.append('foto', {
          uri: asset.uri,
          name: `user_photo.${fileType}`,
          type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
        });

        await photoService.upload(formData);
        Alert.alert('Sucesso', 'Foto de perfil atualizada!');
      } catch (error) {
        console.error('Erro ao fazer upload da foto:', error);
        Alert.alert('Erro', 'Não foi possível salvar a foto no servidor.');
      }
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await updateProfile({
      name,
      email,
      password: password || undefined,
    });
    setSaving(false);
    if (result.success) {
      Alert.alert('Sucesso', 'Perfil atualizado com sucesso!');
    } else {
      Alert.alert('Erro', result.message);
    }
  };

  const handleDeleteAccount = () => {
    // Primeira confirmação
    Alert.alert(
      'Excluir Conta - PASSO 1/3',
      'Tem certeza que deseja excluir sua conta? Todos os seus dados serão apagados permanentemente.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sim, Tenho Certeza',
          onPress: () => {
            // Segunda confirmação
            Alert.alert(
              'Confirmação Final - PASSO 2/3',
              'Esta ação é IRREVERSÍVEL. Você realmente deseja prosseguir?',
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Sim, Excluir Tudo',
                  style: 'destructive',
                  onPress: () => setExpandedSection('confirm_delete'), // Passo 3: Verificação de identidade
                },
              ],
            );
          },
        },
      ],
    );
  };

  const executeDelete = async () => {
    if (!confirmPassword) {
      Alert.alert(
        'Erro',
        'Por favor, digite sua senha para confirmar a exclusão.',
      );
      return;
    }

    const result = await deleteAccount(confirmPassword);
    if (result.success) {
      Alert.alert(
        'Conta Excluída',
        'Sua conta e todos os dados foram removidos com sucesso.',
      );
    } else {
      Alert.alert('Erro', result.message);
    }
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
            onPress={() =>
              profileImage ? setIsPhotoEnlarged(true) : pickImage()
            }
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.profileNameText, { color: colors.text }]}>
              {name}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.pencilEditBtn,
              { backgroundColor: colors.border + '50' },
            ]}
            onPress={() =>
              setExpandedSection(
                expandedSection === 'profile' ? null : 'profile',
              )
            }>
            <FontAwesome5 name="pen" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={isPhotoEnlarged}
        transparent
        animationType="fade"
        onRequestClose={() => setIsPhotoEnlarged(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsPhotoEnlarged(false)}>
          <View style={styles.enlargedPhotoContainer}>
            <Image
              source={{ uri: profileImage }}
              style={styles.enlargedPhoto}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={styles.closeEnlargeBtn}
              onPress={() => setIsPhotoEnlarged(false)}>
              <FontAwesome5 name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {expandedSection === 'profile' && (
        <Card style={{ marginTop: 10 }}>
          <View style={styles.editSection}>
            <Text style={[styles.editLabel, { color: colors.text }]}>
              Editar Informações
            </Text>
            <Input label="Nome" value={name} onChangeText={setName} />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              editable={false}
            />
            <Input
              label="Nova Senha"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Deixe em branco para manter"
            />
          </View>
          <View style={styles.profileActionBtns}>
            <TouchableOpacity
              style={[
                styles.saveProfileBtn,
                { backgroundColor: colors.secondary },
              ]}
              onPress={handleSave}
              disabled={saving}>
              <Text style={styles.btnTextWhite}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: colors.danger }]}
              onPress={logout}>
              <Text style={[styles.logoutBtnText, { color: colors.danger }]}>
                Sair da conta
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {expandedSection === 'confirm_delete' && (
        <Card
          style={{ marginTop: 10, borderColor: colors.danger, borderWidth: 1 }}>
          <View style={styles.editSection}>
            <Text style={[styles.editLabel, { color: colors.danger }]}>
              Confirmação de Identidade
            </Text>
            <Text
              style={{ color: colors.text, marginBottom: 15, fontSize: 13 }}>
              Para sua segurança, digite sua senha atual para confirmar a
              exclusão definitiva da conta.
            </Text>
            <Input
              label="Sua Senha"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              placeholder="Digite sua senha"
            />
          </View>
          <View style={styles.profileActionBtns}>
            <TouchableOpacity
              style={[
                styles.saveProfileBtn,
                { backgroundColor: colors.danger },
              ]}
              onPress={executeDelete}>
              <Text style={styles.btnTextWhite}>
                CONFIRMAR EXCLUSÃO DEFINITIVA
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.logoutBtn, { borderColor: colors.border }]}
              onPress={() => setExpandedSection(null)}>
              <Text style={[styles.logoutBtnText, { color: colors.textLight }]}>
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
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

      <TouchableOpacity
        onPress={handleDeleteAccount}
        style={styles.deleteAccountButton}>
        <FontAwesome5
          name="trash-alt"
          size={14}
          color={colors.danger}
          style={{ marginRight: 10 }}
        />
        <Text style={[styles.deleteAccountText, { color: colors.danger }]}>
          Excluir Conta Permanentemente
        </Text>
      </TouchableOpacity>
    </AppLayout>
  );
};

const styles = StyleSheet.create({
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
    marginTop: 40,
    marginBottom: 30,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 12,
  },
  deleteAccountText: { fontSize: 14, fontWeight: 'bold' },
  btnTextWhite: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedPhotoContainer: {
    width: '90%',
    height: '70%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  enlargedPhoto: { width: '100%', height: '100%' },
  closeEnlargeBtn: { position: 'absolute', top: -40, right: 0, padding: 10 },
});
