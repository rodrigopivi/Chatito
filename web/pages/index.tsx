import 'babel-polyfill';
import * as React from 'react';
import Helmet from 'react-helmet';
import Editor from '../components/Editor/Editor';
import { Header } from '../components/globalStyles';
import Logo from '../components/Logo';

// NOTE: gatsby global for prefix
declare var __PATH_PREFIX__;

export default class Index extends React.Component<{}, {}> {
    public render() {
        return (
            <div>
                <Helmet>
                    <link rel="apple-touch-icon" sizes="180x180" href={`${__PATH_PREFIX__}/apple-touch-icon.png`} />
                    <link rel="icon" type="image/png" sizes="32x32" href={`${__PATH_PREFIX__}/favicon-32x32.png`} />
                    <link rel="icon" type="image/png" sizes="16x16" href={`${__PATH_PREFIX__}/favicon-16x16.png`} />
                    <link rel="manifest" href={`${__PATH_PREFIX__}/site.webmanifest`} />
                    <link rel="mask-icon" href={`${__PATH_PREFIX__}/safari-pinned-tab.svg`} color="#5bbad5" />
                    <meta name="msapplication-TileColor" content="#da532c" />
                    <meta name="theme-color" content="#ffffff" />
                    <title>Chatito DSL - Generate dataset for chatbots</title>
                    <meta
                        name="keywords"
                        content="chatbot, dataset generation, dataset generator, generate datasets, rasa nlu, snips nlu, chatbot dataset, datasets for chatbots"
                    />
                    <meta
                        name="description"
                        content="Chatito helps you helps you generate datasets for natural language understanding models using a simple DSL"
                    />
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
