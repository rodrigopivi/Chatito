import { saveAs } from 'file-saver/FileSaver';
import * as React from 'react';
import * as rasaAdapter from '../../../src/adapters/rasa';
import * as snipsAdapter from '../../../src/adapters/snips';
import * as webAdapter from '../../../src/adapters/web';
import * as chatito from '../../../src/main';
import * as utils from '../../../src/utils';
import { chatitoPrism, rasaDefaultOptions, snipsDefaultOptions, tabs } from '../../lib/editorConfig';
import { debounce } from '../../lib/utils';
import * as es from './editorStyles';

const adapters = {
    default: webAdapter,
    rasa: rasaAdapter,
    snips: snipsAdapter
};

interface IEditorState {
    error: null | string;
    warning: null | string;
    activeTabIndex: number;
    showDrawer: boolean;
    dataset: any;
    adapterOptions: any;
    currentAdapter: 'default' | 'rasa' | 'snips';
    useCustomOptions: boolean;
}

// NOTE: for SSR, wrap the require in check for window
let CodeFlask = null;
let ReactJson = null;
if (typeof window !== `undefined`) {
    // tslint:disable-next-line:no-var-requires
    CodeFlask = require('codeflask').default;
    // tslint:disable-next-line:no-var-requires
    ReactJson = require('react-json-view').default;
}

export default class Editor extends React.Component<{}, IEditorState> {
    public state: IEditorState = {
        error: null,
        warning: null,
        activeTabIndex: 0,
        showDrawer: false,
        dataset: null,
        adapterOptions: null,
        currentAdapter: 'default',
        useCustomOptions: false
    };
    private tabsContainer = React.createRef() as React.RefObject<HTMLDivElement>;
    private codeflask = null;
    private editorUpdatesSetupCount = 0;
    private codeInputValue = '';
    private tabs = [];

    private debouncedTabDSLValidation = debounce(() => {
        if (!this.codeInputValue.length) {
            if (this.state.error || this.state.warning) {
                this.setState({ error: null, warning: null });
            }
            return;
        }
        const validation = this.getDSLValidation(this.codeInputValue);
        let newState = {};
        if (validation && validation.error) {
            newState = { error: validation.error, warning: null };
        } else if (validation && validation.warning) {
            newState = { error: null, warning: validation.warning };
        } else {
            newState = { error: null, warning: null };
        }
        this.setState(newState, () => {
            this.saveToLocalStorage(true, false, false);
        });
    }, 300);

    public componentDidMount() {
        if (!CodeFlask) {
            return;
        }
        this.loadFromLocalStorage(() => {
            const flask = new CodeFlask('#my-code-editor', {
                language: 'chatito',
                lineNumbers: true
            });
            flask.addLanguage('chatito', chatitoPrism);
            flask.onUpdate(code => {
                if (!this.tabs || !this.tabs[this.state.activeTabIndex]) {
                    return;
                }
                this.codeInputValue = code;
                this.tabs[this.state.activeTabIndex].value = code;
                // NOTE: ugly hack to know when codeflask is mounted (it makes 2 calls to update on mount)
                if (this.editorUpdatesSetupCount < 2) {
                    this.editorUpdatesSetupCount++;
                } else {
                    this.setState({ dataset: null });
                    this.debouncedTabDSLValidation();
                }
            });
            flask.updateCode(this.tabs[this.state.activeTabIndex].value);
            flask.setLineNumber();
            this.codeflask = flask;
        });
    }

