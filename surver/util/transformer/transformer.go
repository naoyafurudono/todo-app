package transformer

type State struct {
	Items     map[string]*TodoItem `json:"items"`
	Timestamp string      `json:"timestamp"`
}

// ------- TodoItem -------
type ID string
type Timestamp string

type TodoItem struct {
	ID           ID        `json:"id"`
	Done         bool      `json:"done"`
	Statement    string    `json:"statement"`
	// Created      Timestamp `json:"created"`
	// LastModified Timestamp `json:"lastmodified"`
}

type Op string

const (
	Create          Op = "create"
	ToggleDone      Op = "toggleDone"
	UpdateStatement Op = "updateStatement"
	SyncState       Op = "syncState"
	PublishState    Op = "publishState"
)

type Event struct {
	Command   Command `json:"command"`
	Timestamp string  `json:"timestamp"`
}

type Command struct {
	Operation Op      `json:"operation"`
	Payload   Payload `json:"payload"`
}

type Payload struct {
	ID        ID     `json:"id"`
	Statement string `json:"statement"`
	Sync      Sync   `json:"sync"`
}
type Sync State
