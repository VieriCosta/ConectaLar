import {
  Bath,
  BedDouble,
  Car,
  Heart,
  MapPin,
  Star,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import type { Property } from '../types/property';
import { formatCurrency } from '../utils/formatters';
import { getPropertyReviews, type PropertyReview } from '../services/reviews';

type PropertyCardProps = {
  property: Property;
  isFavorite?: boolean;
  onFavorite?: () => void;
};

export function PropertyCard({
  property,
  isFavorite,
  onFavorite,
}: PropertyCardProps) {
  const [reviews, setReviews] = useState<PropertyReview[]>([]);
  useEffect(() => {
    getPropertyReviews(property.id)
      .then(setReviews)
      .catch(() => setReviews([]));
  }, [property.id]);
  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) /
      reviews.length
    : null;
  return (
    <article className="card">
      <div className="photo">
        <img
          src={property.images[0]}
          alt={property.title}
          loading="lazy"
          decoding="async"
        />
        <button
          className={isFavorite ? 'fav on' : 'fav'}
          onClick={onFavorite}
          aria-label="Favoritar"
        >
          <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="card-body">
        <p className="price">
          {formatCurrency(property.price)} <small>/mês</small>
        </p>
        <h3>{property.title}</h3>
        <p className="location">
          <MapPin size={15} />
          {property.neighborhood}, {property.city}
        </p>
        <div className="facts">
          <span>
            <BedDouble /> {property.bedrooms}
          </span>
          <span>
            <Bath /> {property.bathrooms}
          </span>
          <span>
            <Car /> {property.parkingSpaces}
          </span>
          <span>{property.area} m²</span>
        </div>
        <p className="card-rating" aria-label="Avaliação do imóvel">
          <Star size={15} fill={average ? 'currentColor' : 'none'} />
          <strong>
            {average ? average.toFixed(1).replace('.', ',') : 'Sem avaliações'}
          </strong>
          {reviews.length > 0 && <span>({reviews.length})</span>}
        </p>
        <Link to={`/imovel/${property.id}`} className="text-link">
          Ver detalhes <ChevronRight size={16} />
        </Link>
      </div>
    </article>
  );
}