    public render() {
        const alertState = !!this.state.error ? 'error' : !!this.state.warning ? 'warning' : 'success';
        return (
            <es.EditorWrapper>
                <es.EditorHeader>
                    <es.TabsArea innerRef={this.tabsContainer}>{this.tabs.map(this.renderTabButton)}</es.TabsArea>
                    <es.TabsAreaButton onClick={this.onAddFile} style={{ backgroundColor: '#1a6849' }}>
                        New file
                    </es.TabsAreaButton>
                    <es.TabsAreaButton onClick={this.onToggleDrawer} disabled={!!this.state.error}>
                        Generate Dataset
                    </es.TabsAreaButton>
                </es.EditorHeader>
                <es.CodeStyles id="my-code-editor" />
                <es.AlertNotification state={alertState}>
                    {' '}
                    {this.state.error || this.state.warning || `Correct syntax!`}
                </es.AlertNotification>
                <es.EditorOverlay onClick={this.onCloseDrawer} showDrawer={this.state.showDrawer}>
                    <es.Drawer onClick={e => e.stopPropagation()} showDrawer={this.state.showDrawer}>
                        <es.CloseDrawerButton onClick={this.onCloseDrawer}>x</es.CloseDrawerButton>
                        {this.renderDatasetGeneratorSettings()}
                        {this.renderDatasetPreviewer()}
                    </es.Drawer>
                </es.EditorOverlay>
            </es.EditorWrapper>
        );
    }

    /* ================== Renderers ================== */
    private renderDatasetGeneratorSettings = () => {
        return (
            <es.BlockWrapper>
                <es.BlockWrapperTitle>Dataset generation settings</es.BlockWrapperTitle>
                <div style={{ display: 'flex', flexDirection: 'row' }}>
                    <es.DrawerFormField style={{ borderRight: '1px solid #ccc' }}>
                        <label htmlFor="adapterSelect">Dataset format: </label>
                        <es.SelectWrapper>
                            <select
                                id="adapterSelect"
                                name="adapterSelect"
                                onChange={this.onAdapterChange}
                                value={this.state.currentAdapter}
                            >
                                <option value="default">Default</option>
                                <option value="rasa">Rasa NLU</option>
                                <option value="snips">Snips NLU</option>
                            </select>
                        </es.SelectWrapper>
                    </es.DrawerFormField>
                    <es.DrawerFormField>
                        <es.CheckboxWrapper>
                            <label>
                                <input
                                    type="checkbox"
                                    checked={this.state.useCustomOptions}
                                    onChange={this.onCustomOptionsCheckboxChange}
                                />
                                Use custom options
                            </label>
                        </es.CheckboxWrapper>
                    </es.DrawerFormField>
                </div>
                {this.renderEditAdapterOptions()}
                <div style={{ padding: 20, textAlign: 'center' }}>
                    <es.TabsAreaButton onClick={this.generateDataset}>Generate and download dataset!</es.TabsAreaButton>
                </div>
            </es.BlockWrapper>
        );
    };

    private renderEditAdapterOptions = () => {
        if (!this.state.useCustomOptions || !ReactJson) {
            return null;
        }
        return (
            <div>
                <div style={{ padding: '10px 20px 0 20px', fontSize: 12, borderTop: '1px solid #ccc' }}>
                    Edit the adapter custom initial options:
                </div>
                <div style={{ flex: '1', margin: '10px 20px' }}>
                    <ReactJson
                        style={{ padding: '10px' }}
                        src={this.state.adapterOptions || {}}
                        theme="summerfruit:inverted"
                        iconStyle="square"
                        enableClipboard={false}
                        displayDataTypes={false}
                        name={false}
                        collapsed={false}
                        onEdit={this.onEditAdapterOptions}
                        onAdd={this.onEditAdapterOptions}
                        onDelete={this.onEditAdapterOptions}
                    />
                </div>
            </div>
        );
    };

    private renderDatasetPreviewer = () => {
        if (!this.state.dataset || !ReactJson) {
            return null;
        }
        return (
            <es.BlockWrapper>
                <es.BlockWrapperTitle>Review the generated training dataset</es.BlockWrapperTitle>
                <ReactJson
                    style={{ padding: 20 }}
                    src={this.state.dataset}
                    theme="chalk"
                    iconStyle="square"
                    enableClipboard={false}
                    displayDataTypes={false}
                    name={false}
                    collapsed={2}
                />
            </es.BlockWrapper>
        );
    };

