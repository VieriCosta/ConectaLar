import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Copy, X } from 'lucide-react';
import type { Property } from '../types/property';
import { formatCurrency } from '../utils/formatters';

type PropertyCompareDialogProps = {
  properties: Property[];
  onClose: () => void;
};

export function PropertyCompareDialog({
  properties,
  onClose,
}: PropertyCompareDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [shareMessage, setShareMessage] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const rows = [
    {
      label: 'Aluguel mensal',
      value: (property: Property) => formatCurrency(property.price),
    },
    { label: 'Área', value: (property: Property) => `${property.area} m²` },
    {
      label: 'Quartos',
      value: (property: Property) => String(property.bedrooms),
    },
    {
      label: 'Banheiros',
      value: (property: Property) => String(property.bathrooms),
    },
    {
      label: 'Vagas',
      value: (property: Property) => String(property.parkingSpaces),
    },
    {
      label: 'Aceita pets',
      value: (property: Property) => (property.acceptsPets ? 'Sim' : 'Não'),
    },
    {
      label: 'Mobiliado',
      value: (property: Property) => (property.furnished ? 'Sim' : 'Não'),
    },
  ];

  async function copyComparisonLink() {
    const url = new URL(window.location.href);
    url.searchParams.set(
      'compare',
      properties.map((property) => property.id).join(','),
    );
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage('Link copiado!');
    } catch {
      setShareMessage('Não foi possível copiar o link neste navegador.');
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="compare-dialog"
      aria-labelledby="compare-title"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="compare-dialog-header">
        <div>
          <p className="section-tag">ESCOLHA COM CLAREZA</p>
          <h2 id="compare-title">Compare seus imóveis</h2>
          <p>Veja os detalhes lado a lado antes de decidir.</p>
        </div>
        <div className="compare-dialog-tools">
          <span role="status">{shareMessage}</span>
          <button
            className="compare-share"
            type="button"
            onClick={() => void copyComparisonLink()}
          >
            <Copy size={15} /> Copiar link
          </button>
          <button
            className="compare-close"
            type="button"
            onClick={onClose}
            aria-label="Fechar comparação"
          >
            <X size={21} />
          </button>
        </div>
      </div>
      <p className="compare-scroll-hint">
        Deslize a tabela para ver mais imóveis →
      </p>
      <div className="compare-table-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th scope="col">Detalhes</th>
              {properties.map((property) => (
                <th scope="col" key={property.id}>
                  <img src={property.images[0]} alt="" />
                  <strong>{property.title}</strong>
                  <span>
                    {property.neighborhood}, {property.city}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th scope="row">{row.label}</th>
                {properties.map((property) => (
                  <td key={property.id}>{row.value(property)}</td>
                ))}
              </tr>
            ))}
            <tr className="compare-actions-row">
              <th scope="row">Próximo passo</th>
              {properties.map((property) => (
                <td key={property.id}>
                  <Link to={`/imovel/${property.id}`}>
                    Ver detalhes <ArrowUpRight size={16} />
                  </Link>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </dialog>
  );
}
