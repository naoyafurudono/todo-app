// Todo リストの表示
import React from "react"
import { FilterCond } from "./Controller";
import TodoItem, { Item, ID, createItem } from './TodoItem'

export type Items = Map<string, Item>;
export const extendItems = function (statement: string, items: Items): Items {
    const newItem: Item = createItem(statement);
    const newItems = new Map([...items]);
    newItems.set(newItem.id, newItem);
    return newItems;
};
type Props = {
    items: Items;
    show: 'all' | 'todo' | 'done';
    onToggleDone: any;
}

// items の先頭が一番昔に追加されたもの
const TodoList: React.FC<Props> = ({ items, onToggleDone, show }) => {
    return (
        <>
            <h2>Items</h2>
            <ol>
                {[...items.values()].filter(item => filterItem(show, item)).reverse().map(item =>
                    <li key={item.id}>
                        <TodoItem item={item} onToggleDone={(e: any, itemID: ID) => onToggleDone(e, itemID, items)} />
                    </li>
                )}
            </ol>
        </>
    );
};

const filterItem = (op: FilterCond, item: Item) => {
    switch (op) {
        case 'all':
            return true;

        case 'done':
            return item.done;

        case 'todo':
            return !item.done;
    }
}


export default TodoList

export const itemsSample: Items = new Map([
    ["sample00", {
        id: "sample00",
        done: false,
        statement: "dummy1",
        // created: "2022-08-20T19:11:21",
        // lastmodified: "2022-08-20T19:11:21",
    }],
    ["sample01", {
        id: "sample01",
        done: true,
        statement: "dummy2 !!",
        // created: "2022-08-20T19:11:21",
        // lastmodified: "2022-08-20T19:11:21",
    }],
]);
