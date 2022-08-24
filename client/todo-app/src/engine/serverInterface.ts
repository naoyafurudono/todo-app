import { ID } from '../components/TodoItem';
import { Items, itemsSample } from '../components/TodoList';

export type State = Items;
export const stateSample: State = itemsSample;

type Operation = (
    'toggleDone'
    | 'updateStatement'
    | 'create'
    | 'syncState'
    // | 'publishState'
    // | 'switchMode' // internal
);

export type Request = {
    operation: Operation;
    payload: {
        id: ID;
        statement: string;
    }
};

export const encodeToJSON = function (command: Request): string {
    return JSON.stringify(command);
};

export const decodeJSON = function (jsonStr: string): State {
    return new Map(Object.entries(JSON.parse(jsonStr)));
};
