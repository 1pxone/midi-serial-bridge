import * as easymidi from 'easymidi';
import * as SerialPort from 'serialport';
import { Input, Output } from 'easymidi';
import { decodeMessage } from './commands';

const baudRates = [
    50, 75, 110, 134, 150, 200, 300, 600, 1200, 1800, 2400, 3600, 4800, 7200, 9600, 14400, 19200,
    28800, 38400, 56000, 57600, 74880, 115200, 230400, 250000, 460800, 921600
];

const renderOption = (option: SerialPort.PortInfo) => {
    return `<option value="${option.path}">${option.path}</option>`;
};

const renderMidiDeviceOption = (device: string) => {
    return `<option value="${device}">${device}</option>`;
};

const renderBaudRateOption = (rate: number) => {
    return `<option value="${rate}">${rate}</option>`;
};

function chunk(arr: Buffer, chunkSize: number) {
    if (chunkSize <= 0) {
        throw 'Invalid chunk size';
    }
    const R = [];
    for (let i = 0, len = arr.length; i < len; i += chunkSize) {
        R.push(arr.slice(i, i + chunkSize));
    }
    return R;
}
type TMidiSignalEmitterState = {
    ports: SerialPort.PortInfo[];
    bridgeEnabled: boolean;
    currentPort: undefined | string;
    midiOutput: undefined | string;
    midiInput: undefined | string;
    baudRate: number;
};

let input: Input;
let port: SerialPort;
let output: Output;
let state: TMidiSignalEmitterState = {
    ports: [],
    bridgeEnabled: false,
    currentPort: undefined,
    midiOutput: undefined,
    midiInput: undefined,
    baudRate: undefined
};

function setState(partialState: Partial<TMidiSignalEmitterState>) {
    state = { ...state, ...partialState };
}

function unbindPort() {
    if (port) {
        port.close();
        port = undefined;
    }
    resetInput();
    resetOutput();
}

function resetInput() {
    if (input) {
        input.close();
        input = undefined;
    }
}

function resetOutput() {
    if (output) {
        output.close();
        output = undefined;
    }
}

function enable() {
    bindPort(state.currentPort);
}

function disable() {
    if (state.bridgeEnabled) {
        unbindPort();
    }
}

function isToggleAvailable() {
    return (state.midiOutput || state.midiOutput) && state.currentPort && state.baudRate;
}

function bindPort(currentPort: string) {
    port = new SerialPort(currentPort, { baudRate: state.baudRate });

    input = state.midiInput
        ? new easymidi.Input(state.midiInput, state.midiInput === '__virtualInput')
        : undefined;

    output = state.midiOutput
        ? new easymidi.Output(state.midiOutput, state.midiOutput === '__virtualOutput')
        : undefined;

    port.on('data', (line: Buffer) => {
        try {
            console.log(line);
            const { action, payload } = decodeMessage(line);
            console.log({ action, payload });
            if (payload) {
                // @ts-ignore
                output.send(action, payload);
            } else {
                // @ts-ignore
                output.send(action);
            }
        } catch (e) {
            console.log('Received unknown data', e);
        }
    });
}

function reconnect() {
    disable();
    const toggleAvailable = isToggleAvailable();
    const toggle = document.getElementById('bridgeToggle');

    if (toggleAvailable) {
        toggle.removeAttribute('disabled');
        if (state.bridgeEnabled) {
            enable();
        }
    } else {
        toggle.setAttribute('disabled', 'disabled');
    }
}
function render() {
    const toggle = document.getElementById('bridgeToggle');
    const portSelection = document.getElementById('portSelection');
    const baudRateSelection = document.getElementById('baudRateSelection');
    const midiInputSelection = document.getElementById('inputSelection');
    const midiOutputSelection = document.getElementById('outputSelection');

    const inputs = easymidi.getInputs();
    const outputs = easymidi.getOutputs();

    midiInputSelection.innerHTML =
        midiInputSelection.innerHTML +
        inputs.reduce((html: string, input) => html + renderMidiDeviceOption(input), '');

    midiOutputSelection.innerHTML =
        midiOutputSelection.innerHTML +
        outputs.reduce((html: string, input) => html + renderMidiDeviceOption(input), '');

    baudRateSelection.innerHTML =
        baudRateSelection.innerHTML +
        baudRates.reduce((html: string, rate) => html + renderBaudRateOption(rate), '');

    baudRateSelection.addEventListener('change', e => {
        setState({ baudRate: Number((e.target as HTMLSelectElement).value) });
        reconnect();
    });
    midiOutputSelection.addEventListener('change', e => {
        setState({ midiOutput: (e.target as HTMLSelectElement).value });
        reconnect();
    });
    midiInputSelection.addEventListener('change', (e: Event) => {
        setState({ midiInput: (e.target as HTMLSelectElement).value });
        reconnect();
    });
    toggle.addEventListener('change', e => {
        if ((e.target as HTMLInputElement).checked && state.currentPort) {
            bindPort(state.currentPort);
        } else {
            unbindPort();
        }
        setState({ bridgeEnabled: (e.target as HTMLInputElement).checked });
    });

    SerialPort.list().then(ports => {
        if (ports.length) {
            portSelection.innerHTML =
                portSelection.innerHTML +
                ports.reduce((html: string, port) => html + renderOption(port), '');

            portSelection.removeAttribute('disabled');
            baudRateSelection.removeAttribute('disabled');
            midiInputSelection.removeAttribute('disabled');
            midiOutputSelection.removeAttribute('disabled');

            portSelection.addEventListener('change', e => {
                setState({ currentPort: (e.target as HTMLSelectElement).value });
            });
        }
    });
}

window.addEventListener('DOMContentLoaded', render);
