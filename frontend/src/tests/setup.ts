import '@testing-library/jest-dom';

// Mock para window.matchMedia requerido para prefers-reduced-motion y otros
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock para ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock para IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Expandir configuración de jest-dom
expect.extend({
  // Puedes añadir matchers personalizados aquí si es necesario
});

// Funciones auxiliares globales para pruebas
global.setComputedStyle = (element: Element, styles: Partial<CSSStyleDeclaration>) => {
  Object.defineProperty(element, 'computedStyleMap', {
    configurable: true,
    value: () => new Map(Object.entries(styles)),
  });

  jest.spyOn(window, 'getComputedStyle').mockImplementation(() => {
    return {
      ...styles,
      getPropertyValue: (prop: string) => {
        const camelCaseProp = prop.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
        return (styles as any)[camelCaseProp] || '';
      }
    } as CSSStyleDeclaration;
  });
};
