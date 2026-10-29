import { useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Button, Carousel, Chip, CountBadge, EmptyState, Icon, IconButton, SearchField, Text, Touchable, chartColor, mix, useSlate,
  type IconName, type Theme,
} from '@ajinkyabhagwat/slateos-native';

export type ShopProduct = { id: string; name: string; category: string; price: number; rating: number; reviews: number; icon: IconName; favourite?: boolean };
export type ShopPromo = { id: string; eyebrow: string; title: string; body: string; icon: IconName; productId?: string };

export type ShopScreenProps = {
  storeName?: string;
  categories?: string[];
  promos?: ShopPromo[];
  products?: ShopProduct[];
  /** Items already in the cart, shown on the cart button. */
  cartCount?: number;
  onOpenProduct?: (id: string) => void;
  onOpenCart?: () => void;
  onFavouriteChange?: (id: string, favourite: boolean) => void;
};

const DEFAULT_CATEGORIES = ['All', 'Clothing', 'Bags', 'Home', 'Lighting'];

const DEFAULT_PROMOS: ShopPromo[] = [
  { id: 'p1', eyebrow: 'New season', title: 'Knitwear is back', body: 'Soft merino in four colours, made to last.', icon: 'layers', productId: '1' },
  { id: 'p2', eyebrow: 'This week', title: '20% off lighting', body: 'Warm light for short evenings. Ends Sunday.', icon: 'sun', productId: '4' },
  { id: 'p3', eyebrow: 'Members', title: 'Free shipping over $75', body: 'Returns are free too, for 30 days.', icon: 'truck' },
];

const DEFAULT_PRODUCTS: ShopProduct[] = [
  { id: '1', name: 'Merino Crew Sweater', category: 'Clothing', price: 128, rating: 4.8, reviews: 214, icon: 'layers', favourite: true },
  { id: '2', name: 'Canvas Weekender', category: 'Bags', price: 165, rating: 4.7, reviews: 98, icon: 'package' },
  { id: '3', name: 'Slim Card Wallet', category: 'Bags', price: 48, rating: 4.6, reviews: 341, icon: 'wallet' },
  { id: '4', name: 'Arc Desk Lamp', category: 'Lighting', price: 89, rating: 4.9, reviews: 127, icon: 'sun' },
  { id: '5', name: 'Linen Throw', category: 'Home', price: 72, rating: 4.5, reviews: 63, icon: 'layers' },
  { id: '6', name: 'Bedside Night Light', category: 'Lighting', price: 34, rating: 4.4, reviews: 52, icon: 'moon' },
  { id: '7', name: 'Field Watch', category: 'Clothing', price: 210, rating: 4.8, reviews: 176, icon: 'clock' },
  { id: '8', name: 'Cloud Pillow', category: 'Home', price: 58, rating: 4.6, reviews: 289, icon: 'cloud' },
];

const usd = (n: number) => `$${n.toFixed(2)}`;
/** A soft tile tinted from the chart palette, so product imagery follows the theme. */
const tileColor = (t: Theme, i: number) => mix(t.c.bg, chartColor(t, i), t.scheme === 'dark' ? 0.24 : 0.14);

