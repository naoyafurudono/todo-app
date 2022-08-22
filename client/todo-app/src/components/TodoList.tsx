// Todo リストの表示
import React from "react"
import { FilterCond } from "./Controller";
import TodoItem, { Item, ID } from './TodoItem'
type Props = {
    items: Item[];
    show: 'all' | 'todo' | 'done';
    onToggleDone: any;
}

// items の先頭が一番昔に追加されたもの
const TodoList: React.FC<Props> = ({ items, onToggleDone, show }) => {
    return (
        <>
            <h2>Items</h2>
            <ol>
                {items.filter(item => filterItem(show, item)).reverse().map(item =>
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

export const itemsSample: Item[] = [
    {
        id: "sample00",
        done: false,
        statement: "just do it!!",
        // created: "2022-08-20T19:11:21",
        // lastmodified: "2022-08-20T19:11:21",
    },
    {
        id: "sample01",
        done: true,
        statement: "check did it",
        // created: "2022-08-20T19:11:21",
        // lastmodified: "2022-08-20T19:11:21",
    },

];
