import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { Factura, FacturaUpdate } from '../../models/factura';
import {
  facturaFormSchema,
  toFacturaUpdate,
  toFormValues,
  type FacturaFormValues,
} from '../../schemas/factura.schema';
import Field from '../ui/Field';

const CURRENCIES = ['COP', 'USD', 'EUR'];

interface Props {
  factura: Factura;
  saving: boolean;
  onSubmit: (values: FacturaUpdate) => void;
}

export function FacturaForm({ factura, saving, onSubmit }: Props) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<FacturaFormValues>({
    resolver: zodResolver(facturaFormSchema),
    defaultValues: toFormValues(factura),
  });

  // After saving, the form shows the values returned by the API
  useEffect(() => {
    reset(toFormValues(factura));
  }, [factura, reset]);

  const currencies = CURRENCIES.includes(factura.moneda) ? CURRENCIES : [...CURRENCIES, factura.moneda];

  const inputProps = (name: keyof FacturaFormValues) => ({
    id: name,
    className: 'input',
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `${name}-error` : undefined,
    ...register(name),
  });

  return (
    <form className="card stack" onSubmit={handleSubmit((values) => onSubmit(toFacturaUpdate(values)))} noValidate>
      <div>
        <h2>Datos de la factura</h2>
        <p className="muted">Corrige lo que la IA haya leído mal. Los campos con * son obligatorios.</p>
      </div>

      <Field label="Proveedor *" htmlFor="proveedor" error={errors.proveedor?.message}>
        <input {...inputProps('proveedor')} />
      </Field>

      <div className="form-grid">
        <Field label="N.º de factura *" htmlFor="numeroFactura" error={errors.numeroFactura?.message}>
          <input {...inputProps('numeroFactura')} />
        </Field>
        <Field label="N.º cliente / contrato" htmlFor="numeroCliente" error={errors.numeroCliente?.message}>
          <input {...inputProps('numeroCliente')} />
        </Field>
        <Field label="Fecha de emisión *" htmlFor="fechaEmision" error={errors.fechaEmision?.message}>
          <input type="date" {...inputProps('fechaEmision')} />
        </Field>
        <Field label="Fecha límite de pago" htmlFor="fechaLimitePago" error={errors.fechaLimitePago?.message}>
          <input type="date" {...inputProps('fechaLimitePago')} />
        </Field>
        <Field label="Valor total *" htmlFor="valorTotal" error={errors.valorTotal?.message}>
          <input inputMode="decimal" {...inputProps('valorTotal')} />
        </Field>
        <Field label="Moneda *" htmlFor="moneda" error={errors.moneda?.message}>
          <select {...inputProps('moneda')}>
            {currencies.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="actions">
        <button type="button" className="btn" disabled={!isDirty || saving} onClick={() => reset()}>
          Descartar cambios
        </button>
        <button type="submit" className="btn btn-primary" disabled={!isDirty || saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}