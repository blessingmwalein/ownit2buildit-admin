import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import authReducer from "./slices/authSlice";
import overviewReducer from "./slices/overviewSlice";
import companiesReducer from "./slices/companiesSlice";
import subscriptionsReducer from "./slices/subscriptionsSlice";
import paymentsReducer from "./slices/paymentsSlice";
import rbacReducer from "./slices/rbacSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    overview: overviewReducer,
    companies: companiesReducer,
    subscriptions: subscriptionsReducer,
    payments: paymentsReducer,
    rbac: rbacReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
