type Locale = 'en-US' | 'es-VE';

interface Country {
  locale: Locale;
  currency: 'USD' | 'VES';
}

interface FormatPriceProps {
  price: number;
  country: Country;
}

export const formatPrice = ({ price, country }: FormatPriceProps) => {
  return price.toLocaleString(country.locale, {
    style: 'currency',
    currency: country.currency,
  });
};