package space

import (
	"log"
	"net/http"
	"todo-server/util/transformer"
)

// type SpaceHandle struct {
// 	spaces map[string]Space
// }

// // func newSpaceHandle() SpaceHandle {
// // 	return SpaceHandle{}
// // }

// // spaceへの接続要求を処理する。
// // 該当スペースで受け入れる
// func (handle SpaceHandle) ServeHTTP(w http.ResponseWriter, r *http.Request) {
// 	query := r.URL.Query()
// 	spaceName := query.Get("space")
// 	if spaceName == "" {
// 		spaceName = "sample"
// 	}

// 	if _, exist := handle.spaces[spaceName]; !exist {
// 		space := NewSpace(spaceName)
// 		handle.spaces[spaceName] = space
// 		space.run()
// 	}

// }

// type Message string
type Message = transformer.Command

// チャットの部屋
type Space struct {
	forward chan *Message
	join    chan *client
	leave   chan *client
	clients map[*client]bool // 所有する
	name    string
}

func NewSpace(name string) Space {
	return Space{
		forward: make(chan *Message),
		join:    make(chan *client),
		leave:   make(chan *client),
		clients: make(map[*client]bool),
		name:    name,
	}
}

// spaceのセッション
func (s Space) Run() {
	log.Println("start running")
	for {
		log.Println("running in loop")
		select {
		case client := <-s.join:
			log.Println("s.Run: join a client")
			s.clients[client] = true
		case client := <-s.leave:
			log.Println("s.Run: leave a client")
			delete(s.clients, client)
			close(client.send)

			// if len(s.clients) == 0 {
			// 	return
			// }
		case msg := <-s.forward:
			log.Println("s.Run: forward message")
			for client := range s.clients {
				client := client
				select {
				case client.send <- msg:
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
		send:   make(chan *Message, messageBufferSize),
		space:  &s,
	}
	// if authCookie, err := req.Cookie("auth"); err == nil {
	// 	name := authCookie.Value
	// 	client.name = name
	// }

	log.Println("try to join space")
	s.join <- client
	log.Println("succeed to join space")
	defer func() { s.leave <- client }()
	go client.startWrite()
	log.Println("start listening")
	client.startRead()
}
