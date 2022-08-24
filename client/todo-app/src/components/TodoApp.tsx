import React, { useEffect, useState, useRef } from "react";
import Controller, { FilterCond } from "./Controller";
import Input from "./Input";
import TodoList, { Items, itemsSample } from "./TodoList";
import { ID } from './TodoItem';
// import reducer, { encodeToJSON, decodeJSON, Reducer, Command, dummySync, Event, stateSample } from '../engine/event-engine';
import { Request, encodeToJSON, State, decodeJSON } from "../engine/serverInterface";


// アプリの機能的なトップレベル
// Todoリストの状態管理やサーバとのコネクションの管理を行う
const TodoApp: React.FC<{ space: string }> = ({ space }) => {
    // ----------- setup event subscriber -----------
    // const [state, dispatch] = useReducer<Reducer>(reducer, stateSample);
    const [state, setState] = useState<Items>(itemsSample);
    // publish my state to sync with new comer
    // useEffect(() => {
    //     if (state.mode === 'interactive' && state.publish && state.publish.command) {
    //         submitTodoCommand(state.publish.command);
    //     }
    // }, [state.mode, state.publish])

    // setup connection to the server 
    const clientRef = useRef<WebSocket>();
    const submitTodoRequest = function (te: Request) {
        const ws = clientRef.current;
        if (!ws) {
            return;
        }
        ws.send(encodeToJSON(te));
    };

    // setup ws, connect to the reducer
    useEffect(() => {
        const wsClient = new WebSocket("ws://localhost:8080/ws")
        clientRef.current = wsClient;
        wsClient.onopen = () => {
            console.log("connected");
            // submitTodoCommand(ackInit)
        };
        wsClient.onclose = () => console.log("closed");
        wsClient.onmessage = ((event: any) => {
            const msg: string = event.data;
            console.log(msg);
            const newState: State = decodeJSON(msg);
            setState(newState)
        });
        return () => { wsClient.close() };
    }, []);
    // -------------------------------------------------------

    // --------------------- view ----------------------------
    const handleCreateNewItem = (e: React.SyntheticEvent): void => {
        e.preventDefault();
        const target = e.target as typeof e.target & { value: string }[];
        const statement = target[0].value;
        const request: Request = {
            operation: "create",
            payload: {
                id: "dummy_on_handleCreateNewItem", // これはエンジンが指定する。この時点ではこの命令が発行されるとはかぎらないので 
                statement: statement,
            }
        };
        submitTodoRequest(request);
        return
    }

    const handleToggleDone = (e: any, id: ID) => {
        e.preventDefault();
        const request: Request = {
            operation: "toggleDone",
            payload: {
                id: id,
                statement: "dummy_on_toggleDone",
            }
        };
        submitTodoRequest(request);
    }

    const [show, setShow] = useState<FilterCond>('all');
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
            <TodoList items={state} show={show} onToggleDone={handleToggleDone} />
        </div>
    );
    // -------------------------------------------------------

};

export default TodoApp;
