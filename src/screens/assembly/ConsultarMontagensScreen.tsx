import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, RefreshControl, ActivityIndicator, Image, Alert} from 'react-native';
import {useRouter} from 'expo-router';
import {ChevronDown, Plus, Camera, X} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import {useAppSelector} from '../../store';
import {AppHeader, BottomNavBar} from '../../components/common';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {montagensApi, TarefaMontagem, TarefaEstado} from '../../api/montagens';

const NAVY   = Colors.primary;
const ORANGE = Colors.warning;

const ESTADOS: TarefaEstado[] = ['pendente', 'em_curso', 'concluida', 'suspensa'];

const ESTADO_LABEL: Record<TarefaEstado, string> = {
  pendente:  'Pendente',
  em_curso:  'Em Curso',
  concluida: 'Concluída',
  suspensa:  'Suspensa',
};

const BADGE: Record<TarefaEstado, {bg: string; color: string; border: string}> = {
  pendente:  {bg: '#e0f2fe', color: '#0369a1', border: '#0369a1'},
  em_curso:  {bg: '#fff7ed', color: '#c2410c', border: '#c2410c'},
  concluida: {bg: '#dcfce7', color: '#15803d', border: '#15803d'},
  suspensa:  {bg: '#f3f4f6', color: '#6b7280', border: '#6b7280'},
};