    private renderTabButton = (t, i) => {
        const changeTab = () => this.changeTab(i);
        const onCloseTab = this.closerTab(i);
        return (
            <es.TabButton active={this.state.activeTabIndex === i} key={`tab-${i}`} onClick={changeTab}>
                {t.title}
                <es.CloseTab onClick={onCloseTab} />
            </es.TabButton>
        );
    };

    /* ================== Event Handlers ================== */
    private onCloseDrawer = () => this.setState({ showDrawer: false, dataset: null });

    private onCustomOptionsCheckboxChange = e => {
        this.setState({ useCustomOptions: e.target.checked });
    };

    private onAdapterChange = e => {
        let adapterOptions = {};
        if (e.target.value === 'rasa') {
            adapterOptions = Object.assign({}, rasaDefaultOptions);
        } else if (e.target.value === 'snips') {
            adapterOptions = Object.assign({}, snipsDefaultOptions);
        }
        this.setState({ currentAdapter: e.target.value, adapterOptions, dataset: null }, () => {
            this.saveToLocalStorage(false, true, true);
        });
    };

    private onEditAdapterOptions = changes => {
        if (changes && changes.updated_src) {
            this.setState({ adapterOptions: changes.updated_src }, () => {
                this.saveToLocalStorage(false, true, false);
            });
            return null;
        }
        return false;
    };

    private onAddFile = () => {
        let filename = 'newFile';
        if (window && window.prompt) {
            filename = prompt('Please enter the new .chatito file name:', filename);
        }
        if (filename) {
            this.tabs.push({ title: `${filename}.chatito`, value: '' });
            this.changeTab(this.tabs.length - 1, () => {
                this.tabsContainer.current.scrollTo({
                    left: this.tabsContainer.current.scrollWidth,
                    behavior: 'smooth'
                });
            });
        }
    };

    private onToggleDrawer = async () => {
        if (!this.state.showDrawer) {
            if (this.validateChatitoFiles()) {
                try {
                    this.setState({ showDrawer: !this.state.showDrawer });
                } catch (e) {
                    return;
                }
            } else {
                if (window && window.alert) {
                    window.alert('Please fix the errors or warnings found in the code.');
                }
            }
        }
    };

    /* ================== Utils ================== */

    private saveToLocalStorage = (saveTabs, saveAdapterOptions, saveCurrentAdapter) => {
        if (window && localStorage) {
            if (saveTabs) {
                localStorage.setItem('tabs', JSON.stringify(this.tabs));
            }
            if (saveAdapterOptions) {
                localStorage.setItem('adapterOptions', this.state.useCustomOptions ? JSON.stringify(this.state.adapterOptions) : '');
            }
            if (saveCurrentAdapter) {
                localStorage.setItem('currentAdapter', this.state.currentAdapter);
            }
        }
    };

    private loadFromLocalIfPresent = (key: string, parseAsJSON: boolean) => {
        if (window && localStorage) {
            try {
                const item = localStorage.getItem(key);
                if (!parseAsJSON) {
                    return item;
                }
                if (item) {
                    try {
                        return JSON.parse(item);
                    } catch (e) {
                        // just catch the error
                    }
                }
            } catch (e) {
                // tslint:disable-next-line:no-console
                console.error(e);
            }
        }
    };

    private loadFromLocalStorage = (cb: () => void) => {
        if (window && localStorage) {
            const newState: any = {};
            const localTabs = this.loadFromLocalIfPresent('tabs', true);
            const localAdapterOptions = this.loadFromLocalIfPresent('adapterOptions', true);
            const localCurrentAdapter = this.loadFromLocalIfPresent('currentAdapter', false);
            if (localTabs) {
                this.tabs = localTabs;
            }
            if (localAdapterOptions) {
                newState.adapterOptions = localAdapterOptions;
                newState.useCustomOptions = true;
            }
            if (localCurrentAdapter) {
                newState.currentAdapter = localCurrentAdapter;
            }
            this.setState(newState, cb);
        } else {
            this.tabs = tabs;
            cb();
        }
    };

