import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import {Header, Card, EmptyState, Button} from '../../components/common';
import {Colors, Spacing, FontSize, FontWeight, BorderRadius} from '../../theme';
import {notificationsApi, Notificacao} from '../../api/notifications';
import {formatRelativeTime} from '../../utils/format';

const TIPO_CONFIG: Record<string, {icon: string; color: string; bg: string}> = {
  info: {icon: 'ℹ️', color: Colors.info, bg: Colors.infoLight},
  sucesso: {icon: '✅', color: Colors.success, bg: Colors.successLight},
  aviso: {icon: '⚠️', color: Colors.warning, bg: Colors.warningLight},
  erro: {icon: '❌', color: Colors.danger, bg: Colors.dangerLight},
};

export const NotificacoesScreen: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    try {
      setNotificacoes(await notificationsApi.getAll());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarcarLida = async (id: number) => {
    await notificationsApi.marcarLida(id);
    setNotificacoes(prev =>
      prev.map(n => (n.id === id ? {...n, lida: true} : n)),
    );
  };

  const handleMarcarTodas = async () => {
    await notificationsApi.marcarTodasLidas();
    setNotificacoes(prev => prev.map(n => ({...n, lida: true})));
  };

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  return (
    <View style={styles.container}>
      <Header
        title="Notificações"
        subtitle={naoLidas > 0 ? `${naoLidas} não lida(s)` : undefined}
        showBack
        rightAction={
          naoLidas > 0 ? (
            <TouchableOpacity onPress={handleMarcarTodas}>
              <Text style={styles.marcarBtn}>Marcar todas</Text>
            </TouchableOpacity>
          ) : undefined
        }
      />

      <FlatList
        data={notificacoes}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={load} colors={[Colors.primary]} />
        }
        ListEmptyComponent={
          <EmptyState
            title="Sem notificações"
            description="Não há notificações por ler."
          />
        }
        renderItem={({item}) => {
          const config = TIPO_CONFIG[item.tipo] ?? TIPO_CONFIG.info;
          return (
            <TouchableOpacity
              onPress={() => !item.lida && handleMarcarLida(item.id)}
              activeOpacity={item.lida ? 1 : 0.7}>
              <Card
                style={[
                  styles.card,
                  !item.lida && styles.cardUnread,
                ]}>
                <View style={styles.row}>
                  <View style={[styles.iconWrap, {backgroundColor: config.bg}]}>
                    <Text style={styles.icon}>{config.icon}</Text>
                  </View>
                  <View style={styles.content}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.titulo, !item.lida && styles.tituloUnread]} numberOfLines={1}>
                        {item.titulo}
                      </Text>
                      {!item.lida && <View style={styles.dot} />}
                    </View>
                    <Text style={styles.mensagem} numberOfLines={2}>
                      {item.mensagem}
                    </Text>
                    <Text style={styles.tempo}>{formatRelativeTime(item.criadaEm)}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: Colors.background},
  marcarBtn: {
    color: Colors.white,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium as any,
    opacity: 0.85,
  },
  list: {padding: Spacing.base, gap: Spacing.sm, paddingBottom: Spacing['3xl']},
  card: {},
  cardUnread: {borderLeftWidth: 3, borderLeftColor: Colors.primaryLight},
  row: {flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md},
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: {fontSize: 18},
  content: {flex: 1},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2},
  titulo: {
    fontSize: FontSize.base,
    color: Colors.gray700,
    fontWeight: FontWeight.medium as any,
    flex: 1,
  },
  tituloUnread: {
    color: Colors.gray900,
    fontWeight: FontWeight.semibold as any,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primaryLight,
    flexShrink: 0,
  },
  mensagem: {fontSize: FontSize.sm, color: Colors.gray500, lineHeight: 18},
  tempo: {fontSize: FontSize.xs, color: Colors.gray400, marginTop: 4},
});
