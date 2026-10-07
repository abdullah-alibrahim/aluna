import * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface ElementClass {
      render(): any;
      props: any;
      context: any;
      refs: any;
      setState: any;
      forceUpdate: any;
      state: any;
    }
    interface ElementAttributesProperty {
      props: {};
    }
    interface IntrinsicAttributes {
      [key: string]: any;
    }
  }
}
