import React, { useState } from 'react';
import './App.css';
import TodoApp from './components/TodoApp';

function App() {
  const [space,] = useState("sample");
  return (
    <>
      <header><h1>Todo App</h1></header>
      <main>
        <TodoApp space={space} />
      </main>
    </>
  );
}

export default App;
