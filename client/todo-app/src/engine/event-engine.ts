import { ID } from '../components/TodoItem';
import { extendItems, Items, itemsSample } from '../components/TodoList';

type Sync = State;
export const dummySync: Sync = { items: itemsSample, timestamp: 'dummy', mode: 'sync' };

type Operation = (
    'toggleDone'
    | 'updateStatement'
    | 'create'
    | 'syncState'
    | 'publishState'
    | 'switchMode' // internal
);

export type Command = {
    operation: Operation;
    payload: {
        id: ID;
        statement: string;
        sync: Sync;
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
    let jcommand: JCommand = {
        ...obj.command,
        payload: {
            ...obj.command.payload,
            sync: {
                ...obj.command.payload.sync,
                items: new Map(Object.entries(obj.command.payload.sync.items))
            }
        }
    };
    return { ...obj, command: jcommand };
};


// type State = Items;
type State = {
    items: Items,
    timestamp: string,
    mode: EngineMode
};
export const stateSample: State = {
    items: itemsSample,
    timestamp: 'dummy',
    mode: 'sync',
};

export type Reducer = (state: State, event: Event) => State;
type Publish = {
    flag: boolean,
    command: Command
}
export var publish: Publish = {
    flag: false,
    command: {
        operation: 'syncState',
        payload: {
            id: 'dummy_id_by_publish',
            statement: 'dummy_Statement_by_publish',
            sync: dummySync
        }
    }
};

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
    switch (op) {
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
                return { ...state, items: newItems, timestamp: event.timestamp };
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
                return { ...state, items: newItems, timestamp: event.timestamp };
            }
        case 'create':
            {
                const { statement } = event.command.payload;
                const id = event.timestamp;
                const newItems = extendItems(id, statement, items);
                return { ...state, items: newItems, timestamp: event.timestamp };
            }

        case 'publishState':
            {
                console.log('publish state')
                publish.flag = true;
                publish.command.payload.sync = state;
                console.log(publish);
                return state;
            }
        case 'syncState':
            return state;
        case 'switchMode':
            {
                return { ...state, mode: 'sync' }
            }
    }
};

// --- sync ---

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
            let state = sync;
            engine_state.events
                .filter(({ timestamp }) => timestamp > sync.timestamp) // なくても変わらない想定
                .forEach(event => state = interactiveReducer(state, event));
            engine_state.events = [];
            console.log('finish sync mode')
            return { ...state, mode: 'interactive' };
        case 'publishState':
            return items;
        default:
            engine_state.events.push(event);
            return items;
    }
}
// --- end sync ---

export type EngineMode = 'sync' | 'interactive'
export const reducers: Map<EngineMode, Reducer> = new Map([
    ['sync', syncReducer],
    ['interactive', interactiveReducer],
]);

export default reducer;