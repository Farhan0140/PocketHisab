import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Radius, Spacing } from '@/constants/theme';
import { Button } from './Button';

interface DateFieldProps {
  label: string;
  value: Date | null;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  minimumDate?: Date;
  placeholder?: string;
}

/**
 * Cross-platform date/time picker field. Android's native picker is a
 * self-dismissing dialog (fires once then closes); iOS's is an inline wheel
 * that needs an explicit "Done" — hence the platform branch below.
 */
export function DateField({ label, value, onChange, mode = 'date', minimumDate, placeholder }: DateFieldProps) {
  const [isVisible, setVisible] = useState(false);
  const [draft, setDraft] = useState(value ?? new Date());

  const card = useThemeColor({}, 'card');
  const border = useThemeColor({}, 'border');
  const text = useThemeColor({}, 'text');
  const textMuted = useThemeColor({}, 'textMuted');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const background = useThemeColor({}, 'background');

  const displayText = value
    ? mode === 'date'
      ? value.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
      : value.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : placeholder ?? 'Select';

  function handleAndroidChange(event: DateTimePickerEvent, selected?: Date) {
    setVisible(false);
    if (event.type === 'set' && selected) onChange(selected);
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: textSecondary }]}>{label}</Text>
      <Pressable
        onPress={() => {
          setDraft(value ?? new Date());
          setVisible(true);
        }}
        style={[styles.field, { backgroundColor: card, borderColor: border }]}
      >
        <Text style={{ color: value ? text : textMuted, fontSize: 15 }}>{displayText}</Text>
      </Pressable>

      {isVisible && Platform.OS === 'android' ? (
        <DateTimePicker value={draft} mode={mode} minimumDate={minimumDate} onChange={handleAndroidChange} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <Modal visible={isVisible} transparent animationType="slide" onRequestClose={() => setVisible(false)}>
          <View style={styles.backdrop}>
            <View style={[styles.sheet, { backgroundColor: background }]}>
              <DateTimePicker
                value={draft}
                mode={mode}
                display="spinner"
                minimumDate={minimumDate}
                onChange={(_event, selected) => selected && setDraft(selected)}
                textColor={text}
              />
              <Button
                label="Done"
                onPress={() => {
                  onChange(draft);
                  setVisible(false);
                }}
              />
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontWeight: '600' },
  field: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
  },
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl, padding: Spacing.lg, gap: Spacing.md },
});
