import { createBrowserRouter, Navigate } from "react-router-dom";
import { App } from "@/App";
import { LoginView } from "@/views/LoginView";
import { Dashboard } from "@/features/dashboard/Dashboard";
import { CategoryView } from "@/features/categories/CategoryView";
import { ProductView } from "@/features/products/ProductView";
import { BrandView } from "@/features/brands/BrandView";
import { SupplierView } from "@/features/suppliers/SupplierView";
import { ClientView } from "@/features/clients/ClientView";
import { OrderView } from "@/features/orders/OrderView";
import { CreateOrderView } from "@/features/orders/CreateOrderView";
import { EditOrderView } from "@/features/orders/EditOrderView";
import { PurchaseOrderView } from "@/features/purchase-orders/PurchaseOrderView";
import { CreatePurchaseOrderView } from "@/features/purchase-orders/CreatePurchaseOrderView";
import { PaymentView } from "@/features/payments/PaymentView";
import { UserView } from "@/features/users/UserView";
import { RoleView } from "@/features/roles/RoleView";
import { ChatView } from "@/features/chat/ChatView";
import { PricingView } from "@/views/PricingView";
import { StockMovementView } from "@/features/stock-movements/StockMovementView";
import { OpenItemView } from "@/features/open-items/OpenItemView";
import { CreateOpenItemView } from "@/features/open-items/CreateOpenItemView";
import { SettingsView } from "@/features/settings/SettingsView";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginView />,
  },
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "categories", element: <CategoryView /> },
      { path: "products", element: <ProductView /> },
      { path: "brands", element: <BrandView /> },
      { path: "suppliers", element: <SupplierView /> },
      { path: "clients", element: <ClientView /> },
      { path: "orders", element: <OrderView /> },
      { path: "orders/create", element: <CreateOrderView /> },
      { path: "orders/:id/edit", element: <EditOrderView /> },
      { path: "purchase-orders", element: <PurchaseOrderView /> },
      { path: "purchase-orders/create", element: <CreatePurchaseOrderView /> },
      { path: "payments", element: <PaymentView /> },
      { path: "users", element: <UserView /> },
      { path: "roles", element: <RoleView /> },
      { path: "chat", element: <ChatView /> },
      { path: "pricing", element: <PricingView /> },
      { path: "stock-movements", element: <StockMovementView /> },
      { path: "open-items", element: <OpenItemView /> },
      { path: "open-items/create", element: <CreateOpenItemView /> },
      { path: "settings", element: <SettingsView /> },
    ],
  },
]);
