"use client";

import { useState } from "react";
import { buttonStyles } from "@/components/ui/button";
import { deleteAddressAction, setDefaultAddressAction } from "@/lib/account/actions";
import { AddressForm } from "./forms";

interface Address {
  id: string;
  nombre: string;
  telefono: string;
  departamento: string;
  municipio: string;
  direccion: string;
  referencia: string;
  esPredeterminada: boolean;
}

export function AddressList({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<string | "nueva" | null>(null);

  return (
    <div className="space-y-6">
      {addresses.length === 0 && editing !== "nueva" && (
        <p className="text-text-muted">Todavía no guardas direcciones. Agrega una para comprar más rápido.</p>
      )}
      <ul className="grid gap-4 md:grid-cols-2">
        {addresses.map((a) => (
          <li key={a.id} className="rounded-lg border border-border p-4">
            {editing === a.id ? (
              <AddressForm address={a} onDone={() => setEditing(null)} />
            ) : (
              <>
                <p className="font-medium">
                  {a.nombre} {a.esPredeterminada && <span className="ml-2 rounded-sm bg-surface-light-alt px-2 py-0.5 text-sm font-normal">Predeterminada</span>}
                </p>
                <p className="mt-1 text-text-muted">
                  {a.direccion}, {a.municipio}, {a.departamento}
                  {a.referencia && (
                    <>
                      <br />
                      Referencia: {a.referencia}
                    </>
                  )}
                  <br />
                  Teléfono: {a.telefono}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4">
                  <button type="button" onClick={() => setEditing(a.id)} className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                    Editar<span className="sr-only"> dirección de {a.nombre}</span>
                  </button>
                  {!a.esPredeterminada && (
                    <form action={setDefaultAddressAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button type="submit" className="inline-flex min-h-11 items-center text-brand-primary-strong underline underline-offset-2">
                        Usar como predeterminada<span className="sr-only">: {a.nombre}</span>
                      </button>
                    </form>
                  )}
                  <form action={deleteAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button type="submit" className="inline-flex min-h-11 items-center text-state-error underline underline-offset-2">
                      Eliminar<span className="sr-only"> dirección de {a.nombre}</span>
                    </button>
                  </form>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {editing === "nueva" ? (
        <div className="rounded-lg border border-border p-4">
          <h2 className="mb-4 text-lg">Nueva dirección</h2>
          <AddressForm onDone={() => setEditing(null)} />
        </div>
      ) : (
        <button type="button" onClick={() => setEditing("nueva")} className={buttonStyles("secondary-light")}>
          Agregar dirección
        </button>
      )}
    </div>
  );
}
