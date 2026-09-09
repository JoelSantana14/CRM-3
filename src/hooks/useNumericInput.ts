import { useState, useEffect, useCallback } from 'react';

export interface UseNumericInputProps {
  initialValue: number;
  onChange?: (val: number) => void;
  isCurrency?: boolean;
}

/**
 * Custom hook to manage numeric and currency inputs.
 * Solves the leading zero delete issue, normalizes text inputs,
 * and formats values on-the-fly as BRL currency when specified.
 */
export function useNumericInput({
  initialValue,
  onChange,
  isCurrency = true,
}: UseNumericInputProps) {
  // Store the actual raw typed value in state
  const [displayValue, setDisplayValue] = useState<string>('');

  // Formatter for currency
  const formatBRL = useCallback((num: number): string => {
    return num.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  }, []);

  // Format non-currency numbers cleanly without trailing/leading zeros
  const formatPlain = useCallback((num: number): string => {
    if (num === 0) return '';
    return num.toString();
  }, []);

  // Initialize and synchronize display value when initialValue changes from outside
  useEffect(() => {
    if (isCurrency) {
      // If the incoming value is 0, we can display empty or R$ 0,00.
      // But displaying empty string makes it much easier to start typing.
      if (initialValue === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatBRL(initialValue));
      }
    } else {
      setDisplayValue(formatPlain(initialValue));
    }
  }, [initialValue, isCurrency, formatBRL, formatPlain]);

  // Handle value change event
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement> | string) => {
      const rawVal = typeof e === 'string' ? e : e.target.value;

      if (isCurrency) {
        // Strip everything that isn't a digit
        const digitsOnly = rawVal.replace(/\D/g, '');

        if (!digitsOnly) {
          setDisplayValue('');
          if (onChange) onChange(0);
          return;
        }

        // Divide by 100 to get real BRL decimal (cents-based typing)
        const cents = parseInt(digitsOnly, 10);
        const numericValue = cents / 100;

        setDisplayValue(formatBRL(numericValue));
        if (onChange) onChange(numericValue);
      } else {
        // For general numbers (integer/decimal)
        if (rawVal === '') {
          setDisplayValue('');
          if (onChange) onChange(0);
          return;
        }

        // Clean leading zeros except when typing decimals starting with "0."
        let cleaned = rawVal;
        if (cleaned.startsWith('0') && cleaned.length > 1 && cleaned[1] !== '.' && cleaned[1] !== ',') {
          cleaned = cleaned.replace(/^0+/, '');
          if (cleaned === '') cleaned = '0';
        }

        // Replace any comma with dot for validation
        const dotSeparated = cleaned.replace(',', '.');

        // Allow any numeric inputs with at most one dot/comma
        if (/^\d*\.?\d*$/.test(dotSeparated)) {
          setDisplayValue(cleaned);
          const parsed = parseFloat(dotSeparated);
          if (onChange && !isNaN(parsed)) {
            onChange(parsed);
          }
        }
      }
    },
    [isCurrency, onChange, formatBRL]
  );

  const setDirectValue = useCallback(
    (num: number) => {
      if (isCurrency) {
        setDisplayValue(num === 0 ? '' : formatBRL(num));
      } else {
        setDisplayValue(formatPlain(num));
      }
    },
    [isCurrency, formatBRL, formatPlain]
  );

  return {
    displayValue,
    onChange: handleInputChange,
    setDirectValue,
  };
}
