import { PageEnter } from "@/components/page-enter";

// La plantilla se vuelve a montar en cada cambio de página: ahí arranca el fundido de entrada.
export default function StoreTemplate({ children }: { children: React.ReactNode }) {
  return <PageEnter>{children}</PageEnter>;
}
