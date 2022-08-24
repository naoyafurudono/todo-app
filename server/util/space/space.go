package space

import (
	"fmt"
	"log"
	"net/http"
)

type forwardMessage struct {
	command *Request
	source  *client
}

// チャットの部屋
type Space struct {
	forward chan *forwardMessage
	join    chan *client
	leave   chan *client
	clients map[*client]bool // 所有する
	state   State
	idGen   func() ID
	name    string
}

func NewSpace(name string) Space {
	return Space{
		forward: make(chan *forwardMessage),
		join:    make(chan *client),
		leave:   make(chan *client),
		clients: make(map[*client]bool),
		state:   make(map[ID]*TodoItem),
		idGen:   IDGenGenerator(),
		name:    name,
	}
}

// spaceのセッション
func (s Space) Run() {
	log.Println("start running")
	for {
		log.Printf("space: client: %d\n", len(s.clients))
		select {
		case client := <-s.join:
			log.Println("s.Run: join a client")
			s.clients[client] = true
		case client := <-s.leave:
			log.Println("s.Run: leave a client")
			delete(s.clients, client)
			close(client.send)

		case message := <-s.forward:
			log.Printf("s.Run: forward message of %s", message.command.Operation)

			s.Exec(*message.command)
			for client := range s.clients {
				select {
				case client.send <- &s.state:
					// success to send message
				default:
					// 送信に失敗
					// clientを殺す
					delete(s.clients, client)
					close(client.send)
				}
			}
		}
	}
}

// client session
func (s Space) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Println("WS request come")
	socket, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Fatal("ServeHTTP:", err)
		return
	}

	log.Println("init: client session")
	defer func() {
		log.Println("finish: client session")
	}()

	client := &client{
		socket: socket,
		send:   make(chan *State, messageBufferSize),
		space:  &s,
		name:   getName(),
	}
	// if authCookie, err := req.Cookie("auth"); err == nil {
	// 	name := authCookie.Value
	// 	client.name = name
	// }

	log.Println("try to join space")
	s.join <- client
	log.Println("succeed to join space")
	defer func() { s.leave <- client }()
	go client.toClient()
	log.Println("start listening")
	client.send <- &s.state
	client.fromClient()
}

var nameseed = 0

func getName() string {
	name := fmt.Sprintf("%02d", nameseed)
	nameseed += 1
	return name
}
