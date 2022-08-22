package transformer

import (
	"fmt"
	"log"
	"time"
)

// 純粋にすることは諦める。
type State struct {
	Items []*TodoItem `json:"items"`
}

// ------- TodoItem -------
type ID string
type Timestamp string

func stamp() Timestamp {
	return Timestamp(time.Now().Format(time.RFC3339))
}

type TodoItem struct {
	ID           ID        `json:"id"`
	Done         bool      `json:"done"`
	Statement    string    `json:"statement"`
	Created      Timestamp `json:"created"`
	LastModified Timestamp `json:"lastmodified"`
}

var freshIDSeed int

func genID() ID {
	id := ID(fmt.Sprintf("%010d", freshIDSeed))
	freshIDSeed += 1
	return id
}

func createItem(statement string) TodoItem {
	id := genID()
	timestamp := stamp()
	return TodoItem{
		ID:           id,
		Statement:    statement,
		Created:      timestamp,
		LastModified: timestamp,
	}
}

// ----------------

type Op int

const (
	Create Op = iota
	ToggleDone
	ModifyStatement
)

type Command struct {
	Operation Op      `json:"operation"`
	Payload   Payload `json:"payload"`
}

type Payload struct {
	ID        ID     `json:"id"`
	Statement string `json:"statement"`
}

func getStatement(pl Payload) string {
	return pl.Statement
}

func getID(pl Payload) ID {
	return pl.ID
}

func findItem(items []*TodoItem, id ID) (index int, ok bool) {
	for index, item := range items {
		if item.ID == id {
			return index, true
		}
	}
	return -1, false
}

// 普通のreducerのように、新しい状態を返すことはせずに、stateを更新する
// この選択の動機は、単にGoでほとんど差がない構造体を作るのが面倒だから
func Reduce(state *State, cmd Command) {
	switch cmd.Operation {
	case Create:
		todoStmt := getStatement(cmd.Payload)

		newItem := createItem(todoStmt)
		state.Items = append(state.Items, &newItem)

		return
	case ToggleDone:
		targetID := getID(cmd.Payload)
		index, ok := findItem(state.Items, targetID)
		if !ok {
			log.Printf("invalid id specified: %s", targetID)
			return
		}
		newDone := !state.Items[index].Done

		state.Items[index].Done = newDone
		state.Items[index].LastModified = stamp()

		return
	case ModifyStatement:
		targetID := getID(cmd.Payload)
		index, ok := findItem(state.Items, targetID)
		if !ok {
			log.Printf("invalid id specified: %s", targetID)
			return
		}
		newStatement := getStatement(cmd.Payload)

		state.Items[index].Statement = newStatement
		state.Items[index].LastModified = stamp()

		return
	}
}
