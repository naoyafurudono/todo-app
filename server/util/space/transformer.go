package space

import "fmt"

type State = map[ID]*TodoItem

// ------- TodoItem -------
type ID string
type Timestamp string

type TodoItem struct {
	ID        ID     `json:"id"`
	Done      bool   `json:"done"`
	Statement string `json:"statement"`
}

type Op string

const (
	Create          Op = "create"
	ToggleDone      Op = "toggleDone"
	UpdateStatement Op = "updateStatement"
	SyncState       Op = "syncState"
	// PublishState    Op = "publishState"
)

type Request struct {
	Operation Op      `json:"operation"`
	Payload   Payload `json:"payload"`
}
type Payload struct {
	ID        ID     `json:"id"`
	Statement string `json:"statement"`
}

func IDGenGenerator() func() ID {
	var idSeed = 0
	return func() ID {
		newID := ID(fmt.Sprintf("%05d", idSeed))
		idSeed += 1
		return newID
	}
}

func (s Space) Exec(command Request) {
	op := command.Operation
	Payload := command.Payload
	switch op {
	case Create:
		id := s.idGen()
		newItem := TodoItem{
			ID:        id,
			Done:      false,
			Statement: Payload.Statement,
		}
		s.state[id] = &newItem
	case ToggleDone:
		s.state[Payload.ID].Done = !s.state[Payload.ID].Done
	case UpdateStatement:
		s.state[Payload.ID].Statement = Payload.Statement
	case SyncState:
		// no effect to the state
		_ = struct{}{}
	}
}
