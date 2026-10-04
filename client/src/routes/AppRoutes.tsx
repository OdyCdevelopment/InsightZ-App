import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';

const Home = lazy(() => import('../pages/Home'));
const ProductsPage = lazy(() => import('../pages/Products'));
const ProductDetail = lazy(() => import('../pages/ProductDetail'));
const NearMe = lazy(() => import('../pages/NearMe'));

export const AppRoutes: React.FC = () => (
  <Routes>
    <Route element={<MainLayout />}>
      <Route index element={<Suspense fallback={<div />}><Home /></Suspense>} />
      <Route path="/products" element={<Suspense fallback={<div />}><ProductsPage /></Suspense>} />
      <Route path="/near-me" element={<Suspense fallback={<div />}><NearMe /></Suspense>} />
      <Route path="/product/:id" element={<Suspense fallback={<div />}><ProductDetail /></Suspense>} />
    </Route>
  </Routes>
);
