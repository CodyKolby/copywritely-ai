
/**
 * Utility function to replace placeholders in a template string with actual values
 * 
 * @param template The template string with {{placeholders}}
 * @param values Object containing key-value pairs to replace placeholders
 * @returns The template with placeholders replaced with values
 */
export const templateReplacer = (template: string, values: Record<string, string>): string => {
  let result = template;
  
  // Replace each placeholder with its corresponding value
  Object.entries(values).forEach(([key, value]) => {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, value);
  });
  
  return result;
};
