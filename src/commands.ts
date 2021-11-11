// MIDI specs https://www.midi.org/specifications-old/item/table-2-expanded-messages-list-status-bytes
import {
    Channel,
    ChannelAfterTouch,
    ControlChange,
    Mtc,
    Note,
    Pitch,
    PolyAfterTouch,
    Position,
    Program,
    Select,
    Sysex
} from 'easymidi';

type TCommands =
    | 'noteon'
    | 'noteoff'
    | 'poly aftertouch'
    | 'cc'
    | 'program'
    | 'channel aftertouch'
    | 'pitch'
    | 'position'
    | 'mtc'
    | 'select'
    | 'clock'
    | 'start'
    | 'continue'
    | 'stop'
    | 'activesense'
    | 'reset'
    | 'sysex';

const commandsBase: Record<TCommands, number> = {
    noteoff: 127,
    noteon: 143,
    'poly aftertouch': 159,
    cc: 175,
    program: 191,
    'channel aftertouch': 207,
    pitch: 223,
    position: 242,
    mtc: 241,
    select: 243,
    clock: 248,
    start: 250,
    continue: 251,
    stop: 252,
    activesense: 254,
    sysex: 240,
    reset: 255
};

const statusBytes: Record<number, TCommands | undefined> = {
    128: 'noteoff',
    129: 'noteoff',
    130: 'noteoff',
    131: 'noteoff',
    132: 'noteoff',
    133: 'noteoff',
    134: 'noteoff',
    135: 'noteoff',
    136: 'noteoff',
    137: 'noteoff',
    138: 'noteoff',
    139: 'noteoff',
    140: 'noteoff',
    141: 'noteoff',
    142: 'noteoff',
    143: 'noteoff',
    144: 'noteon',
    145: 'noteon',
    146: 'noteon',
    147: 'noteon',
    148: 'noteon',
    149: 'noteon',
    150: 'noteon',
    151: 'noteon',
    152: 'noteon',
    153: 'noteon',
    154: 'noteon',
    155: 'noteon',
    156: 'noteon',
    157: 'noteon',
    158: 'noteon',
    159: 'noteon',
    160: 'poly aftertouch',
    161: 'poly aftertouch',
    162: 'poly aftertouch',
    163: 'poly aftertouch',
    164: 'poly aftertouch',
    165: 'poly aftertouch',
    166: 'poly aftertouch',
    167: 'poly aftertouch',
    168: 'poly aftertouch',
    169: 'poly aftertouch',
    170: 'poly aftertouch',
    171: 'poly aftertouch',
    172: 'poly aftertouch',
    173: 'poly aftertouch',
    174: 'poly aftertouch',
    175: 'poly aftertouch',
    176: 'cc',
    177: 'cc',
    178: 'cc',
    179: 'cc',
    180: 'cc',
    181: 'cc',
    182: 'cc',
    183: 'cc',
    184: 'cc',
    185: 'cc',
    186: 'cc',
    187: 'cc',
    188: 'cc',
    189: 'cc',
    190: 'cc',
    191: 'cc',
    192: 'program',
    193: 'program',
    194: 'program',
    195: 'program',
    196: 'program',
    197: 'program',
    198: 'program',
    199: 'program',
    200: 'program',
    201: 'program',
    202: 'program',
    203: 'program',
    204: 'program',
    205: 'program',
    206: 'program',
    207: 'program',
    208: 'channel aftertouch',
    209: 'channel aftertouch',
    210: 'channel aftertouch',
    211: 'channel aftertouch',
    212: 'channel aftertouch',
    213: 'channel aftertouch',
    214: 'channel aftertouch',
    215: 'channel aftertouch',
    216: 'channel aftertouch',
    217: 'channel aftertouch',
    218: 'channel aftertouch',
    219: 'channel aftertouch',
    220: 'channel aftertouch',
    221: 'channel aftertouch',
    222: 'channel aftertouch',
    223: 'channel aftertouch',
    224: 'pitch',
    225: 'pitch',
    226: 'pitch',
    227: 'pitch',
    228: 'pitch',
    229: 'pitch',
    230: 'pitch',
    231: 'pitch',
    232: 'pitch',
    233: 'pitch',
    234: 'pitch',
    235: 'pitch',
    236: 'pitch',
    237: 'pitch',
    238: 'pitch',
    239: 'pitch',
    240: 'sysex',
    241: 'mtc',
    242: 'position',
    243: 'select',
    244: undefined,
    245: undefined,
    246: undefined,
    247: undefined,
    248: 'clock',
    249: undefined,
    250: 'start',
    251: 'continue',
    252: 'stop',
    253: undefined,
    254: 'activesense',
    255: 'reset'
};

const extractChannel = (message: Array<number>): Channel | undefined => {
    if (message.length) {
        const command = statusBytes[message[0]];
        // Note: MIDI Supports up to 16 channels.
        // easymidi library Channel number starts at 0, not at 1.
        console.log(message, command, commandsBase[command]);
        return (message[0] - commandsBase[command] - 1) as Channel;
    }
    return;
};

const prepareBytes = (buffer: Buffer) => {
    const arrayBuffer = new Uint8Array(buffer);
    return Array.from(arrayBuffer);
};

export const decodeMessage = (messageRaw: Buffer) => {
    const message = prepareBytes(messageRaw);
    if (message.length) {
        const command = statusBytes[message[0]];
        switch (command) {
            case 'noteoff':
            case 'noteon': {
                const note: Note = {
                    note: message[1],
                    velocity: message[2],
                    channel: extractChannel(message)
                };
                return { action: command, payload: note };
            }
            case 'poly aftertouch': {
                const polyAfterTouch: PolyAfterTouch = {
                    note: message[1],
                    pressure: message[2],
                    channel: extractChannel(message)
                };
                return { action: command, payload: polyAfterTouch };
            }
            case 'cc':
                const controlChange: ControlChange = {
                    controller: message[1],
                    value: message[2],
                    channel: extractChannel(message)
                };
                return { action: command, payload: controlChange };
            case 'program': {
                const program: Program = {
                    number: message[1],
                    channel: extractChannel(message)
                };
                return { action: command, payload: program };
            }
            case 'channel aftertouch':
                const channelAfterTouch: ChannelAfterTouch = {
                    pressure: message[1],
                    channel: extractChannel(message)
                };
                return { action: command, payload: channelAfterTouch };
            case 'pitch': {
                const pitch: Pitch = {
                    value: message[1],
                    channel: extractChannel(message)
                };
                return { action: command, pitch };
            }
            case 'position': {
                const position: Position = {
                    value: message[1]
                };
                return { action: command, payload: position };
            }
            case 'mtc': {
                const mtc: Mtc = {
                    type: message[1],
                    value: message[2]
                };
                return { action: command, payload: mtc };
            }
            case 'select': {
                const select: Select = {
                    song: message[1]
                };
                return { action: command, payload: select };
            }
            case 'clock':
            case 'start':
            case 'continue':
            case 'stop':
            case 'activesense':
            case 'reset': {
                return { action: command };
            }
            case 'sysex': {
                const [_, ...bytes] = message;
                const sysex: Sysex = {
                    bytes: bytes
                };
                return { action: command, payload: sysex };
            }
            default:
                break;
        }
    }
};
