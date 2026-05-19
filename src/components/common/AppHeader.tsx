import React, {useState, useEffect, useCallback} from 'react';
import {View, Text, Image, StyleSheet, TouchableOpacity, StatusBar, Modal, FlatList, ActivityIndicator} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Bell, X, CheckCheck, Trash2} from 'lucide-react-native';
import {Colors, Spacing, FontSize, BorderRadius} from '../../theme';
import {notificacoesApi, Notificacao} from '../../api/notificacoes';

const ORANGE = '#ff7700';
const NAVY   = '#0d1b4b';

const logoSrc = require('../../../assets/logo.png');

interface AppHeaderProps {
  section: string;
  subtitle?: string;
  userName: string;
  perfil?: string;
  onUserPress?: () => void;
  onLogoPress?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  section,
  subtitle,
  userName,
  perfil,
  onUserPress,
  onLogoPress,
}) => {
  const insets = useSafeAreaInsets();
  const initials = userName
    .split(' ')
    .map(p => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const PERFIS_COM_NOTIFICACOES = ['producao', 'qualidade', 'expedicao', 'montagem', 'armazem', 'direcao'];
  const showBell = !!perfil && PERFIS_COM_NOTIFICACOES.includes(perfil);

  const [unread, setUnread] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notificacao[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchUnread = useCallback(async () => {
    if (!showBell) return;
    try {
      const count = await notificacoesApi.getUnreadCount(perfil);
      setUnread(count);
    } catch {}
  }, [perfil]);

  useEffect(() => {
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [fetchUnread]);

  const openPanel = async () => {
    if (!showBell) return;
    setPanelOpen(true);
    setLoading(true);
    try {
      const data = await notificacoesApi.getAll(perfil);
      setNotifs(data);
    } catch {}
    setLoading(false);
  };

  const handleMarkAll = async () => {
    if (!perfil || !showBell) return;
    await notificacoesApi.markAllAsRead(perfil);
    setNotifs(prev => prev.map(n => ({...n, lida: true})));
    setUnread(0);
  };

  const handleMarkOne = async (id: number) => {
    await notificacoesApi.markAsRead(id);
    setNotifs(prev => prev.map(n => n.id === id ? {...n, lida: true} : n));
    setUnread(prev => Math.max(0, prev - 1));
  };

  const handleDeleteOne = async (id: number, lida: boolean) => {
    await notificacoesApi.deleteOne(id);
    setNotifs(prev => prev.filter(n => n.id !== id));
    if (!lida) setUnread(prev => Math.max(0, prev - 1));
  };

  const handleDeleteAll = async () => {
    if (!perfil) return;
    await notificacoesApi.deleteAll(perfil);
    setNotifs([]);
    setUnread(0);
  };

  const closePanel = () => {
    setPanelOpen(false);
    fetchUnread();
  };

  return (
    <>
      <StatusBar backgroundColor={NAVY} barStyle="light-content" />
      <View style={[styles.container, {paddingTop: insets.top + Spacing.md}]}>

        {/* Logo */}
        <TouchableOpacity style={styles.logoBox} onPress={onLogoPress} activeOpacity={0.85}>
          <Image source={logoSrc} style={styles.logoImg} resizeMode="contain" />
        </TouchableOpacity>

        {/* Centered title */}
        <View style={styles.center}>
          <Text style={styles.section}>{section}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>

        {/* Right cluster: Bell + User */}
        <View style={styles.rightCluster}>
          {showBell ? (
            <TouchableOpacity style={styles.bellBtn} onPress={openPanel} activeOpacity={0.85}>
              <Bell size={22} color="#fff" strokeWidth={2} />
              {unread > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unread > 99 ? '99+' : unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.userCircle} onPress={onUserPress} activeOpacity={0.85}>
            <Text style={styles.userInitials}>{initials}</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Orange accent strip */}
      <View style={styles.accentStrip} />

      {/* Notifications panel */}
      <Modal visible={panelOpen} animationType="slide" transparent onRequestClose={closePanel}>
        <View style={panel.overlay}>
          <View style={[panel.sheet, {paddingTop: insets.top + 8}]}>

            {/* Header */}
            <View style={panel.header}>
              <Text style={panel.title}>NOTIFICAÇÕES</Text>
              <View style={panel.headerActions}>
                {notifs.some(n => !n.lida) && (
                  <TouchableOpacity onPress={handleMarkAll} style={panel.markAllBtn} activeOpacity={0.8}>
                    <CheckCheck size={16} color={ORANGE} strokeWidth={2.5} />
                    <Text style={panel.markAllText}>Marcar tudo</Text>
                  </TouchableOpacity>
                )}
                {notifs.length > 0 && (
                  <TouchableOpacity onPress={handleDeleteAll} style={panel.markAllBtn} activeOpacity={0.8}>
                    <Trash2 size={16} color="rgba(255,255,255,0.45)" strokeWidth={2} />
                    <Text style={panel.deleteAllText}>Limpar</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={closePanel} style={panel.closeBtn} activeOpacity={0.8}>
                  <X size={22} color="#fff" strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            {/* List */}
            {loading ? (
              <ActivityIndicator color={ORANGE} style={{marginTop: 40}} />
            ) : notifs.length === 0 ? (
              <View style={panel.empty}>
                <Bell size={40} color="rgba(255,255,255,0.2)" strokeWidth={1.5} />
                <Text style={panel.emptyText}>Sem notificações</Text>
              </View>
            ) : (
              <FlatList
                data={notifs}
                keyExtractor={item => String(item.id)}
                contentContainerStyle={{paddingBottom: 32}}
                renderItem={({item}) => (
                  <View style={[panel.item, item.lida && panel.itemRead]}>
                    {!item.lida && <View style={panel.dot} />}
                    <TouchableOpacity
                      style={panel.itemBody}
                      onPress={() => !item.lida && handleMarkOne(item.id)}
                      activeOpacity={item.lida ? 1 : 0.75}
                    >
                      <Text style={[panel.itemTitle, item.lida && panel.itemTitleRead]}>{item.titulo}</Text>
                      <Text style={panel.itemMsg}>{item.mensagem}</Text>
                      <Text style={panel.itemDate}>{new Date(item.criado_em).toLocaleString('pt-PT', {day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit'})}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteOne(item.id, item.lida)} hitSlop={{top: 8, bottom: 8, left: 8, right: 8}} activeOpacity={0.7}>
                      <Trash2 size={15} color="rgba(255,255,255,0.3)" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: NAVY,
    paddingBottom: Spacing.base,
    paddingHorizontal: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  accentStrip: {
    height: 4,
    backgroundColor: ORANGE,
  },
  logoBox: {
    backgroundColor: '#fff',
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImg: {
    width: 100,
    height: 34,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
  },
  section: {
    color: '#fff',
    fontSize: FontSize.md,
    fontFamily: 'Exo2_700Bold',
    letterSpacing: 3,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_400Regular',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  rightCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexShrink: 0,
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: ORANGE,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontFamily: 'Exo2_700Bold',
    lineHeight: 12,
  },
  userCircle: {
    backgroundColor: ORANGE,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  userInitials: {
    color: '#fff',
    fontSize: FontSize.base,
    fontFamily: 'Exo2_700Bold',
  },
});

const panel = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    flex: 1,
    backgroundColor: NAVY,
    marginTop: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    color: '#fff',
    fontSize: FontSize.md,
    fontFamily: 'Exo2_700Bold',
    letterSpacing: 3,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    color: ORANGE,
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_600SemiBold',
  },
  deleteAllText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_600SemiBold',
  },
  closeBtn: {
    padding: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: FontSize.base,
    fontFamily: 'Exo2_400Regular',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.07)',
    gap: 10,
  },
  itemRead: {
    opacity: 0.5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ORANGE,
    marginTop: 5,
    flexShrink: 0,
  },
  itemBody: {
    flex: 1,
    gap: 3,
  },
  itemTitle: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontFamily: 'Exo2_700Bold',
  },
  itemTitleRead: {
    fontFamily: 'Exo2_400Regular',
  },
  itemMsg: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    fontFamily: 'Exo2_400Regular',
    lineHeight: 18,
  },
  itemDate: {
    color: 'rgba(255,255,255,0.35)',
    fontSize: 10,
    fontFamily: 'Exo2_400Regular',
    marginTop: 2,
  },
});
