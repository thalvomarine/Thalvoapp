import { createFileRoute, Navigate } from "@tanstack/react-router";

/**
 * Legacy spare-parts path. The catalog lives on /app/marketplace;
 * keep this route so old deep links and auth `next=` values still resolve.
 */
export const Route = createFileRoute("/_authenticated/app/shop")({
  ssr: false,
  component: ShopRedirect,
});

function ShopRedirect() {
  return <Navigate to="/app/marketplace" replace />;
}
