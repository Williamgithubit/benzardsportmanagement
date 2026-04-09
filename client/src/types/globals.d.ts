/// <reference types="react" />
/// <reference types="react-dom" />

// Global JSX namespace declaration for TypeScript
declare global {
  namespace JSX {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface IntrinsicElements {}
  }
}

export {};
