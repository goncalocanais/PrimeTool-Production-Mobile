import React, {useRef} from 'react';
import {TextInput, StyleSheet, TextInputProps} from 'react-native';
import {Colors, FontSize, Spacing} from '../../theme';

interface DateInputProps extends Omit<TextInputProps, 'value' | 'onChangeText' | 'keyboardType' | 'maxLength' | 'placeholder' | 'placeholderTextColor'> {
  value: string;
  onChangeText: (value: string) => void;
  style?: any;
}

const applyMask = (text: string, prev: string): string => {
  // Se está a apagar e o último char do prev era '/', apaga também o dígito antes
  if (text.length < prev.length && (prev.endsWith('/') || prev[prev.length - 1] === '/')) {
    text = text.slice(0, -1);
  }
  const digits = text.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const DateInput: React.FC<DateInputProps> = ({value, onChangeText, style, ...props}) => {
  const prevRef = useRef(value);

  const handleChange = (text: string) => {
    const formatted = applyMask(text, prevRef.current);
    prevRef.current = formatted;
    onChangeText(formatted);
  };

  return (
    <TextInput
      value={value}
      onChangeText={handleChange}
      placeholder="DD/MM/AAAA"
      placeholderTextColor={Colors.gray400}
      keyboardType="numeric"
      maxLength={10}
      style={[styles.input, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: Spacing.sm + 2,
    fontSize: FontSize.sm,
    color: Colors.gray900,
    fontFamily: 'Exo2_400Regular',
  },
});
