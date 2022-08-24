import React, { useEffect, useState, useRef, useReducer } from "react";
import Controller, { FilterCond } from "./Controller";
import Input from "./Input";
import TodoList from "./TodoList";
import { ID } from './TodoItem';
import reducer, { encodeToJSON, decodeJSON, Reducer, Command, dummySync, Event, stateSample, publish } from '../engine/event-engine';

export var ackInit: Command = {
    operation: 'publishState',
    payload: {
        id: 'dummy_id_by_publish',
        statement: 'dummy_Statement_by_publish',
        sync: dummySync
    }
};

const TodoApp: React.FC<{ space: string }> = ({ space }) => {
    const clientRef = useRef<WebSocket>();
    const submitTodoCommand = function (te: Command) {
        const ws = clientRef.current;
        if (!ws) {
            // alert("network error");
            return;
        }
        ws.send(encodeToJSON(te));
        // ws.send(JSON.stringify(te));
    };

    // set up ws
    useEffect(() => {
        const wsClient = new WebSocket("ws://localhost:8080/ws")
        clientRef.current = wsClient;
        wsClient.onopen = () => {
            console.log("connected");
            submitTodoCommand(ackInit)
        };
        wsClient.onclose = () => console.log("closed")


        return () => { wsClient.close() };
    }, []);

    // set up event subscriber
    const [state, dispatch] = useReducer<Reducer>(reducer, stateSample);
    useEffect(() => {
        if (!clientRef.current) {
            alert('bad WS connection');
            return;
        }
        const ws = clientRef.current;
        ws.onmessage = ((event: any) => {
            const msg = event.data;
            const te: Event = decodeJSON(msg);
            dispatch(te);
            console.log(publish);
            if (publish.flag) {
                console.log('publish to ws')
                submitTodoCommand(publish.command);
                publish.flag = false;
            }
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
                sync: dummySync,
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
                sync: dummySync,
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
            <TodoList items={state.items} show={show} onToggleDone={handleToggleDone} />
        </div>
    );

};

export default TodoApp;
