import { supabase } from './supabase';

const guestFavoritesKey = 'conectalar-guest-favorites';

function getGuestFavoriteIds() {
  try {
    const favorites = JSON.parse(
      window.localStorage.getItem(guestFavoritesKey) ?? '[]',
    );
    return Array.isArray(favorites)
      ? favorites.filter((id) => typeof id === 'string')
      : [];
  } catch {
    return [];
  }
}

function setGuestFavoriteIds(favorites: string[]) {
  window.localStorage.setItem(guestFavoritesKey, JSON.stringify(favorites));
}

export async function getFavoriteIds() {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) return getGuestFavoriteIds();
  const { data, error } = await supabase
    .from('favorites')
    .select('property_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((item) => item.property_id);
}

export async function toggleFavorite(propertyId: string, isFavorite: boolean) {
  const { data: sessionData } = await supabase.auth.getSession();
  const userId = sessionData.session?.user.id;
  if (!userId) {
    const favorites = getGuestFavoriteIds();
    setGuestFavoriteIds(
      isFavorite
        ? favorites.filter((id) => id !== propertyId)
        : [...new Set([...favorites, propertyId])],
    );
    return;
  }
  const request = isFavorite
    ? supabase
        .from('favorites')
        .delete()
        .eq('user_id', userId)
        .eq('property_id', propertyId)
    : supabase
        .from('favorites')
        .insert({ user_id: userId, property_id: propertyId });
  const { error } = await request;
  if (error) throw error;
}
