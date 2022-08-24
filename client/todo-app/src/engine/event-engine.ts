import { ID } from '../components/TodoItem';
import { extendItems, Items, itemsSample } from '../components/TodoList';

// type Sync = State;
type Sync = {
    items: Items,
    timestamp: string,
    mode: EngineMode,
};

type Publish = {
    flag: boolean,
    command: Command | undefined
}
type State = {
    items: Items,
    timestamp: string,
    mode: EngineMode,
    publish: Publish,  // 特別。送る瞬間だけ値がセットされる。このフィールド自体は共有されない。
};

type Operation = (
    'toggleDone'
    | 'updateStatement'
    | 'create'
    | 'syncState'
    | 'publishState'
    // | 'switchMode' // internal
);

export type Command = {
    operation: Operation;
    payload: {
        id: ID;
        statement: string;
        sync: Sync;
    }
};

export var dummyPublish: Publish = {
    flag: false,
    command: undefined
};
export const stateSample: State = {
    items: itemsSample,
    timestamp: 'dummy',
    mode: 'sync',
    publish: dummyPublish,
};


export const dummySync: Sync = { items: itemsSample, timestamp: 'dummy', mode: 'sync' };// , publish: dummyPublish };
const dummyCommand: Command = {
    operation: 'toggleDone',
    payload: {
        id: 'dummy id',
        statement: 'dummy statement',
        sync: dummySync,
    }
};
type JCommand = {
    operation: Operation;
    payload: {
        id: ID;
        statement: string;
        sync: {
            items: any;
            timestamp: string;
            mode: EngineMode;
        }
    }
};

export type Event = {
    command: Command;
    timestamp: string; // RFC3339 with UTC
};
type JEvent = {
    command: JCommand;
    timestamp: string;
};
export const encodeToJSON = function (command: Command): string {
    let jcommand: JCommand = {
        ...command,
        payload: {
            ...command.payload,
            sync: {
                ...command.payload.sync,
                items: Object.fromEntries(command.payload.sync.items)
            }
        }
    };
    return JSON.stringify(jcommand);
};
export const decodeJSON = function (jsonStr: string): Event {
    const obj: JEvent = JSON.parse(jsonStr);
    let jcommand: Command = {
        ...obj.command,
        payload: {
            ...obj.command.payload,
            sync: {
                ...obj.command.payload.sync,
                // publish: ,
                items: new Map(Object.entries(obj.command.payload.sync.items)),
            }
        }
    };
    return { ...obj, command: jcommand };
};


export type Reducer = (state: State, event: Event) => State;
export const reducer: Reducer = (state: State, event: Event) => {
    switch (state.mode) {
        case 'interactive':
            return interactiveReducer(state, event);
        case 'sync':
            return syncReducer(state, event);
    }
}
const interactiveReducer = function (state: State, event: Event): State {
    console.log('interactive reducer invoked');
    const { items } = state;
    const op = event.command.operation;
    let newState: State;
    switch (op) {
        case 'publishState':
            {
                newState = { ...state };
                newState.publish = {
                    flag: true,
                    command: {
                        operation: 'syncState',
                        payload: {
                            ...dummyCommand.payload,
                            sync: state,
                        }
                    }
                };
                return newState;
            }
        case 'toggleDone':
            {
                const { id } = event.command.payload;
                const newItems = new Map([...items]);
                const target = newItems.get(id);
                if (!target) {
                    return state;
                };
                newItems.set(id, {
                    id: id,
                    statement: target.statement,
                    done: !target.done
                });
                newState = { ...state, items: newItems, timestamp: event.timestamp };
                break;
            }
        case 'updateStatement':
            {
                const { id, statement } = event.command.payload;
                const newItems = new Map([...items]);
                const target = newItems.get(id);
                if (!target) {
                    return state;
                };
                target.statement = statement;
                newState = { ...state, items: newItems, timestamp: event.timestamp };
                break;
            }
        case 'create':
            {
                const { statement } = event.command.payload;
                const id = event.timestamp;
                const newItems = extendItems(id, statement, items);
                newState = { ...state, items: newItems, timestamp: event.timestamp };
                break;
            }
        case 'syncState':
            newState = state;
            break;
        // case 'switchMode':
        //     {
        //         newState = { ...state, mode: 'sync' }
        //         break;
        //     }
    }
    newState.publish = dummyPublish;
    return newState;
};

type Engine_state = {
    events: Event[];
}
const engine_state: Engine_state = {
    events: [],
};

// access global variable `engine_state`
const syncReducer = function (items: State, event: Event): State {
    console.log('sync reducer invoked', event);
    const op = event.command.operation;
    switch (op) {
        case 'syncState':
            const sync = event.command.payload.sync;
            let state: State = { ...sync, publish: dummyPublish };
            engine_state.events
                .filter(({ timestamp }) => timestamp > sync.timestamp) // なくても変わらない想定
                .forEach(event => state = interactiveReducer(state, event));
            engine_state.events = [];
            console.log('finish sync mode')
            const next: State = { ...state, mode: 'interactive' };
            console.log('end sync ', next);
            return next;
        case 'publishState':
            return items;
        default:
            engine_state.events.push(event);
            return items;
    }
}

export type EngineMode = 'sync' | 'interactive'
export const reducers: Map<EngineMode, Reducer> = new Map([
    ['sync', syncReducer],
    ['interactive', interactiveReducer],
]);

export default reducer;