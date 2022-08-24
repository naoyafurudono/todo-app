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

export const createItem = function (id: ID, statement: string): Item {
    return {
        id: id,
        done: false,
        statement: statement
    };


};

export default TodoItem;