    private changeTab = (i: number, cb?: () => void) => {
        this.setState({ activeTabIndex: i }, () => {
            this.codeflask.updateCode(this.tabs[this.state.activeTabIndex].value);
            this.codeflask.setLineNumber();
            if (cb) {
                setTimeout(cb, 600); // note; hack using setTimeout because codeflask uses a timeout on update code
            }
        });
    };

    private closerTab = (i: number) => {
        return (e: React.SyntheticEvent) => {
            if (e) {
                e.stopPropagation();
            }
            if (this.tabs[i].value) {
                if (!window.confirm(`Do you really want to remove '${this.tabs[i].title}'?`)) {
                    return;
                }
            }
            const ati = this.state.activeTabIndex;
            let newActiveTabIndex = this.state.activeTabIndex;
            if (ati === i && ati > 0) {
                newActiveTabIndex = ati - 1;
            }
            this.tabs = [...this.tabs.slice(0, i), ...this.tabs.slice(i + 1)];
            if (!this.tabs.length) {
                this.tabs.push({ title: 'newFile.chatito', value: '' });
                newActiveTabIndex = 0;
            }
            this.saveToLocalStorage(true, false, false);
            this.changeTab(newActiveTabIndex);
        };
    };

    private getDSLValidation = (dsl: string): null | { error?: string; warning?: string } => {
        try {
            const ast = chatito.astFromString(dsl);
            const intentsWithoutLimit = ast.filter(entity => entity.type === 'IntentDefinition' && entity.args === null);
            if (intentsWithoutLimit.length) {
                return {
                    warning: `Warning: Limit the number of generated examples for intents. E.g.: %[${
                        intentsWithoutLimit[0].key
                    }]('training': '100')`
                };
            }
            return null;
        } catch (e) {
            const error =
                e.constructor === Error
                    ? e.toString()
                    : `${e.name}: ${e.message} Line: ${e.location.start.line}, Column: ${e.location.start.column}`;
            return { error };
        }
    };

    private validateChatitoFiles = () => {
        return !this.tabs.some((tab, i) => {
            if (tab.value) {
                const validation = this.getDSLValidation(tab.value);
                if (validation !== null) {
                    this.changeTab(i);
                    return true;
                }
            }
            return false;
        });
    };

    private generateDataset = async () => {
        let dataset: webAdapter.IDefaultDataset | snipsAdapter.ISnipsDataset | rasaAdapter.IRasaDataset | null = null;
        const testingDataset = {};
        const adapter = adapters[this.state.currentAdapter];
        if (!adapter) {
            return;
        }
        for (const [i, tab] of this.tabs.entries()) {
            try {
                if (dataset === null && this.state.useCustomOptions && this.state.adapterOptions) {
                    dataset = JSON.parse(JSON.stringify(this.state.adapterOptions));
                }
                const { training, testing } = await adapter.adapter(tab.value, dataset);
                dataset = training;
                utils.mergeDeep(testingDataset, testing);
            } catch (e) {
                this.setState({ dataset: null, showDrawer: false }, () => {
                    this.changeTab(i, () =>
                        this.setState({ error: e.message }, () => {
                            if (window && window.alert) {
                                window.alert(`Please fix error: ${e.message}`);
                            }
                        })
                    );
                });
                return;
            }
        }
        const datasetBlob = new Blob([JSON.stringify(dataset)], { type: 'text/json;charset=utf-8' });
        const testingBlob = new Blob([JSON.stringify(testingDataset)], { type: 'text/json;charset=utf-8' });
        saveAs(datasetBlob, `training_dataset_${Math.round(new Date().getTime() / 1000)}.json`);
        setTimeout(() => {
            saveAs(testingBlob, `testing_dataset_${Math.round(new Date().getTime() / 1000)}.json`);
        }, 100); // note: timeout to allow multiple downloads at once
        this.setState({ dataset });
    };
}
