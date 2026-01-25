import React from 'react';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
// Import the ViewOrderProvider
import { Index } from "./pages/Index";
import { Cart } from "./pages/Cart";
import { Profile } from "./pages/Profile";
import { Category } from "./pages/Category";
import { Bookdetail } from "./pages/Bookdetail";
import { ResellerPaymentForm } from './pages/ResellerPaymentForm';
import { BookForm } from './components/BookForm';
import { Login } from './pages/login';
import { MyOrders } from './pages/MyOrders';
import { SellOrders } from './pages/SellOrders';
import { AdminDashboard } from './pages/AdminDashboard';
import { Useraddress } from './pages/Useraddress';
import { PaymentForm } from './pages/PaymentForm';
import { AdminBookForm } from './components/AdminBookForm';
import { AdminRoute } from './pages/AdminDashboard';
import { ManageUsers } from './pages/ManageUsers';
import { ManageBooks } from './pages/ManageBooks';
import ForgotPassword from './pages/ForgotPassword';
import { Payment } from './pages/Payment';
import { BooksPage } from './pages/BooksPage';
import { AdminAddUser } from './pages/AdminAddUser';
import { AdminViewOrder } from './pages/AdminViewOrder';
import { AddCat } from './pages/AddCat';
import { AdminEditBook } from "./pages/AdminEditBook";
import { AdminEditUser } from "./pages/AdminEditUser";
import { EditProfile } from './pages/EditProfile';
import { DeliveryDashboard, DeliverypersonRoute } from './pages/DeliveryDashboard';
import { DeliveryDetail } from './pages/DeliveryDetail';
import Reports from './pages/Reports';
import { AdminOrders } from './pages/AdminOrders';
import { ResellDeliveryDetail } from './pages/ResellDeliveryDetail';
import { ViewPayment } from './pages/ViewPayment';
import AdminRefundPayments from './pages/AdminRefundPayments';
import AboutUsPage from './pages/AboutUsPage';
import ContactUsPage from './pages/ContactUsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsAndConditionsPage from './pages/TermsAndConditionsPage';
import ReturnPolicyPage from './pages/ReturnPolicyPage';
import FAQsPage from './pages/FAQsPage';
import ManageResellers from './pages/ManageReseller';
import ReturnOrders from './pages/ReturnOrders';
import { ReturnBookDetails } from './pages/ReturnBookDetails';
import RefundPaymentForm from './components/RefundPaymentForm';


export const App = () => {
  const router = createBrowserRouter([
        { path: "/", element: <Index /> },
        { path: "/cart", element: <Cart /> },
        { path: "/profile", element: <Profile /> },
       // { path: "/category", element: <Category /> },
        { path: "/bookdetail", element: <Bookdetail /> },
        { path: "/bookform", element:  <BookForm UserRole='Reseller'/>},
        { path: "/Resellerpaymentform", element: <ResellerPaymentForm /> },
        { path: "/login", element: <Login/> },
        { path: "/Orders" ,  element: <MyOrders/>},
        { path: "/EditProfile" ,  element: <EditProfile/>},
        { path: "/SellOrders", element:<SellOrders/>},
        { path: "/Admin", element: <AdminRoute><AdminDashboard/></AdminRoute>},
        { path: "/Useraddress", element: <Useraddress /> },
        { path: "/PaymentForm", element: <PaymentForm /> },
        { path: "/Admin/ManageBooks/AddBook" , element : <AdminRoute><AdminBookForm UserRole='Admin'/></AdminRoute>},
        { path: "/Admin/ManageUsers" , element : <AdminRoute><ManageUsers/></AdminRoute>},
        { path: "/Admin/ManageBooks" , element : <AdminRoute><ManageBooks/></AdminRoute>},
        { path: "/MyOrder", element: <MyOrders /> },
        { path: "/ForgotPassword" ,element:<ForgotPassword/>},
        {path : "/payment", element:<Payment/>},
        {path : "/RefundPaymentForm", element:<RefundPaymentForm/>},
        {path : "/books/:category/:subcategory", element:<BooksPage/>},
        {path : "/Admin/ManageUsers/adduser" ,  element: <AdminRoute><AdminAddUser/></AdminRoute>},
        {path : "/Admin/ViewOrder" , element : <AdminRoute><AdminViewOrder/></AdminRoute> },
        { path : "/Admin/AddCat" , element:  <AdminRoute><AddCat/></AdminRoute> },
        { path : "/Admin/Reports" , element:  <AdminRoute><Reports/></AdminRoute> },
        { path : "/Admin/Orders" , element:  <AdminRoute><AdminOrders/></AdminRoute> },
        { path: "/Admin/RefundPayments", element: <AdminRoute><AdminRefundPayments/></AdminRoute> },
                { path: "/Admin/ReturnOrderReq", element: <AdminRoute><ReturnOrders/></AdminRoute> },
    { path: "/deliverydashboard", element: <DeliverypersonRoute> <DeliveryDashboard /> </DeliverypersonRoute> },
    {
      path: "/deliverydashboard/deliverydetail", element: <DeliverypersonRoute> <DeliveryDetail /></DeliverypersonRoute>
    }, {
      path: "/deliverydashboard/reselldeliverydetail", element: <DeliverypersonRoute> <ResellDeliveryDetail/> </DeliverypersonRoute>
    }, {
      path: "/deliverydashboard/returnbookdetail", element: <DeliverypersonRoute> <ReturnBookDetails/> </DeliverypersonRoute>
    },{
      path : "/Admin/ManageBooks/EditBooks",
      element : (
        <AdminRoute>
          <AdminEditBook/>
        </AdminRoute>
      )
    },
    { path: "/Admin/ViewPayment", element: <AdminRoute><ViewPayment/></AdminRoute> },
    {
      path : "/Admin/ManageUsers/EditUser",
      element : (
        <AdminRoute>
          <AdminEditUser/>
        </AdminRoute>
      )
    },
    {
      path : "/Admin/ManageReseller",
      element : (
        <AdminRoute>
          <ManageResellers/>
        </AdminRoute>
      )
    }, 
    { path: "/aboutus", element: <AboutUsPage /> },
    { path: "/contactus", element: <ContactUsPage /> },
    { path: "/privacypolicy", element: <PrivacyPolicyPage /> },
    { path: "/termsandconditions", element: <TermsAndConditionsPage /> },
    { path: "/returnpolicy", element: <ReturnPolicyPage /> },
    { path: "/faqs", element: <FAQsPage /> },
  ]);

  return (
      <RouterProvider router={router} />
  )
};
