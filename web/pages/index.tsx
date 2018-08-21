import 'babel-polyfill';
import * as React from 'react';
import Helmet from 'react-helmet';
import Editor from '../components/Editor/Editor';
import { Header } from '../components/globalStyles';
import Logo from '../components/Logo';

export default class Index extends React.Component<{}, {}> {
    public render() {
        return (
            <div>
                <Helmet>
                    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
                    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
                    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
                    <link rel="manifest" href="/site.webmanifest" />
                    <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#5bbad5" />
                    <meta name="msapplication-TileColor" content="#da532c" />
                    <meta name="theme-color" content="#ffffff" />
                </Helmet>
                <Header>
                    <div style={{ display: 'inline-block', width: 50, minWidth: 50, height: 43 }}>
                        <Logo />
                    </div>
                    <div style={{ paddingLeft: 24 }}>
                        <h1>
                            <a href="https://github.com/rodrigopivi/Chatito">Chatito</a>
                        </h1>
                        <h2>
                            &nbsp;helps you generate datasets for natural language understanding models using a simple DSL&nbsp;
                            <a href="https://github.com/rodrigopivi/Chatito">Read the docs</a>
                        </h2>
                    </div>
                </Header>
                <Editor />
            </div>
        );
    }
}
