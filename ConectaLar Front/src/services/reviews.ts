export type PropertyReview = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
};

export async function getPropertyReviews(propertyId: string) {
  const response = await fetch(`/api/properties/${propertyId}/reviews`);
  if (!response.ok) throw new Error('Não foi possível carregar avaliações.');
  const data = (await response.json()) as { reviews?: PropertyReview[] };
  return data.reviews ?? [];
}
