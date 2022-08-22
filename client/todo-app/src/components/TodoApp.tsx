import React, { useState } from "react";
import Controller, { FilterCond } from "./Controller";
import Input from "./Input";
import TodoList, { itemsSample } from "./TodoList";
import { Item, createItem, ID } from './TodoItem';


const TodoApp: React.FC<{ space: string }> = ({space}) => {

    const [items, setItems] = useState<Item[]>(itemsSample);
    const [show, setShow] = useState<FilterCond>('all');

    const extendItems = (item: Item) => {
        let newItems = items.slice();
        newItems.push(item);
        setItems(newItems);
    };

    const handleSubmit = (e: React.SyntheticEvent): void => {
        e.preventDefault();
        const target = e.target as typeof e.target & { value: string }[];
        console.log(e);
        const item = createItem(target[0].value);
        extendItems(item);
    }

    const toggleDone = (e: any, id: ID, items: Item[]) => {
        e.preventDefault();
        const idx = items.findIndex((item: Item) => item.id === id);
        const newItems = items.slice();
        newItems[idx].done = !items[idx].done;
        setItems(newItems);
    }

    const onFilterChange = (e: any, op: FilterCond) => {
        e.preventDefault();
        setShow(op);
    };

    return (
        <div>
            <header>
                space: {space}
            </header>
            <Input handleSubmit={handleSubmit} />
            <Controller onFilterChange={onFilterChange} current={show} />
            <TodoList items={items} show={show} onToggleDone={toggleDone} />
        </div>
    );

};

export default TodoApp;