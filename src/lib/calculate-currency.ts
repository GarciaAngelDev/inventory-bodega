import { formatPrice } from "./format-price";

export const calculateDolarsToBs = ({ value, rate }: { value: number, rate: number }) => {
  return formatPrice({ price: value * rate, country: { locale: 'es-VE', currency: 'VES' } });
};