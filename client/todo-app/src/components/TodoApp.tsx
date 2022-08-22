import React, { useEffect, useState, useRef, useReducer } from "react";
import Controller, { FilterCond } from "./Controller";
import Input from "./Input";
import TodoList, { itemsSample } from "./TodoList";
import { ID } from './TodoItem';
import { Command, Event } from '../engine/event-engine';
import reducer from "../engine/event-engine";


const TodoApp: React.FC<{ space: string }> = ({ space }) => {
    const clientRef = useRef<WebSocket>()
    const submitTodoCommand = function (te: Command) {
        const ws = clientRef.current;
        if (!ws) {
            // alert("network error");
            return;
        }
        ws.send(JSON.stringify(te));
    };

    // set up ws
    useEffect(() => {
        const wsClient = new WebSocket("ws://localhost:8080/ws")
        clientRef.current = wsClient;
        wsClient.onopen = () => {
            console.log("connect");
            // wsClient.send('hello from client')
        };
        wsClient.onclose = () => console.log("closed")


        return () => { wsClient.close() };
    }, []);

    // set up event subscriber
    const [items, dispatch] = useReducer(reducer, itemsSample);
    useEffect(() => {
        if (!clientRef.current) {
            // alert('bad WS connection');
            return;
        }
        const ws = clientRef.current;
        ws.onmessage = ((event: any) => {
            const msg = event.data;
            const te: Event = JSON.parse(msg);
            dispatch(te)
        });

    }, [])
    const [show, setShow] = useState<FilterCond>('all');


    const handleCreateNewItem = (e: React.SyntheticEvent): void => {
        e.preventDefault();
        const target = e.target as typeof e.target & { value: string }[];
        const statement = target[0].value;
        const command: Command = {
            operation: "create",
            payload: {
                id: "dummy_on_handleCreateNewItem", // これはエンジンが指定する。この時点ではこの命令が発行されるとはかぎらないので 
                statement: statement,
            }
        };
        submitTodoCommand(command);
        return
    }

    const handleToggleDone = (e: any, id: ID) => {
        e.preventDefault();
        const command: Command = {
            operation: "toggleDone",
            payload: {
                id: id,
                statement: "dummy_on_toggleDone",
            }
        };
        submitTodoCommand(command);
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
            <Input handleSubmit={handleCreateNewItem} />
            <Controller onFilterChange={onFilterChange} current={show} />
            <TodoList items={items} show={show} onToggleDone={handleToggleDone} />
        </div>
    );

};

export default TodoApp;
