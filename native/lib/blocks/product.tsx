import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Accordion, Badge, Button, Carousel, Icon, IconButton, SegmentedControl, Stepper, Text, Toaster, Touchable, chartColor, mix, toast, useSlate,
  type IconName, type Theme,
} from '@ajinkyabhagwat/slateos-native';

export type ProductDetail = {
  name: string;
  price: number;
  rating: number;
  reviews: number;
  description: string;
  /** Gallery views; each is a tinted tile with an icon. */
  views: { icon: IconName; label: string }[];
  colors: string[];
  sizes: string[];
  soldOut?: string[];
};

export type ProductSelection = { color: string; size: string; qty: number };

export type ProductScreenProps = {
  product?: ProductDetail;
  onBack?: () => void;
  onAddToCart?: (selection: ProductSelection) => void;
  onOpenCart?: () => void;
  onShare?: () => void;
};

const DEFAULT_PRODUCT: ProductDetail = {
  name: 'Merino Crew Sweater',
  price: 128,
  rating: 4.8,
  reviews: 214,
  description: 'A light, breathable crew in extra-fine merino. Warm without bulk, soft enough to wear next to skin, and it keeps its shape wash after wash.',
  views: [
    { icon: 'layers', label: 'Folded' },
    { icon: 'sparkles', label: 'Knit detail' },
    { icon: 'tag', label: 'Label' },
  ],
  colors: ['Charcoal', 'Sage', 'Ochre', 'Rose'],
  sizes: ['XS', 'S', 'M', 'L', 'XL'],
  soldOut: ['XL'],
};

const usd = (n: number) => `$${n.toFixed(2)}`;
/** Colour i of the product: a chart tint, so swatches and imagery follow the theme. */
const tileColor = (t: Theme, i: number) => mix(t.c.bg, chartColor(t, i), t.scheme === 'dark' ? 0.24 : 0.14);

