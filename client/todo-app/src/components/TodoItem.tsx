// Todo リストの各アイテム
import React from "react";

// ------ item -------
export type ID = string;
// type Timestamp = string;
export type Item = {
    id: ID;
    done: boolean;
    statement: string;
    // created: Timestamp;
    // lastmodified: Timestamp;
};

type ItemProp = {
    item: Item;
    onToggleDone: any;

}

const TodoItem: React.FC<ItemProp> = (props) => {
    const { item, onToggleDone } = props;

    return (
        <form>
            <button onClick={e => onToggleDone(e, item.id, item)}> {item.done ? "Done" : "Todo"}</button>

            <span > {item.statement}</span>
        </form>
    )
};

var idseed = 0;
const genID = () => {
    const str = ("0".repeat(10) + String(idseed)).substring(-10);
    idseed += 1;
    return str;
};

export const createItem = (statement: string) => {
    return {
        id: genID(),
        done: false,
        statement: statement
    };


};

export default TodoItem;