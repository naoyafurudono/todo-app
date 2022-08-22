// 新しいTodoアイテムの文章を書いて、登録する
import React, { useState } from "react";

const Input = (props: { handleSubmit: any; }) => {
    const { handleSubmit } = props;
    const [text, setText] = useState("");
    const handleChange =
        (e: { target: { value: React.SetStateAction<string>; }; }) => setText(e.target.value);
    const handleSubmitWithInit = (e: any) => {
        handleSubmit(e);
        setText("");
    };
    return (
        <>
            <h2>Add to input</h2>
            <form id="text-input" onSubmit={handleSubmitWithInit}>
                Enter to submit
                <input type="text" form="text-input" name="todo-input" placeholder="put todo item here" value={text} onChange={handleChange} />
            </form>
        </>
    );

};


export default Input;