/** A product page: gallery, price and rating, colour and size pickers, quantity, details, and a sticky Add to cart. */
export function ProductScreen({ product = DEFAULT_PRODUCT, onBack, onAddToCart, onOpenCart, onShare }: ProductScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(() => product.sizes.find((s) => s === 'M' && !product.soldOut?.includes(s)) ?? product.sizes.find((s) => !product.soldOut?.includes(s)) ?? '');
  const [qty, setQty] = useState(1);
  const [favourite, setFavourite] = useState(false);
  const pad = t.component.screenPadding;
  const colorName = product.colors[color] ?? '';
  const total = product.price * qty;

  const add = () => {
    const selection = { color: colorName, size, qty };
    onAddToCart?.(selection);
    t.haptic('success');
    toast.success('Added to cart', {
      description: `${qty} × ${product.name}, ${colorName}, ${size}`,
      action: onOpenCart ? { label: 'View cart', onPress: onOpenCart } : undefined,
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg }}>
      <View style={{ paddingTop: insets.top, height: insets.top + t.component.headerHeight, flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.space[1] }}>
        <IconButton icon="chevron-left" accessibilityLabel="Back" onPress={onBack} />
        <View style={{ flex: 1 }} />
        <IconButton icon="share" accessibilityLabel="Share" onPress={onShare} />
        <IconButton
          icon="heart"
          variant={favourite ? 'soft' : 'ghost'}
          accessibilityLabel="Favourite"
          accessibilityState={{ selected: favourite }}
          onPress={() => setFavourite((f) => !f)}
        />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: t.space[6], gap: t.space[5] }}>
        <Carousel
          data={product.views}
          inset={pad}
          keyExtractor={(v) => v.label}
          accessibilityLabel="Photos"
          renderItem={(v) => (
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={`${product.name} in ${colorName}, ${v.label.toLowerCase()}`}
              style={{ aspectRatio: 1, borderRadius: t.component.cardRadius, backgroundColor: tileColor(t, color), alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name={v.icon} size={t.space[10]} color={chartColor(t, color)} strokeWidth={1.25} />
            </View>
          )}
        />

        <View style={{ paddingHorizontal: pad, gap: t.space[5] }}>
          <View style={{ gap: t.space[2] }}>
            <Text variant="title2" accessibilityRole="header">{product.name}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[3] }}>
              <Text variant="title3" tabular>{usd(product.price)}</Text>
              <View
                accessible
                accessibilityLabel={`Rated ${product.rating} out of 5 from ${product.reviews} reviews`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}
              >
                <Icon name="star" size={16} color={t.c.warningSolid} />
                <Text variant="footnote" tone="muted" tabular>{product.rating.toFixed(1)} · {product.reviews} reviews</Text>
              </View>
            </View>
            <Text tone="muted">{product.description}</Text>
          </View>

          <View style={{ gap: t.space[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: t.space[2] }}>
              <Text variant="label">Colour</Text>
              <Text variant="callout" tone="muted">{colorName}</Text>
            </View>
            <View accessibilityRole="radiogroup" accessibilityLabel="Colour" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: t.space[2] }}>
              {product.colors.map((name, i) => (
                <Swatch key={name} name={name} fill={chartColor(t, i)} selected={i === color} onPress={() => setColor(i)} />
              ))}
            </View>
          </View>

          <View style={{ gap: t.space[3] }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text variant="label">Size</Text>
              {!!product.soldOut?.length && <Badge size="sm">{product.soldOut.join(', ')} sold out</Badge>}
            </View>
            <SegmentedControl
              options={product.sizes.map((s) => ({ value: s, label: s, disabled: product.soldOut?.includes(s), accessibilityLabel: product.soldOut?.includes(s) ? `${s}, sold out` : s }))}
              value={size}
              onValueChange={setSize}
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="label">Quantity</Text>
            <Stepper value={qty} onValueChange={setQty} min={1} max={10} accessibilityLabel="Quantity" />
          </View>

          <Accordion defaultValue={['details']}>
            <Accordion.Item value="details" title="Details">
              {'100% extra-fine merino wool, 17.5 micron. Regular fit with a ribbed collar, cuffs and hem. Machine wash cold on a wool cycle, dry flat.'}
            </Accordion.Item>
            <Accordion.Item value="shipping" title="Shipping">
              {'Free standard shipping on orders over $75, arriving in 3–5 business days. Express delivery in 1–2 business days is $12.'}
            </Accordion.Item>
            <Accordion.Item value="returns" title="Returns">
              {'Changed your mind? Send it back unworn within 30 days for a full refund. Returns are free, and the label is in the box.'}
            </Accordion.Item>
          </Accordion>
        </View>
      </ScrollView>

      <View style={{ paddingHorizontal: pad, paddingTop: t.space[3], paddingBottom: insets.bottom + t.space[2], borderTopWidth: 1, borderColor: t.c.borderSubtle, backgroundColor: t.c.bg }}>
        <Button block size="lg" icon="plus" disabled={!size} onPress={add}>{`Add to cart · ${usd(total)}`}</Button>
      </View>

      <Toaster />
    </View>
  );
}

/** A round colour swatch, 44pt to touch, with a ring when chosen. */
function Swatch({ name, fill, selected, onPress }: { name: string; fill: string; selected: boolean; onPress: () => void }) {
  const t = useSlate();
  const outer = t.size.touch;
  const ring = t.space['0_5'];
  return (
    <Touchable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="radio"
      accessibilityLabel={name}
      accessibilityState={{ selected, checked: selected }}
      style={{
        width: outer,
        height: outer,
        borderRadius: t.radius.full,
        borderWidth: ring,
        borderColor: selected ? t.c.text : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View style={{ width: outer - ring * 4, height: outer - ring * 4, borderRadius: t.radius.full, backgroundColor: fill, borderWidth: 1, borderColor: t.c.border }} />
    </Touchable>
  );
}
