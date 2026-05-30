import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';

// Definindo as propriedades que o card vai receber
interface DemandCardProps {
  title: string;
  description: string;
  location: string;
  quantity: number;
  timeAgo: string;
  isUrgent?: boolean;
  onPressHelp: () => void;
}

export function DemandCard({
  title,
  description,
  location,
  quantity,
  timeAgo,
  isUrgent = false,
  onPressHelp,
}: DemandCardProps) {
  return (
    <View style={styles.cardContainer}>
      {/* Coluna Esquerda: Ícone Circular */}
      <View style={styles.iconWrapper}>
        <Ionicons name="home-outline" size={20} color={Colors.brand.white} />
      </View>

      {/* Coluna Direita: Conteúdo */}
      <View style={styles.contentContainer}>
        
        {/* Linha 1: Título e Tempo */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.timeAgo}>{timeAgo}</Text>
        </View>

        {/* Linha 2: Descrição */}
        <Text style={styles.description} numberOfLines={2}>
          {description}
        </Text>

        {/* Linha 3: Localização */}
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color="#6b7280" />
          <Text style={styles.locationText} numberOfLines={1}>{location}</Text>
        </View>

        {/* Linha 4: Rodapé (Quantidade, Flag e Botão) */}
        <View style={styles.footerRow}>
          
          {/* Lado Esquerdo do Rodapé */}
          <View style={styles.footerInfo}>
            <Text style={styles.quantityText}>Qtd: {quantity}</Text>
            
            {/* Renderização Condicional da Flag de Urgente */}
            {isUrgent && (
              <View style={styles.urgentBadge}>
                <Text style={styles.urgentText}>Urgente</Text>
              </View>
            )}
          </View>

          {/* Lado Direito do Rodapé: Botão de Ação */}
          <TouchableOpacity 
            style={styles.helpButton} 
            activeOpacity={0.8}
            onPress={onPressHelp}
          >
            <Text style={styles.helpButtonText}>Ajudar</Text>
          </TouchableOpacity>

        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.white,
    borderRadius: 16,
    padding: 16,
    marginVertical: 8,
    // Sombra para dar o destaque em fundos escuros ou claros
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  
  // Estilos do Ícone da Esquerda
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#D32F2F', // Vermelho do ícone da imagem
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  // Estilos do Container de Conteúdo
  contentContainer: {
    flex: 1, // Faz a coluna direita ocupar o resto do espaço
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.blue.dark,
    flex: 1,
    marginRight: 8,
  },
  timeAgo: {
    fontSize: 12,
    color: '#9ca3af', // Cinza claro
  },
  description: {
    fontSize: 14,
    color: '#4b5563', // Cinza escuro
    marginTop: 4,
    marginBottom: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },

  // Estilos do Rodapé
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginRight: 8,
  },
  urgentBadge: {
    backgroundColor: '#FEE2E2', // Fundo vermelho clarinho
    borderColor: '#FCA5A5',     // Borda vermelha
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#DC2626', // Texto vermelho escuro
  },
  helpButton: {
    backgroundColor: Colors.blue.dark,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 16, // Deixa o botão bem arredondado como na imagem
  },
  helpButtonText: {
    color: Colors.brand.white,
    fontSize: 12,
    fontWeight: '600',
  },
});