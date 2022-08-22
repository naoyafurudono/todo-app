import React, { useEffect, useState, useRef } from "react";
import Controller, { FilterCond } from "./Controller";
import Input from "./Input";
import TodoList, { itemsSample } from "./TodoList";
import { Item, createItem, ID } from './TodoItem';


const TodoApp: React.FC<{ space: string }> = ({ space }) => {
    // set up ws
    const clientRef = useRef<WebSocket>()
    const [msgs, setMsgs] = useState<string[]>([])

    useEffect(() => {
        const wsClient = new WebSocket("ws://localhost:8080/ws")
        clientRef.current = wsClient;
        wsClient.onopen = () => {
            console.log("connect");
            wsClient.send('hello from client')
        };
        wsClient.onclose = () => console.log("closed")


        return () => { wsClient.close() };
    }, []);

    useEffect(() => {
        if (!clientRef.current) {
            return;
        }
        const ws = clientRef.current;
        ws.onmessage = ((event: any) => {
            console.log("message come")
            console.log(event.data)
            const newMsgs = msgs.slice();
            const msg = event.Data;
            newMsgs.push(msg);
            setMsgs(newMsgs);
            ws.send(JSON.stringify('how are you?'))
        });

    }, [msgs])

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