function EstadoBadge({estado, onChange, canEdit}: {estado: TarefaEstado; onChange: (e: TarefaEstado) => void; canEdit: boolean}) {
  const [open, setOpen] = useState(false);
  const b = BADGE[estado] ?? BADGE.pendente;

  if (!canEdit) {
    return (
      <View style={[badgeStyles.badge, {backgroundColor: b.bg, borderColor: b.border}]}>
        <Text style={[badgeStyles.text, {color: b.color}]}>{ESTADO_LABEL[estado]}</Text>
      </View>
    );
  }

  return (
    <View>
      <TouchableOpacity
        style={[badgeStyles.badge, {backgroundColor: b.bg, borderColor: b.border}]}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}>
        <Text style={[badgeStyles.text, {color: b.color}]}>{ESTADO_LABEL[estado]}</Text>
        <ChevronDown size={12} color={b.color} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={badgeStyles.overlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={badgeStyles.menu}>
            {ESTADOS.map(opt => (
              <TouchableOpacity
                key={opt}
                style={[badgeStyles.menuItem, opt === estado && {backgroundColor: NAVY}]}
                onPress={() => {onChange(opt); setOpen(false);}}>
                <Text style={[badgeStyles.menuText, {color: opt === estado ? '#fff' : Colors.gray700}, opt === estado && {fontFamily: 'Exo2_700Bold'}]}>
                  {ESTADO_LABEL[opt]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full, borderWidth: 1.5},
  text: {fontFamily: 'Exo2_700Bold', fontSize: 11},
  overlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center', alignItems: 'center'},
  menu: {backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden', minWidth: 140, shadowColor: '#000', shadowOffset: {width: 0, height: 6}, shadowOpacity: 0.12, shadowRadius: 20, elevation: 8},
  menuItem: {padding: Spacing.md},
  menuText: {fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'},
});

function TarefaCard({t, onEstadoChange, canEdit, onFotos}: {t: TarefaMontagem; onEstadoChange: (id: number, e: TarefaEstado) => void; canEdit: boolean; onFotos: () => void}) {
  const b = BADGE[t.estado] ?? BADGE.pendente;
  return (
    <View style={[cardStyles.card, {borderLeftColor: b.border}]}>
      <View style={cardStyles.body}>
        <View style={{flex: 1, minWidth: 0}}>
          <Text style={cardStyles.titulo}>{t.titulo}</Text>
          {!!t.ordemReferencia && (
            <Text style={cardStyles.op}>OP {t.ordemReferencia}{t.ordemNome ? ` · ${t.ordemNome}` : ''}</Text>
          )}
          {!!t.cliente && <Text style={cardStyles.cliente}>{t.cliente}</Text>}
          {!!t.descricao && <Text style={cardStyles.descricao}>{t.descricao}</Text>}
          {!!t.dataPrevista && (
            <Text style={cardStyles.data}>Previsto: {t.dataPrevista.split('T')[0].split('-').reverse().join('/')}</Text>
          )}
          {!!t.observacoes && <Text style={cardStyles.obs}>{t.observacoes}</Text>}
        </View>
        <EstadoBadge estado={t.estado} onChange={e => onEstadoChange(t.id, e)} canEdit={canEdit} />
      </View>
      <TouchableOpacity style={cardStyles.fotosRow} onPress={onFotos} activeOpacity={0.7}>
        <Camera size={13} color={Colors.gray400} />
        <Text style={cardStyles.fotosText}>Fotos</Text>
      </TouchableOpacity>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {backgroundColor: '#fff', borderRadius: 12, borderLeftWidth: 4, paddingTop: Spacing.md, paddingHorizontal: Spacing.md, shadowColor: '#000', shadowOffset: {width: 0, height: 1}, shadowOpacity: 0.07, shadowRadius: 4, elevation: 2},
  body: {flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start'},
  titulo: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, color: Colors.gray900, marginBottom: 2},
  op: {fontSize: 12, color: NAVY, fontFamily: 'Exo2_600SemiBold', marginBottom: 1},
  cliente: {fontSize: 12, color: Colors.gray600, fontFamily: 'Exo2_400Regular', marginBottom: 2},
  descricao: {fontSize: 11, color: Colors.gray500, fontFamily: 'Exo2_400Regular', marginBottom: 2},
  data: {fontSize: 11, color: ORANGE, fontFamily: 'Exo2_600SemiBold', marginBottom: 2},
  obs: {fontSize: 11, color: Colors.gray400, fontStyle: 'italic'},
  fotosRow: {flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: Spacing.sm, marginTop: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.gray50},
  fotosText: {fontSize: 11, color: Colors.gray400, fontFamily: 'Exo2_400Regular'},
});

export const ConsultarMontagensScreen: React.FC = () => {
  const router = useRouter();
  const user = useAppSelector(s => s.auth.user);
  const canEdit = ['montagem', 'direcao'].includes(user?.perfil ?? '');

  const [tarefas, setTarefas]         = useState<TarefaMontagem[]>([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [fotosModal, setFotosModal]   = useState<TarefaMontagem | null>(null);
  const [fotos, setFotos]             = useState<{id: number; url: string}[]>([]);
  const [fotosLoading, setFotosLoading] = useState(false);
  const [uploading, setUploading]     = useState(false);
  const [previewFoto, setPreviewFoto] = useState<{id: number; url: string} | null>(null);

  const getDisplayName = () => {
    if (!user) return 'Utilizador';
    const parts = user.nome.split(' ');
    return parts.length >= 2 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  };

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await montagensApi.getAll();
      setTarefas(data);
    } catch (e) {
      console.error('Erro ao carregar tarefas de montagem:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openFotos = useCallback(async (tarefa: TarefaMontagem) => {
    setFotosModal(tarefa);
    setFotos([]);
    setFotosLoading(true);
    try {
      setFotos(await montagensApi.getFotos(tarefa.id));
    } catch (e) { console.error(e); }
    finally { setFotosLoading(false); }
  }, []);

  const handleAddFoto = async (source: 'camera' | 'gallery') => {
    if (!fotosModal) return;
    if (source === 'camera') {
      const {status} = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permissão necessária', 'Autoriza o acesso à câmara nas definições.'); return; }
    } else {
      const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') { Alert.alert('Permissão necessária', 'Autoriza o acesso à galeria nas definições.'); return; }
    }
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({mediaTypes: 'images', quality: 0.65, base64: true})
      : await ImagePicker.launchImageLibraryAsync({mediaTypes: 'images', quality: 0.65, base64: true});
    if (result.canceled || !result.assets[0]?.base64) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      await montagensApi.uploadFoto(fotosModal.id, asset.base64!, asset.mimeType ?? 'image/jpeg');
      setFotos(await montagensApi.getFotos(fotosModal.id));
    } catch (e: any) {
      Alert.alert('Erro', e?.message ?? 'Não foi possível fazer upload da foto.');
    } finally { setUploading(false); }
  };

  const askFotoSource = () => {
    Alert.alert('Adicionar Foto', 'Escolhe a fonte', [
      {text: 'Câmara', onPress: () => handleAddFoto('camera')},
      {text: 'Galeria', onPress: () => handleAddFoto('gallery')},
      {text: 'Cancelar', style: 'cancel'},
    ]);
  };

  const handleDeleteFoto = (foto: {id: number; url: string}) => {
    Alert.alert('Eliminar Foto', 'Tens a certeza que queres eliminar esta foto?', [
      {text: 'Cancelar', style: 'cancel'},
      {text: 'Eliminar', style: 'destructive', onPress: async () => {
        try {
          await montagensApi.deleteFoto(foto.id);
          setPreviewFoto(null);
          if (fotosModal) setFotos(await montagensApi.getFotos(fotosModal.id));
        } catch (e: any) {
          Alert.alert('Erro', e?.message ?? 'Não foi possível eliminar a foto.');
        }
      }},
    ]);
  };

  const handleEstadoChange = async (id: number, estado: TarefaEstado) => {
    try {
      await montagensApi.updateEstado(id, estado);
      if (estado === 'concluida') {
        const tarefa = tarefas.find(t => t.id === id);
        if (tarefa?.ordemId) await montagensApi.closeOrdem(tarefa.ordemId);
      }
      setTarefas(prev => prev.map(t => t.id === id ? {...t, estado} : t));
    } catch (e) {
      console.error('Erro ao atualizar estado:', e);
    }
  };

  return (
    <View style={styles.container}>
      <AppHeader
        section="MONTAGEM"
        userName={getDisplayName()}
        onUserPress={() => router.push('/(tabs)/profile')}
        onLogoPress={() => router.push('/(tabs)')}
      />

      <View style={styles.topBar}>
        <Text style={styles.count}>{tarefas.length} TAREFAS DE MONTAGEM</Text>
        {canEdit && (
          <TouchableOpacity style={styles.novaBtn} onPress={() => router.push('/assembly/registar')} activeOpacity={0.85}>
            <Plus size={16} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />}>

        {isLoading && tarefas.length === 0 && (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <ActivityIndicator color={Colors.primary} />
          </View>
        )}
        {!isLoading && tarefas.length === 0 && (
          <View style={{paddingTop: 40, alignItems: 'center'}}>
            <Text style={{color: Colors.gray400, fontSize: FontSize.sm, fontFamily: 'Exo2_400Regular'}}>Sem tarefas de montagem.</Text>
          </View>
        )}
        {tarefas.map(t => (
          <TarefaCard key={t.id} t={t} onEstadoChange={handleEstadoChange} canEdit={canEdit} onFotos={() => openFotos(t)} />
        ))}
      </ScrollView>

      <BottomNavBar />

      {/* Modal único — alterna entre lista de fotos e preview */}
      <Modal
        visible={!!fotosModal}
        transparent
        animationType={previewFoto ? 'fade' : 'slide'}
        hardwareAccelerated
        onRequestClose={() => { if (previewFoto) { setPreviewFoto(null); } else { setFotosModal(null); } }}>

        {previewFoto ? (
          /* ── Preview ── */
          <View style={fotosStyles.previewOverlay}>
            <View style={fotosStyles.previewBox}>
              <View style={fotosStyles.previewNavyHeader}>
                <TouchableOpacity onPress={() => setPreviewFoto(null)} hitSlop={{top:8,bottom:8,left:8,right:8}} style={{flexDirection:'row',alignItems:'center',gap:6}}>
                  <X size={18} color="#fff" />
                  <Text style={{color:'rgba(255,255,255,0.75)',fontFamily:'Exo2_400Regular',fontSize:12}}>Voltar</Text>
                </TouchableOpacity>
                <Text style={fotosStyles.previewNavyTitle}>FOTO</Text>
                <View style={{width: 60}} />
              </View>
              <Image source={{uri: previewFoto.url}} style={fotosStyles.previewImg} resizeMode="contain" />
              {canEdit && (
                <TouchableOpacity style={fotosStyles.previewDeleteBtn} onPress={() => handleDeleteFoto(previewFoto)} activeOpacity={0.85}>
                  <Text style={fotosStyles.previewDeleteText}>ELIMINAR FOTO</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          /* ── Lista de fotos ── */
          <View style={fotosStyles.sheetOverlay}>
            <View style={fotosStyles.sheet}>
              <View style={fotosStyles.sheetHeader}>
                <Text style={fotosStyles.sheetTitle} numberOfLines={1}>{fotosModal?.titulo}</Text>
                <TouchableOpacity onPress={() => setFotosModal(null)} hitSlop={{top:8,bottom:8,left:8,right:8}}>
                  <X size={20} color={Colors.gray500} />
                </TouchableOpacity>
              </View>
              {fotosLoading ? (
                <ActivityIndicator color={NAVY} style={{marginVertical: 32}} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={fotosStyles.grid}>
                  {fotos.length === 0 && <Text style={fotosStyles.empty}>Sem fotos. Adiciona a primeira.</Text>}
                  {fotos.map(f => (
                    <TouchableOpacity key={f.id} onPress={() => setPreviewFoto(f)} activeOpacity={0.8}>
                      <Image source={{uri: f.url}} style={fotosStyles.thumb} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {canEdit && (
                <View style={fotosStyles.actions}>
                  {uploading ? <ActivityIndicator color={NAVY} /> : (
                    <TouchableOpacity style={fotosStyles.addBtn} onPress={askFotoSource} activeOpacity={0.85}>
                      <Camera size={16} color="#fff" />
                      <Text style={fotosStyles.addBtnText}>ADICIONAR FOTO</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
};

const fotosStyles = StyleSheet.create({
  sheetOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end'},
  sheet: {backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: Spacing.lg, paddingBottom: Spacing['3xl'], maxHeight: '70%'},
  sheetHeader: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md},
  sheetTitle: {fontFamily: 'Exo2_700Bold', fontSize: 14, color: NAVY, flex: 1, marginRight: 8},
  grid: {flexDirection: 'row', gap: 8, paddingVertical: Spacing.sm, minHeight: 120, alignItems: 'center'},
  thumb: {width: 100, height: 100, borderRadius: 10, backgroundColor: Colors.gray100},
  empty: {fontSize: FontSize.sm, color: Colors.gray400, fontFamily: 'Exo2_400Regular', paddingVertical: 30, paddingHorizontal: 8},
  actions: {marginTop: Spacing.md, alignItems: 'center'},
  addBtn: {flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: NAVY, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.xl, paddingVertical: 11},
  addBtnText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
  previewOverlay: {flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl},
  previewBox: {backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', width: '100%', maxHeight: '80%'},
  previewNavyHeader: {backgroundColor: NAVY, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.md, paddingVertical: 12},
  previewNavyTitle: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: 12, letterSpacing: 1.5},
  previewImg: {width: '100%', height: 340, backgroundColor: Colors.gray50},
  previewDeleteBtn: {backgroundColor: Colors.danger, margin: Spacing.md, borderRadius: BorderRadius.full, paddingVertical: 12, alignItems: 'center'},
  previewDeleteText: {color: '#fff', fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1},
});

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  topBar: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border},
  count: {fontFamily: 'Exo2_700Bold', fontSize: FontSize.sm, letterSpacing: 1, color: Colors.gray700},
  novaBtn: {backgroundColor: Colors.success, width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  scroll: {flex: 1},
  scrollContent: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
});
