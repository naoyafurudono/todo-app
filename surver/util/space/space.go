package space

import (
	"log"
	"net/http"
	"time"
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

// チャットの部屋
type Space struct {
	forward chan *transformer.Command
	join    chan *client
	leave   chan *client
	clients map[*client]bool // 所有する
	name    string
}

func NewSpace(name string) Space {
	return Space{
		forward: make(chan *transformer.Command),
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
		log.Printf("space: client: %d\n", len(s.clients))
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
			event := transformer.Event{
				Command:   *msg,
				Timestamp: time.Now().Format(time.RFC3339Nano),
			}
			for client := range s.clients {
				select {
				case client.send <- &event:
					// success to send message
				default:
					// 送信に失敗
					// clientを殺す
					delete(s.clients, client)
					close(client.send)
				}
			}

			if len(s.clients) == 1 && msg.Operation == transformer.PublishState {
				log.Println("sync from server")
				initEvent := transformer.Event{
					Command: transformer.Command{
						Operation: transformer.SyncState,
						Payload: transformer.Payload{
							ID:        "dummy from server to init client",
							Statement: "dummy from server to init client",
							Sync: transformer.Sync{
								Items:     map[string]*transformer.TodoItem{},
								Timestamp: event.Timestamp,
							},
						},
					},
					Timestamp: event.Timestamp,
				}
				for client := range s.clients {
					select {
					case client.send <- &initEvent:
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
		send:   make(chan *transformer.Event, messageBufferSize),
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
