// All of the Node.js APIs are available in the preload process.
// @ts-ignore
import * as Readline from '@serialport/parser-readline';
// @ts-ignore
import * as easymidi from 'easymidi';
// @ts-ignore
// import MidiParser from './node_modules/midi-parser-js/src/midi-parser';
// It has the same sandbox as a Chrome extension.
import * as SerialPort from 'serialport';
import ByteLength = SerialPort.parsers.ByteLength;

const baudRates = [
    50,
    75,
    110,
    134,
    150,
    200,
    300,
    600,
    1200,
    1800,
    2400,
    3600,
    4800,
    7200,
    9600,
    14400,
    19200,
    28800,
    38400,
    56000,
    57600,
    74880,
    115200,
    230400,
    250000,
    460800,
    921600
];
let port: SerialPort;
// @ts-ignore
let midiInput;
// @ts-ignore
let midiOutput;
const state: {
    ports: SerialPort.PortInfo[];
    bridgeEnabled: boolean;
    currentPort: undefined | string;
    midiOutput: undefined | string;
    midiInput: undefined | string;
    baudRate: number;
} = {
    ports: [],
    bridgeEnabled: false,
    currentPort: undefined,
    midiOutput: undefined,
    midiInput: undefined,
    baudRate: undefined
};

const renderOption = (option: SerialPort.PortInfo) => {
    return `<option value="${option.path}">${option.path}</option>`;
};

const renderMidiDeviceOption = (device: string) => {
    return `<option value="${device}">${device}</option>`;
};

const renderBaudRateOption = (rate: number) => {
    return `<option value="${rate}">${rate}</option>`;
};

function bindPort(currentPort: string) {
    port = new SerialPort(currentPort, { baudRate: state.baudRate });
    // const parser = new Readline();
    // port.pipe(parser);
    const parser = port.pipe(new ByteLength({ length: 3 }));
    // tslint:disable-next-line:no-console
    parser.on('data', data => {
        console.log(data);
    }); // will have 8 bytes per data event
    if (state.midiInput) {
        midiInput = new easymidi.Input(state.midiInput, state.midiInput === '__virtualInput');
    }

    if (state.midiOutput) {
        midiOutput = new easymidi.Output(state.midiOutput, state.midiOutput === '__virtualOutput');
    }

    // parser.on('data', (line: string) => {
    //     const signal = line.split(',');
    //
    //     // if (Number(signal[1]) === 127) {
    //     //     // @ts-ignore
    //     //     midiOutput.send('noteon', {
    //     //         note: line.split(',')[0],
    //     //         velocity: line.split(',')[1],
    //     //         channel: 3
    //     //     });
    //     // } else if (Number(signal[1]) === 0) {
    //     //     // @ts-ignore
    //     //     midiOutput.send('noteoff', {
    //     //         note: line.split(',')[0],
    //     //         velocity: line.split(',')[1],
    //     //         channel: 3
    //     //     });
    //     //     // tslint:disable-next-line:no-empty
    //     // } else {
    //     // }
    //
    //     console.log(`> ${line}`);
    // });
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
    // @ts-ignore
    if (midiInput) {
        // @ts-ignore
        midiInput.close();
        midiInput = undefined;
    }
}

function resetOutput() {
    // @ts-ignore
    if (midiOutput) {
        // @ts-ignore
        midiOutput.close();
        midiOutput = undefined;
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

function core() {
    const toggle = document.getElementById('bridgeToggle');
    const portSelection = document.getElementById('portSelection');
    const baudRateSelection = document.getElementById('baudRateSelection');
    const midiInputSelection = document.getElementById('inputSelection');
    const midiOutputSelection = document.getElementById('outputSelection');

    const inputs = easymidi.getInputs();
    const outputs = easymidi.getOutputs();

    for (const input of inputs) {
        midiInputSelection.innerHTML = midiInputSelection.innerHTML + renderMidiDeviceOption(input);
    }

    midiInputSelection.addEventListener('change', (e: Event) => {
        // resetInput();

        state.midiInput = (e.target as HTMLSelectElement).value;
        reconnect();
    });
    for (const output of outputs) {
        midiOutputSelection.innerHTML =
            midiOutputSelection.innerHTML + renderMidiDeviceOption(output);
    }
    midiOutputSelection.addEventListener('change', e => {
        // resetOutput();
        // @ts-ignore
        state.midiOutput = e.target.value;
        reconnect();
    });
    for (const rate of baudRates) {
        baudRateSelection.innerHTML = baudRateSelection.innerHTML + renderBaudRateOption(rate);
    }
    baudRateSelection.addEventListener('change', e => {
        state.baudRate = Number((e.target as HTMLSelectElement).value);
        reconnect();
    });

    toggle.addEventListener('change', e => {
        // @ts-ignore
        if (e.target.checked === true && state.currentPort) {
            bindPort(state.currentPort);
        } else {
            unbindPort();
        }
        state.bridgeEnabled = (e.target as HTMLInputElement).checked;
        console.log(state);
    });

    SerialPort.list().then(ports => {
        if (ports.length) {
            for (const serialPort of ports) {
                portSelection.innerHTML = portSelection.innerHTML + renderOption(serialPort);
            }
            portSelection.removeAttribute('disabled');
            baudRateSelection.removeAttribute('disabled');
            midiInputSelection.removeAttribute('disabled');
            midiOutputSelection.removeAttribute('disabled');
            portSelection.addEventListener('change', e => {
                state.currentPort = (e.target as HTMLSelectElement).value;
            });
        }
    });
}
window.addEventListener('DOMContentLoaded', core);
