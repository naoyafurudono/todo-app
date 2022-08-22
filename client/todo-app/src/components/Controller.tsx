// リストの表示条件を制御する
import React from "react";

type ControllerProps = {
    onFilterChange: any;
    current: FilterCond; // TODO: 選択中の条件の見え方を変える。
}

export type FilterCond = 'all' | 'todo' | 'done';
const Controller = ({ onFilterChange }: ControllerProps) => {
    return (
        <div>
            <h2>Filter</h2>
            <button onClick={e => onFilterChange(e, 'todo')}>Todo</button>
            <button onClick={e => onFilterChange(e, 'all')}>All</button>
            <button onClick={e => onFilterChange(e, 'done')}>Done</button>
        </div>
    )
};

export default Controller;