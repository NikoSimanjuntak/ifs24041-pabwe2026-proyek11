import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { reducer } from './store';

/**
 * Render komponen dengan Redux Store & MemoryRouter.
 * @param {*} ui elemen React
 * @param {{preloadedState?: object, route?: string, store?: object}} options
 */
export function renderWithProviders(
  ui,
  {
    preloadedState,
    route = '/',
    store = configureStore({ reducer, preloadedState }),
    ...renderOptions
  } = {},
) {
  const Wrapper = ({ children }) => (
    <Provider store={store}>
      <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
    </Provider>
  );
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
