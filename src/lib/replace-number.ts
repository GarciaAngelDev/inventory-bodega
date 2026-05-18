/**
 * Replaces the default value of a number input field when a new value is entered
 * @param e - The input change event
 * @param defaultValue - The default value to replace (usually 0 or any initial value)
 * @returns The new number value if valid, or null if input is empty/invalid
 */
export const replaceNumber = (
  e: React.ChangeEvent<HTMLInputElement>,
  defaultValue: number = 0
): number | null => {
  const value = e.target.value;
  
  // If input is empty, return null to indicate no valid number
  if (value === '') {
    return null;
  }
  
  // Parse the input value as a float
  const numberValue = parseFloat(value);
  
  // Check if the parsed value is a valid number and not equal to the default
  if (!isNaN(numberValue) && numberValue !== defaultValue) {
    return numberValue;
  }
  
  return defaultValue;
};