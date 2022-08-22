import { ID } from '../components/TodoItem';
import { extendItems, Items } from '../components/TodoList';

type Operation = 'toggleDone' | 'updateStatement' | 'create';
export type Command = {
    operation: Operation;
    payload: {
        id: ID;
        statement: string;
    }
};
export type Event = {
    command: Command;
    timestamp: string; // RFC3339 with UTC
};

type State = Items;

export type Reducer = (state: State, event: Event ) => State;
const reducer: Reducer = (items, event) => { 
    const op = event.command.operation;
    switch (op) {
        case 'toggleDone':
            {
                const { id } = event.command.payload;
                const newItems = new Map([ ...items ]);
                const target = newItems.get(id);
                if (!target) {
                    return items;
                };
                // target.done = !target.done;
                // newItems.set(id, target);
                newItems.set(id, {
                    id: id,
                    statement: target.statement,
                    done: !target.done
                });
                return newItems;
            }
        case 'updateStatement':
            {
                const { id, statement } = event.command.payload;
                const newItems = new Map([ ...items ]);
                const target = newItems.get(id);
                if (!target) {
                    return items;
                };
                target.statement = statement;
                return newItems;
            }
        case 'create':
            {
                const { statement } = event.command.payload;
                const newItems = extendItems(statement, items);
                return newItems;
            }
    }
};

export default reducer;