import styled from 'styled-components';

export const AlertNotification = styled.div`
    width: 100%;
    background-color: ${({ state }: { state: 'error' | 'warning' | 'success' }) =>
        state === 'error' ? '#c80000' : state === 'warning' ? '#7f8000' : '#008800'};
    bottom: 0;
    margin: auto;
    right: 0;
    text-align: center;
    padding: 12px;
    color: white;
    z-index: 99;
    font-size: 14px;
`;

export const CodeStyles = styled.div`
    white-space: pre-wrap;
    position: relative;
    margin: auto;
    width: inherit;
    height: calc(100vh - 210px) !important;
    min-height: 400px;
    > .codeflask {
        background-color: #282a35;
        > textarea.codeflask__textarea {
            color: #282a35;
            caret-color: #fff;
        }
        &.codeflask--has-line-numbers {
            :before {
                background-color: #3c3c4c;
            }
            > pre {
                width: auto !important;
            }
            div.codeflask__lines {
                z-index: 3;
                height: auto !important;
                padding: 10px 4px 0 0;
                > .codeflask__lines__line {
                    color: #6473a0;
                    background-color: #3c3c4c;
                }
            }
        }
        *::-webkit-scrollbar {
            width: 10px;
            height: 10px;
        }
        *::-webkit-scrollbar-thumb {
            background-color: #7c7c9c;
            box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
        }
        *::-webkit-scrollbar-track {
            box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
        }
        *::-webkit-scrollbar-corner {
            background-color: transparent;
        }
    }
    .token.comments {
        color: #999;
    }
    .token.intentDefinition {
        color: #ef82c3;
    }
    .token.slotDefinition {
        color: #ffaf56;
    }
    .token.slot {
        color: #ffaf56;
    }
    .token.alias {
        color: #a0e7fb;
    }
    .token.default {
        color: #e2e2dd;
    }
    .token.intentArguments {
        color: #b5669e;
    }
    .token.slotArguments {
        color: #7a9d98;
    }
`;

export const TabButton = styled.div`
    cursor: pointer;
    display: inline-block;
    background-color: ${({ active }: { active: boolean }) => (active ? '#282A35' : '#3c3c4c')};
    font-size: 12px;
    color: #ededed;
    padding: 13px 3px 13px 13px;
    border-right: 1px solid #2c2c3c;
    zoom: 1;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
`;

export const CloseTab = styled.div`
    :after {
        content: 'x';
    }
    padding: 8px;
    margin-left: 8px;
    display: inline-block;
    color: #ccf;
    line-height: 10px;
    font-size: 14px;
    cursor: pointer;
    font-weight: bold;
`;

export const EditorHeader = styled.div`
    display: flex;
    flex-direction: row;
    width: 100%;
    max-width: 100%;
    background-color: #3c3c4c;
    padding-left: 40px;
    padding-top: 10px;
`;

export const TabsAreaButton = styled.button`
    cursor: pointer;
    background-color: #6c1de2;
    font-size: 12px;
    color: #efefef;
    line-height: 14px;
    padding: 8px 24px;
    white-space: nowrap;
    margin: auto 10px;
    border-radius: 4px;
    border-color: #333;
    -webkit-transition: 0.25s ease;
    -moz-transition: 0.25s ease;
    -o-transition: 0.25s ease;
    transition: 0.25s ease;
    &:first-of-type {
        margin-left: 20px;
    }
    :disabled {
        border: 1px solid #999999;
        background-color: #cccccc;
        color: #666666;
    }
`;

export const TabsArea = styled.div`
    width: auto;
    max-width: 100%;
    white-space: nowrap;
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    -webkit-overflow-scrolling: touch;
    &::-webkit-scrollbar {
        height: 6px;
    }
    &::-webkit-scrollbar-thumb {
        background-color: #7c7c9c;
        -webkit-box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
    }
    &::-webkit-scrollbar-track {
        -webkit-box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.8);
    }
    *::-webkit-scrollbar-corner {
        background-color: transparent;
    }
`;

export const EditorWrapper = styled.div`
    width: 90vw;
    overflow: auto;
    margin: auto;
    position: relative;
    -webkit-box-shadow: 0px 0px 36px 2px rgba(0, 0, 0, 0.63);
    -moz-box-shadow: 0px 0px 36px 2px rgba(0, 0, 0, 0.63);
    box-shadow: 0px 0px 36px 2px rgba(0, 0, 0, 0.63);
`;

export const Drawer = styled.div`
    z-index: 99;
    position: absolute;
    background-color: #352252;
    -webkit-box-shadow: -5px 0px 5px -5px rgba(0, 0, 0, 0.55);
    -moz-box-shadow: -5px 0px 5px -5px rgba(0, 0, 0, 0.55);
    box-shadow: -5px 0px 5px -5px rgba(0, 0, 0, 0.55);
    top: 0;
    right: 0;
    max-width: 700px;
    height: 100%;
    width: ${({ showDrawer }: { showDrawer: boolean }) => (showDrawer ? `100%` : `0px`)};
    -webkit-transition: 0.65s ease;
    -moz-transition: 0.65s ease;
    -o-transition: 0.65s ease;
    transition: 0.65s ease;
    overflow: auto;
`;

export const EditorOverlay = styled.div`
    z-index: 999;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.6);
    visibility: ${({ showDrawer }: { showDrawer: boolean }) => (showDrawer ? 'visible' : 'hidden')};
    -webkit-transition: 0.25s ease;
    -moz-transition: 0.25s ease;
    -o-transition: 0.25s ease;
    transition: 0.25s ease;
`;

export const BlockWrapper = styled.div`
    background-color: #e4e4e4;
    margin: 20px;
    overflow: auto;
    border-radius: 8px;
    -webkit-box-shadow: 0px 0px 50px 0px rgba(0, 0, 0, 0.4);
    -moz-box-shadow: 0px 0px 50px 0px rgba(0, 0, 0, 0.4);
    box-shadow: 0px 0px 50px 0px rgba(0, 0, 0, 0.4);
    clear: both;
`;

export const BlockWrapperTitle = styled.div`
    background-color: #6b5a86;
    color: #efefef;
    font-size: 13px;
    padding: 8px 10px;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
`;

export const CloseDrawerButton = styled.div`
    cursor: pointer;
    color: white;
    font-size: 16px;
    padding: 8px;
    font-weight: bold;
    margin: 8px 20px 8px 20px;
    float: right;
`;

export const DrawerFormField = styled.div`
    padding: 10px 20px;
    display: flex;
    align-items: center;
    flex: 1;
    > label {
        font-size: 12px;
        padding-right: 10px;
    }
`;

export const SelectWrapper = styled.div`
    position: relative;
    z-index: 0;
    display: inline-block;
    overflow: hidden;
    height: auto;
    padding: 0 5px 0 0;
    margin: 0 5px 0 0;
    border-radius: 5px;
    border: solid 1px #ccc;
    background-color: #fff;
    :before {
        position: absolute;
        z-index: 1;
        content: '\\25BE';
        top: 50%;
        right: 10px;
        margin-top: -9px;
    }
    select {
        position: relative;
        z-index: 2;
        outline: none;
        width: 120%;
        padding: 5px 20px 5px 10px;
        background-color: transparent;
        background-image: none;
        -webkit-appearance: none;
        border: none;
        box-shadow: none;
    }
`;

export const CheckboxWrapper = styled.div`
    font-size: 12px;
    text-decoration: underline;
    cursor: pointer;
    input {
        margin-right: 10px;
        cursor: pointer;
    }
`;
