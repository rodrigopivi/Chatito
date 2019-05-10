import styled, { createGlobalStyle } from 'styled-components';

// tslint:disable-next-line:no-unused-expression
export const Global: any = createGlobalStyle`
  *, *::after, *::before {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  :focus { outline: none; }
  h1, h2 { display: inline; font-size: 20px; }
  ::-moz-focus-inner { border: 0; }
  html, body, #app {
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      flex: 1;
      height: auto !important;
      font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
      background-color: #ccc;
  }
  a { text-decoration: none; }
  body {
      box-sizing: border-box;
      min-height: 100vh;
      background: #ececec;
      padding: 0;
  }
  a:focus, a:active, a:any-link { text-decoration: none; }
`;

export const Header = styled('div')`
    display: flex;
    align-items: center;
    justify-content: center;
    h1,
    h2 {
        display: inline;
    }
    a {
        text-decoration: none;
        color: #990adb;
    }
    a:hover {
        color: #b92afb;
    }
    color: '#444';
    margin: 20px;
`;