/** A storefront home: search, category chips, a featured carousel and a two-column product grid with favourites. */
export function ShopScreen({
  storeName = 'Shop',
  categories = DEFAULT_CATEGORIES,
  promos = DEFAULT_PROMOS,
  products = DEFAULT_PRODUCTS,
  cartCount = 2,
  onOpenProduct,
  onOpenCart,
  onFavouriteChange,
}: ShopScreenProps) {
  const t = useSlate();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(categories[0] ?? 'All');
  const [favs, setFavs] = useState(() => new Set(products.filter((p) => p.favourite).map((p) => p.id)));

  const toggleFav = (id: string) => {
    const on = !favs.has(id);
    setFavs((s) => {
      const next = new Set(s);
      if (on) next.add(id);
      else next.delete(id);
      return next;
    });
    onFavouriteChange?.(id, on);
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => (category === categories[0] || p.category === category) && (!q || `${p.name} ${p.category}`.toLowerCase().includes(q)));
  }, [products, category, categories, query]);

  // Pairs of products, so each row's two cards share the width evenly.
  const rows: ShopProduct[][] = [];
  for (let i = 0; i < shown.length; i += 2) rows.push(shown.slice(i, i + 2));
  const browsing = !query.trim() && category === categories[0];
  const pad = t.component.screenPadding;

  return (
    <View style={{ flex: 1, backgroundColor: t.c.bg, paddingTop: insets.top }}>
      <View style={{ paddingHorizontal: pad, paddingTop: t.space[2], paddingBottom: t.space[3], gap: t.space[3] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="title1" accessibilityRole="header">{storeName}</Text>
          <View>
            <IconButton
              icon="package"
              variant="soft"
              round
              accessibilityLabel={cartCount ? `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Cart'}
              onPress={onOpenCart}
            />
            <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ position: 'absolute', top: -t.space[1], right: -t.space[1] }}>
              <CountBadge count={cartCount} tone="accent" />
            </View>
          </View>
        </View>
        <SearchField placeholder="Search products" value={query} onChangeText={setQuery} returnKeyType="search" />
      </View>

      <ScrollView keyboardDismissMode="on-drag" contentContainerStyle={{ paddingBottom: insets.bottom + t.space[6], gap: t.space[5] }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: pad, gap: t.space[2] }}>
          {categories.map((c) => (
            <Chip key={c} label={c} value={category === c} onValueChange={() => setCategory(c)} />
          ))}
        </ScrollView>

        {browsing && (
          <Carousel
            data={promos}
            keyExtractor={(p) => p.id}
            inset={pad}
            accessibilityLabel="Featured"
            renderItem={(p, i) => (
              <Touchable
                onPress={p.productId ? () => onOpenProduct?.(p.productId!) : undefined}
                pressScale={p.productId ? 0.98 : 1}
                accessibilityRole={p.productId ? 'button' : 'text'}
                accessibilityLabel={`${p.eyebrow}. ${p.title}. ${p.body}`}
                style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[4], padding: t.space[5], borderRadius: t.component.cardRadius, backgroundColor: tileColor(t, i + 1) }}
              >
                <View style={{ flex: 1, gap: t.space[1] }}>
                  <Text variant="overline" tone="muted">{p.eyebrow}</Text>
                  <Text variant="title3" numberOfLines={2}>{p.title}</Text>
                  <Text variant="footnote" tone="muted" numberOfLines={2}>{p.body}</Text>
                </View>
                <Icon name={p.icon} size={t.space[8]} color={chartColor(t, i + 1)} strokeWidth={1.25} />
              </Touchable>
            )}
          />
        )}

        <View style={{ paddingHorizontal: pad, gap: t.space[4] }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <Text variant="title3" accessibilityRole="header">{browsing ? 'Popular' : category === categories[0] ? 'Results' : category}</Text>
            <Text variant="footnote" tone="subtle" tabular>{shown.length} {shown.length === 1 ? 'item' : 'items'}</Text>
          </View>

          {shown.length === 0 ? (
            <EmptyState
              icon="search"
              title={query.trim() ? `No results for “${query.trim()}”` : `Nothing in ${category} yet`}
              description="Try another word or browse all products."
              actions={<Button variant="outline" onPress={() => { setQuery(''); setCategory(categories[0] ?? 'All'); }}>Show everything</Button>}
            />
          ) : (
            rows.map((row) => (
              <View key={row.map((p) => p.id).join('-')} style={{ flexDirection: 'row', gap: t.space[3] }}>
                {row.map((p) => (
                  <ProductCard key={p.id} product={p} index={products.indexOf(p)} favourite={favs.has(p.id)} onToggleFavourite={() => toggleFav(p.id)} onPress={() => onOpenProduct?.(p.id)} />
                ))}
                {row.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function ProductCard({ product: p, index, favourite, onToggleFavourite, onPress }: {
  product: ShopProduct; index: number; favourite: boolean; onToggleFavourite: () => void; onPress: () => void;
}) {
  const t = useSlate();
  return (
    <Touchable
      onPress={onPress}
      pressScale={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${p.name}, ${usd(p.price)}, rated ${p.rating} out of 5`}
      style={{ flex: 1, gap: t.space[2] }}
    >
      <View style={{ aspectRatio: 1, borderRadius: t.component.cardRadius, backgroundColor: tileColor(t, index), alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={p.icon} size={t.space[8]} color={chartColor(t, index)} strokeWidth={1.25} />
        <IconButton
          icon="heart"
          size="sm"
          round
          variant={favourite ? 'solid' : 'outline'}
          accessibilityLabel={`Favourite ${p.name}`}
          accessibilityState={{ selected: favourite }}
          onPress={onToggleFavourite}
          style={{ position: 'absolute', top: t.space[2], right: t.space[2] }}
        />
      </View>
      <View style={{ gap: t.space['0_5'] }}>
        <Text variant="callout" weight="500" numberOfLines={1}>{p.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: t.space[1] }}>
          <Icon name="star" size={16} color={t.c.warningSolid} />
          <Text variant="footnote" tone="muted" tabular>{p.rating.toFixed(1)} ({p.reviews})</Text>
        </View>
        <Text variant="headline" tabular>{usd(p.price)}</Text>
      </View>
    </Touchable>
  );
}
